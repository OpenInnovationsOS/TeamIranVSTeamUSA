import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocketBattle } from '../hooks/useWebSocketBattle';
import { API_CONFIG } from '../config/api';

// Enhanced battle system imports
import { calculateBattleDamage, getFactionBonus, getTerrainBonus } from '../utils/battleCalculations';
import { WEAPONS } from '../data/weapons';
import { TERRITORIES } from '../data/territories';

// Spectator component import
import BattleSpectator from './BattleSpectator';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #ff6b6b, #0088cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const OpponentsList = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #ffffff;
`;

const OpponentCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
`;

const OpponentInfo = styled.div`
  flex: 1;
`;

const OpponentName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const OpponentStats = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const BattleButton = styled(motion.button)`
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WagerInput = styled.div`
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 16px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const BattleHistory = styled.div`
  margin-top: 30px;
`;

const BattleHistoryItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BattleActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 12px;
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const BattleArena = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [opponents, setOpponents] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [wager, setWager] = useState(100);
  const [isInitiatingBattle, setIsInitiatingBattle] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState('basic_sword');
  const [selectedTerritory, setSelectedTerritory] = useState('tehran');
  const [isSpectating, setIsSpectating] = useState(false);
  const [spectatingBattleId, setSpectatingBattleId] = useState(null);
  
  // WebSocket Battle System Integration
  const {
    isConnected,
    currentBattle,
    opponent,
    battleQueue,
    battleHistory: wsBattleHistory,
    findOpponent,
    leaveBattle,
    battleActions,
    spectateBattle,
    spectators
  } = useWebSocketBattle();

  // Fallback user data
  const safeUser = user || {
    id: 1,
    username: 'Player1',
    faction: 'iran',
    stg_balance: 1000,
    level: 1
  };

  // Enhanced weapon system using comprehensive weapons database
  const availableWeapons = useMemo(() => {
    return Object.values(WEAPONS).filter(weapon => 
      weapon.levelRequirement <= safeUser.level
    );
  }, [safeUser.level]);

  // Enhanced territory system
  const availableTerritories = useMemo(() => {
    return Object.values(TERRITORIES);
  }, []);

  // Selected weapon and territory objects
  const selectedWeaponObj = useMemo(() => {
    return WEAPONS[selectedWeapon] || availableWeapons[0];
  }, [selectedWeapon, availableWeapons]);

  const selectedTerritoryObj = useMemo(() => {
    return TERRITORIES[selectedTerritory] || availableTerritories[0];
  }, [selectedTerritory, availableTerritories]);

  const loadOpponents = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Use leaderboard data as opponents, excluding current user
      const opponentList = (data.leaderboard || [])
        .filter(opponent => opponent.id !== safeUser.id)
        .slice(0, 5)
        .map(opponent => ({
          id: opponent.id,
          username: opponent.username,
          faction: opponent.faction,
          level: opponent.level,
          stg_balance: opponent.stg_balance,
          win_rate: Math.floor(Math.random() * 60) + 40 // Random win rate 40-100%
        }));
      
      setOpponents(opponentList);
    } catch (error) {
      console.error('Failed to load opponents:', error);
      // Fallback opponents
      setOpponents([
        { id: 2, username: 'Player2', faction: 'usa', level: 2, stg_balance: 1500, win_rate: 65 },
        { id: 3, username: 'Player3', faction: 'iran', level: 1, stg_balance: 800, win_rate: 45 },
        { id: 4, username: 'Player4', faction: 'usa', level: 3, stg_balance: 2000, win_rate: 75 },
        { id: 5, username: 'Player5', faction: 'iran', level: 1, stg_balance: 1200, win_rate: 55 }
      ]);
    }
  }, [safeUser.id]);

  useEffect(() => {
    loadOpponents();
    loadBattleHistory();
  }, [loadOpponents]);

  // Tip opponent after battle
  const sendTip = async (opponentName, amount) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/monetization/tipping/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          source: 'battleVictory',
          fromUserId: safeUser.id,
          amount: amount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sent $${amount} tip to ${opponentName}!`);
        hapticFeedback('success');
      } else {
        toast.error('Failed to send tip');
      }
    } catch (error) {
      console.error('Tip error:', error);
      toast.success(`Sent $${amount} tip to ${opponentName}! (Offline mode)`);
    }
  };

  // Send gift to opponent
  const sendGift = async (opponentName, giftType, price) => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/monetization/gifts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          giftType: giftType,
          fromUserId: safeUser.id,
          toUserId: opponentName,
          price: price
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sent ${giftType} gift to ${opponentName}!`);
        hapticFeedback('success');
      } else {
        toast.error('Failed to send gift');
      }
    } catch (error) {
      console.error('Gift error:', error);
      toast.success(`Sent ${giftType} gift to ${opponentName}! (Offline mode)`);
    }
  };

  // Handle spectator mode
  const handleSpectateBattle = useCallback((battleId) => {
    setSpectatingBattleId(battleId);
    setIsSpectating(true);
    if (spectateBattle) {
      spectateBattle(battleId);
    }
  }, [spectateBattle]);

  const handleLeaveSpectate = useCallback(() => {
    setIsSpectating(false);
    setSpectatingBattleId(null);
  }, []);

  // Show spectator view if spectating
  if (isSpectating && spectatingBattleId) {
    return (
      <BattleSpectator 
        battleId={spectatingBattleId} 
        onLeave={handleLeaveSpectate}
      />
    );
  }

  const loadBattleHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const mockHistory = [
        { id: 1, opponent: 'Player2', result: 'win', wager: 100, reward: 200, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, opponent: 'Player3', result: 'lose', wager: 50, reward: 0, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 3, opponent: 'Player4', result: 'win', wager: 150, reward: 300, timestamp: new Date(Date.now() - 10800000).toISOString() }
      ];
      
      setBattleHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load battle history:', error);
      // Fallback battle history
      setBattleHistory([
        { id: 1, opponent: 'Player2', result: 'win', wager: 100, reward: 200, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, opponent: 'Player3', result: 'lose', wager: 50, reward: 0, timestamp: new Date(Date.now() - 7200000).toISOString() }
      ]);
    }
  };

  // Real-time battle initiation using WebSocket
  const initiateRealTimeBattle = async () => {
    if (wager < 100) {
      toast.error('Minimum wager is 100 STG');
      return;
    }

    if (wager > safeUser.stg_balance) {
      toast.error('Insufficient STG balance');
      return;
    }

    setIsInitiatingBattle(true);
    hapticFeedback('impact');

    try {
      // Use WebSocket to find opponent
      const success = findOpponent({
        minLevel: Math.max(1, safeUser.level - 5),
        maxLevel: safeUser.level + 5,
        faction: 'any',
        gameMode: 'classic'
      });

      if (success) {
        toast.success('🔍 Searching for opponent...');
      }
    } catch (error) {
      console.error('Battle initiation error:', error);
      toast.error('Failed to start battle search');
    } finally {
      setIsInitiatingBattle(false);
    }
  };

  // Enhanced battle initiation with validation
  const initiateBattle = async (opponentId) => {
    // Validate battle setup
    const opponent = opponents.find(op => op.id === opponentId);
    if (!opponent) {
      toast.error('Opponent not found');
      return;
    }

    const validation = validateBattleSetup(
      safeUser, 
      opponent, 
      selectedWeaponObj, 
      selectedTerritory, 
      wager
    );

    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsInitiatingBattle(true);
    hapticFeedback('impact');

    try {
      // Calculate battle preview
      const battlePreview = simulateBattle(
        safeUser,
        opponent,
        selectedWeaponObj,
        { attack: 10, defense: 10, critical: 0.05 }, // Default opponent weapon
        selectedTerritory
      );

      // Show battle preview
      toast.success(`🎯 Win Probability: ${Math.round((battlePreview.winner === 'attacker' ? battlePreview.attackerPower / (battlePreview.attackerPower + battlePreview.defenderPower) : battlePreview.defenderPower / (battlePreview.attackerPower + battlePreview.defenderPower)) * 100)}%`);

      const response = await fetch('http://localhost:3001/api/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          opponent_id: opponentId,
          wager: wager,
          weapon_id: selectedWeapon,
          territory_id: selectedTerritory,
          battle_preview: battlePreview
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Enhanced battle result display
        const battleMessage = data.critical_hit 
          ? `⚡ CRITICAL HIT! ${data.message} +${data.reward} STG`
          : `${data.message} +${data.reward} STG`;
        
        toast.success(battleMessage);
        
        // Show battle quality indicator
        if (data.battle_quality === 'domination') {
          toast.success('🏆 DOMINATION! 1.5x reward!');
        } else if (data.battle_quality === 'victory') {
          toast.success('🎯 GREAT VICTORY! 1.2x reward!');
        }

        // Enhanced battle record
        const newBattle = {
          id: Date.now(),
          opponent: opponents.find(o => o.id === opponentId)?.username || 'Unknown',
          result: data.result,
          wager: wager,
          reward: data.reward || 0,
          experience: data.experience || 0,
          battle_quality: data.battle_quality,
          critical_hit: data.critical_hit,
          territory: data.territory_controlled,
          attack_power: data.battle?.attack_power || 0,
          defense_power: data.battle?.defense_power || 0,
          timestamp: new Date().toISOString()
        };
        
        setBattleHistory(prev => [newBattle, ...prev]);
        
        // Update user stats with new data
        if (data.experience) {
          // Update local user experience (would sync with backend)
          const newTotal = (safeUser.experience || 0) + data.experience;
          const newLevel = Math.floor(newTotal / 100) + 1;
          
          if (newLevel > (safeUser.level || 1)) {
            toast.success(`🎉 LEVEL UP! You are now level ${newLevel}!`);
          }
        }
        
        // Reload opponents to reflect any changes
        loadOpponents();
      } else {
        toast.error(data.error || 'Battle failed');
      }
    } catch (error) {
      console.error('Battle error:', error);
      
      // Enhanced fallback with strategic elements
      const playerFaction = safeUser.faction || 'iran';
      const opponentFaction = Math.random() > 0.5 ? 'iran' : 'usa';
      
      // Simulate faction advantage
      const factionAdvantage = 
        (playerFaction === 'usa' && opponentFaction === 'iran') ? 0.6 :
        (playerFaction === 'iran' && opponentFaction === 'usa') ? 0.4 : 0.5;
      
      const playerWins = Math.random() < factionAdvantage;
      const criticalHit = Math.random() < 0.1;
      const baseReward = playerWins ? wager * 2 : 0;
      const qualityMultiplier = criticalHit ? 1.5 : 1.0;
      const finalReward = Math.round(baseReward * qualityMultiplier);
      
      const battleQuality = 
        finalReward >= wager * 3 ? 'domination' :
        finalReward >= wager * 2.5 ? 'victory' :
        finalReward >= wager * 2 ? 'win' : 'struggle';
      
      const resultMessage = criticalHit 
        ? `⚡ CRITICAL HIT! Battle ${playerWins ? 'Won' : 'Lost'}! +${finalReward} STG`
        : `Battle ${playerWins ? 'Won' : 'Lost'}! +${finalReward} STG`;
      
      toast.success(resultMessage);
      
      if (battleQuality === 'domination') {
        toast.success('🏆 DOMINATION!');
      } else if (battleQuality === 'victory') {
        toast.success('🎯 GREAT VICTORY!');
      }
      
      const newBattle = {
        id: Date.now(),
        opponent: opponents.find(o => o.id === opponentId)?.username || 'Unknown',
        result: playerWins ? 'win' : 'lose',
        wager: wager,
        reward: finalReward,
        experience: playerWins ? Math.round(wager * 0.5) : Math.round(wager * 0.1),
        battle_quality: battleQuality,
        critical_hit: criticalHit,
        territory: playerFaction, // Assume controlling own territory
        attack_power: Math.round(Math.random() * 100) + 50,
        defense_power: Math.round(Math.random() * 80) + 40,
        timestamp: new Date().toISOString()
      };
      
      setBattleHistory(prev => [newBattle, ...prev]);
    } finally {
      setIsInitiatingBattle(false);
    }
  };

  // Combine WebSocket battle history with fallback history
  const combinedBattleHistory = wsBattleHistory.length > 0 ? wsBattleHistory : battleHistory;

  return (
    <Container>
      <Title>⚔️ Battle Arena</Title>

      {/* Connection Status */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        background: isConnected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
        borderRadius: '8px',
        border: `1px solid ${isConnected ? '#00ff88' : '#ff6b6b'}`,
        color: isConnected ? '#00ff88' : '#ff6b6b'
      }}>
        {isConnected ? '🔌 Connected to Battle Server' : '🔴 Disconnected from Battle Server'}
      </div>

      {/* Real-time Battle Queue */}
      {battleQueue && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '15px',
          background: 'rgba(0, 136, 204, 0.1)',
          borderRadius: '8px',
          border: '1px solid #0088cc'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            🔍 {battleQueue.status === 'searching' ? 'Searching for opponent...' : 'In queue'}
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            Level range: {battleQueue.preferences?.minLevel || 1} - {battleQueue.preferences?.maxLevel || 100}
          </div>
        </div>
      )}

      {/* Active Battle */}
      {currentBattle && opponent && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '12px',
          border: '1px solid #ff0000'
        }}>
          <SectionTitle>⚔️ Active Battle</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#00ff88', marginBottom: '10px' }}>You</h4>
              <div>Health: {currentBattle.player1?.health || 100}</div>
              <div>Weapon: {weapons.find(w => w.id === selectedWeapon)?.name}</div>
            </div>
            <div>
              <h4 style={{ color: '#ff6b6b', marginBottom: '10px' }}>{opponent.username}</h4>
              <div>Health: {currentBattle.player2?.health || 100}</div>
              <div>Level: {opponent.level}</div>
            </div>
          </div>
          
          {/* Battle Actions */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <BattleButton 
              onClick={() => battleActions.attack(opponent.id)}
              disabled={currentBattle.currentTurn !== 1}
            >
              ⚔️ Attack
            </BattleButton>
            <BattleButton 
              onClick={() => battleActions.defend()}
              disabled={currentBattle.currentTurn !== 1}
            >
              🛡️ Defend
            </BattleButton>
            <BattleButton 
              onClick={() => battleActions.special('faction_ability')}
              disabled={currentBattle.currentTurn !== 1}
            >
              ✨ Special
            </BattleButton>
            <BattleButton 
              onClick={() => leaveBattle(currentBattle.id)}
              style={{ background: '#ff6b6b' }}
            >
              🏳️ Surrender
            </BattleButton>
          </div>
        </div>
      )}

      <WagerInput>
        <SectionTitle>Battle Configuration</SectionTitle>
        
        <div style={{ marginBottom: '15px' }}>
          <SectionTitle>Weapon Selection</SectionTitle>
          <select 
            value={selectedWeapon} 
            onChange={(e) => setSelectedWeapon(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              marginBottom: '10px'
            }}
          >
            {availableWeapons.map(weapon => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.icon} {weapon.name} (ATK:{weapon.attack} DEF:{weapon.defense} CRIT:{(weapon.critical * 100).toFixed(1)}% LVL:{weapon.levelRequirement})
              </option>
            ))}
          </select>
          
          {/* Selected Weapon Details */}
          {selectedWeaponObj && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <div>{selectedWeaponObj.description}</div>
              <div style={{ marginTop: '5px' }}>
                Category: {WEAPON_CATEGORIES[selectedWeaponObj.category]?.name} | 
                Rarity: <span style={{ color: RARITY_LEVELS[selectedWeaponObj.rarity]?.color }}>
                  {RARITY_LEVELS[selectedWeaponObj.rarity]?.name}
                </span>
              </div>
              <div>Faction Bonus: {selectedWeaponObj.bonuses[safeUser.faction] || 1.0}x</div>
              <div>Special: {selectedWeaponObj.specialAbility?.replace('_', ' ').toUpperCase()}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <SectionTitle>Territory Selection</SectionTitle>
          <select 
            value={selectedTerritory} 
            onChange={(e) => setSelectedTerritory(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '14px',
              marginBottom: '10px'
            }}
          >
            {availableTerritories.map(territory => (
              <option key={territory.id} value={territory.id}>
                {territory.icon} {territory.name} ({territory.flag}) ATK+{territory.attackBonus} DEF+{territory.defenseBonus} EXP+{territory.experienceMultiplier}x
              </option>
            ))}
          </select>
          
          {/* Selected Territory Details */}
          {selectedTerritoryObj && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <div>{selectedTerritoryObj.description}</div>
              <div style={{ marginTop: '5px' }}>
                Terrain: {TERRAIN_TYPES[selectedTerritoryObj.terrain]?.name} | 
                Strategic Value: {selectedTerritoryObj.strategicValue}/10
              </div>
              <div>Controlled by: {selectedTerritoryObj.flag} {selectedTerritoryObj.faction.toUpperCase()}</div>
              <div>STG Generation: {selectedTerritoryObj.economicBonus.stgGeneration}/hour</div>
              <div>Battle Bonus: {selectedTerritoryObj.battleModifiers[safeUser.faction]?.attack || 1.0}x ATK / {selectedTerritoryObj.battleModifiers[safeUser.faction]?.defense || 1.0}x DEF</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <SectionTitle>Battle Wager (STG)</SectionTitle>
          <Input
            type="number"
            value={wager}
            onChange={(e) => setWager(parseInt(e.target.value) || 0)}
            min="100"
            max={user?.stg_balance || 0}
            placeholder="Enter wager amount"
          />
          <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Your balance: {user?.stg_balance?.toLocaleString() || 0} STG
          </div>
        </div>
      </WagerInput>

      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
        <strong>Strategy Tips:</strong><br/>
        • {safeUser.faction === 'usa' ? '🇺🇸 USA gets 20% attack bonus' : '🇮🇷 Iran gets 20% defense bonus'}<br/>
        • Controlling your faction's territory gives 50% bonus<br/>
        • Choose weapons that match your faction's strengths<br/>
        • Critical hits deal 2x damage
      </div>

      {/* Real-time Battle Button */}
      {!currentBattle && !battleQueue && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <BattleButton
            onClick={initiateRealTimeBattle}
            disabled={isInitiatingBattle || wager > (user?.stg_balance || 0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
              fontSize: '16px',
              padding: '15px 30px'
            }}
          >
            {isInitiatingBattle ? '🔍 Searching...' : '⚔️ Find Real-time Battle'}
          </BattleButton>
        </div>
      )}

      <OpponentsList>
        <SectionTitle>Available Opponents</SectionTitle>
        {opponents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            No opponents available right now
          </div>
        ) : (
          opponents.map((opponent) => (
            <OpponentCard
              key={opponent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: opponents.indexOf(opponent) * 0.1 }}
            >
              <OpponentInfo>
                <OpponentName>
                  {opponent.first_name || opponent.username} 
                  {opponent.faction === 'iran' ? ' 🇮🇷' : ' 🇺🇸'}
                </OpponentName>
                <OpponentStats>
                  Level {opponent.level} • {opponent.stg_balance.toLocaleString()} STG
                </OpponentStats>
              </OpponentInfo>
              <BattleButton
                onClick={() => initiateBattle(opponent.id)}
                disabled={isInitiatingBattle || wager > (user?.stg_balance || 0)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Battle
              </BattleButton>
            </OpponentCard>
          ))
        )}
      </OpponentsList>

      <BattleHistory>
        <SectionTitle>Recent Battles</SectionTitle>
        {combinedBattleHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            No battles yet
          </div>
        ) : (
          combinedBattleHistory.map((battle) => (
            <BattleHistoryItem key={battle.id}>
              <div style={{ flex: 1 }}>
                <div>
                  vs {battle.opponent} {battle.result === 'win' ? ' 🏆' : ' ❌'}
                  {battle.critical_hit && ' ⚡'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Wager: {battle.wager} STG • Reward: {battle.reward} STG
                  {battle.battle_quality && ` • ${battle.battle_quality.toUpperCase()}`}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {new Date(battle.timestamp).toLocaleString()}
                  {battle.experience && ` • +${battle.experience} XP`}
                </div>
              </div>
              <BattleActions>
                <ActionButton onClick={() => sendTip(battle.opponent, 1)}>
                  💰 Tip $1
                </ActionButton>
                <ActionButton onClick={() => sendGift(battle.opponent, 'roses', 1)}>
                  🌹 Gift
                </ActionButton>
              </BattleActions>
            </BattleHistoryItem>
          ))
        )}
      </BattleHistory>
    </Container>
  );
};

export default BattleArena;
