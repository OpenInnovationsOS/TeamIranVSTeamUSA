import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

// Styled Components
const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  font-family: 'Segoe UI', system-ui, sans-serif;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #ff6b6b, #0088cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 107, 107, 0.3);
`;

// Battle Arena Screen
const BattleArenaScreen = styled.div`
  display: ${props => props.show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  position: relative;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%);
  border-radius: 20px;
  padding: 40px;
  margin: 20px 0;
`;

const BattleField = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 40px;
  align-items: center;
  width: 100%;
  max-width: 1200px;
`;

const CharacterCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 2px solid ${props => props.isPlayer ? '#0088cc' : '#ff6b6b'};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.isPlayer ? 'linear-gradient(90deg, #0088cc, #00aaff)' : 'linear-gradient(90deg, #ff6b6b, #ff8e8e)'};
  }
`;

const CharacterAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.faction === 'iran' ? 
    'linear-gradient(135deg, #00a8ff, #0066cc)' : 
    'linear-gradient(135deg, #ff6b6b, #ff3333)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 20px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  ${props => props.isAttacking && `
    animation: attack 0.5s ease-in-out;
  `}
  
  ${props => props.isDamaged && `
    animation: damage 0.5s ease-in-out;
  `}
  
  @keyframes attack {
    0%, 100% { transform: translateX(0) scale(1); }
    50% { transform: translateX(20px) scale(1.1); }
  }
  
  @keyframes damage {
    0%, 100% { transform: translateX(0); filter: brightness(1); }
    25% { transform: translateX(-10px); filter: brightness(1.5) hue-rotate(180deg); }
    50% { transform: translateX(10px); filter: brightness(1.5) hue-rotate(180deg); }
    75% { transform: translateX(-5px); filter: brightness(1.2) hue-rotate(90deg); }
  }
`;

const CharacterName = styled.h3`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
  text-align: center;
`;

const CharacterLevel = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  text-align: center;
`;

const HealthBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  height: 24px;
  overflow: hidden;
  margin-bottom: 10px;
  position: relative;
`;

const HealthBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff3333, #ff6666);
  border-radius: 10px;
  transition: width 0.5s ease-in-out;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,0.3), transparent);
  }
`;

const ManaBarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  height: 16px;
  overflow: hidden;
  margin-bottom: 15px;
`;

const ManaBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3366ff, #6699ff);
  border-radius: 10px;
  transition: width 0.3s ease-in-out;
`;

const HealthText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const BattleStatus = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 15px;
`;

const BattleActions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled(motion.button)`
  background: ${props => {
    switch(props.type) {
      case 'attack': return 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
      case 'skill': return 'linear-gradient(45deg, #ffaa00, #ffcc66)';
      case 'defend': return 'linear-gradient(45deg, #0088cc, #00aaff)';
      case 'item': return 'linear-gradient(45deg, #00cc88, #66ffcc)';
      default: return 'linear-gradient(45deg, #666666, #999999)';
    }
  }};
  color: #ffffff;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
  position: relative;
  overflow: hidden;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const BattleLog = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogEntry = styled.div`
  margin-bottom: 8px;
  padding: 5px;
  border-radius: 5px;
  background: ${props => props.type === 'damage' ? 'rgba(255, 0, 0, 0.2)' : 
                  props.type === 'heal' ? 'rgba(0, 255, 0, 0.2)' : 
                  props.type === 'skill' ? 'rgba(255, 255, 0, 0.2)' : 
                  'rgba(255, 255, 255, 0.1)'};
  
  &::before {
    content: '${props => props.timestamp}';
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin-right: 8px;
  }
`;

const DamageNumber = styled(motion.div)`
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.type === 'critical' ? '#ff3333' : 
                  props.type === 'miss' ? '#666666' : 
                  props.type === 'heal' ? '#00ff00' : '#ffffff'};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  z-index: 1000;
`;

const TurnIndicator = styled.div`
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
`;

const VictoryScreen = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const VictoryContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  border: 2px solid ${props => props.victory ? '#00ff00' : '#ff3333'};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const VictoryTitle = styled.h2`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 20px;
  background: ${props => props.victory ? 
    'linear-gradient(45deg, #00ff00, #66ff66)' : 
    'linear-gradient(45deg, #ff3333, #ff6666)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const VictoryStats = styled.div`
  margin: 20px 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
`;

const VictoryButton = styled(motion.button)`
  background: ${props => props.victory ? 
    'linear-gradient(45deg, #00ff00, #66ff66)' : 
    'linear-gradient(45deg, #ff3333, #ff6666)'};
  color: #000000;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
`;

// Setup Screen
const SetupScreen = styled.div`
  display: ${props => props.show ? 'block' : 'none'};
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
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }
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

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 10px;
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

// Battle Engine Class
class BattleEngine {
  constructor(player, opponent, weapon, territory) {
    this.player = {
      ...player,
      maxHealth: 100 + (player.level * 10),
      maxMana: 50 + (player.level * 5),
      health: 100 + (player.level * 10),
      mana: 50 + (player.level * 5),
      attack: 10 + (player.level * 2),
      defense: 5 + (player.level * 1),
      speed: 10,
      critical: 0.05,
      statusEffects: []
    };
    
    this.opponent = {
      ...opponent,
      maxHealth: 100 + (opponent.level * 10),
      maxMana: 50 + (opponent.level * 5),
      health: 100 + (opponent.level * 10),
      mana: 50 + (opponent.level * 5),
      attack: 10 + (opponent.level * 2),
      defense: 5 + (opponent.level * 1),
      speed: 10,
      critical: 0.05,
      statusEffects: []
    };
    
    this.weapon = weapon;
    this.territory = territory;
    this.currentTurn = 'player';
    this.turnCount = 0;
    this.battleLog = [];
    this.isOver = false;
    this.winner = null;
    this.battleQuality = 'normal';
    
    // Apply weapon bonuses
    this.applyWeaponBonuses();
    // Apply territory bonuses
    this.applyTerritoryBonuses();
    // Apply faction bonuses
    this.applyFactionBonuses();
  }
  
  applyWeaponBonuses() {
    this.player.attack += this.weapon.power;
    this.player.defense += this.weapon.defense;
    this.player.critical += this.weapon.critical;
  }
  
  applyTerritoryBonuses() {
    const attacker = this.currentTurn === 'player' ? this.player : this.opponent;
    const defender = this.currentTurn === 'player' ? this.opponent : this.player;
    
    attacker.attack += this.territory.attack_bonus;
    defender.defense += this.territory.defense_bonus;
  }
  
  applyFactionBonuses() {
    // Player faction bonuses
    if (this.player.faction === 'iran') {
      this.player.defense *= 1.2;
    } else if (this.player.faction === 'usa') {
      this.player.attack *= 1.2;
    }
    
    // Opponent faction bonuses
    if (this.opponent.faction === 'iran') {
      this.opponent.defense *= 1.2;
    } else if (this.opponent.faction === 'usa') {
      this.opponent.attack *= 1.2;
    }
  }
  
  calculateDamage(attacker, defender, isCritical = false) {
    const baseDamage = attacker.attack;
    const defense = defender.defense;
    const damageReduction = defense / (defense + 100);
    const damage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
    
    const criticalMultiplier = isCritical ? 2 : 1;
    const finalDamage = Math.floor(damage * criticalMultiplier);
    
    return finalDamage;
  }
  
  executeAttack(attacker, defender, isPlayer = true) {
    const criticalChance = attacker.critical;
    const isCritical = Math.random() < criticalChance;
    const damage = this.calculateDamage(attacker, defender, isCritical);
    
    defender.health = Math.max(0, defender.health - damage);
    
    const logEntry = {
      type: 'damage',
      message: `${isPlayer ? 'Player' : 'Opponent'} attacks for ${damage} damage${isCritical ? ' (CRITICAL!)' : ''}`,
      damage,
      isCritical,
      attacker: isPlayer ? 'player' : 'opponent',
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.battleLog.push(logEntry);
    
    // Check for battle over
    if (defender.health <= 0) {
      this.isOver = true;
      this.winner = isPlayer ? 'player' : 'opponent';
      this.calculateBattleQuality();
    }
    
    return {
      damage,
      isCritical,
      targetHealth: defender.health,
      isOver: this.isOver,
      winner: this.winner
    };
  }
  
  executeSkill(attacker, defender, skillType, isPlayer = true) {
    let result = { damage: 0, healing: 0, effects: [] };
    
    switch(skillType) {
      case 'power_strike':
        result.damage = this.calculateDamage(attacker, defender) * 1.5;
        defender.health = Math.max(0, defender.health - result.damage);
        result.effects.push('power_strike');
        break;
        
      case 'heal':
        result.healing = Math.floor(attacker.maxHealth * 0.3);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + result.healing);
        result.effects.push('heal');
        break;
        
      case 'defend':
        attacker.defense *= 1.5;
        result.effects.push('defend');
        setTimeout(() => {
          attacker.defense /= 1.5;
        }, 2000);
        break;
        
      case 'stun':
        result.damage = this.calculateDamage(attacker, defender) * 0.8;
        defender.health = Math.max(0, defender.health - result.damage);
        defender.statusEffects.push({ type: 'stun', duration: 1 });
        result.effects.push('stun');
        break;
    }
    
    const logEntry = {
      type: 'skill',
      message: `${isPlayer ? 'Player' : 'Opponent'} uses ${skillType.replace('_', ' ')}!`,
      ...result,
      attacker: isPlayer ? 'player' : 'opponent',
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.battleLog.push(logEntry);
    
    if (defender.health <= 0) {
      this.isOver = true;
      this.winner = isPlayer ? 'player' : 'opponent';
      this.calculateBattleQuality();
    }
    
    return result;
  }
  
  calculateBattleQuality() {
    const playerHealthPercent = this.player.health / this.player.maxHealth;
    const turnCount = this.turnCount;
    
    if (playerHealthPercent > 0.8 && turnCount < 5) {
      this.battleQuality = 'domination';
    } else if (playerHealthPercent > 0.6 && turnCount < 8) {
      this.battleQuality = 'victory';
    } else if (playerHealthPercent > 0.3) {
      this.battleQuality = 'win';
    } else {
      this.battleQuality = 'struggle';
    }
  }
  
  switchTurn() {
    this.currentTurn = this.currentTurn === 'player' ? 'opponent' : 'player';
    this.turnCount++;
  }
  
  getBattleState() {
    return {
      player: { ...this.player },
      opponent: { ...this.opponent },
      currentTurn: this.currentTurn,
      turnCount: this.turnCount,
      battleLog: [...this.battleLog],
      isOver: this.isOver,
      winner: this.winner,
      battleQuality: this.battleQuality
    };
  }
}

// Main Component
const BattleArena = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  
  // State management
  const [gamePhase, setGamePhase] = useState('setup'); // setup, battle, victory
  const [opponents, setOpponents] = useState([]);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [wager, setWager] = useState(100);
  const [selectedWeapon, setSelectedWeapon] = useState('basic_sword');
  const [selectedTerritory, setSelectedTerritory] = useState('tehran');
  const [battleEngine, setBattleEngine] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  
  // Refs
  const battleLogRef = useRef(null);
  
  // Fallback user data
  const safeUser = user || {
    id: 1,
    username: 'Player1',
    faction: 'iran',
    stg_balance: 1000,
    level: 1
  };
  
  // Game data
  const weapons = [
    { id: 'basic_sword', name: 'Basic Sword', power: 10, defense: 5, critical: 0.05, faction_bonus: { iran: 1.2, usa: 1.0 } },
    { id: 'advanced_rifle', name: 'Advanced Rifle', power: 15, defense: 3, critical: 0.08, faction_bonus: { iran: 1.0, usa: 1.3 } },
    { id: 'battle_axe', name: 'Battle Axe', power: 12, defense: 8, critical: 0.06, faction_bonus: { iran: 1.3, usa: 1.1 } },
    { id: 'sniper_rifle', name: 'Sniper Rifle', power: 18, defense: 2, critical: 0.12, faction_bonus: { iran: 1.0, usa: 1.4 } },
    { id: 'shield', name: 'Energy Shield', power: 2, defense: 15, critical: 0.02, faction_bonus: { iran: 1.4, usa: 1.2 } }
  ];
  
  const territories = [
    { id: 'tehran', name: 'Tehran', controller: 'iran', attack_bonus: 5, defense_bonus: 10, exp_bonus: 1.2 },
    { id: 'new_york', name: 'New York', controller: 'usa', attack_bonus: 10, defense_bonus: 5, exp_bonus: 1.2 },
    { id: 'los_angeles', name: 'Los Angeles', controller: 'usa', attack_bonus: 8, defense_bonus: 7, exp_bonus: 1.1 },
    { id: 'isfahan', name: 'Isfahan', controller: 'iran', attack_bonus: 3, defense_bonus: 12, exp_bonus: 1.3 },
    { id: 'chicago', name: 'Chicago', controller: 'usa', attack_bonus: 12, defense_bonus: 4, exp_bonus: 1.1 },
    { id: 'mashhad', name: 'Mashhad', controller: 'iran', attack_bonus: 4, defense_bonus: 11, exp_bonus: 1.2 }
  ];
  
  const skills = [
    { id: 'power_strike', name: 'Power Strike', manaCost: 20, damage: 1.5, type: 'attack' },
    { id: 'heal', name: 'Heal', manaCost: 15, healing: 0.3, type: 'heal' },
    { id: 'defend', name: 'Defend', manaCost: 10, defense: 1.5, type: 'defend' },
    { id: 'stun', name: 'Stun', manaCost: 25, damage: 0.8, type: 'control' }
  ];
  
  // Effects
  useEffect(() => {
    loadOpponents();
    loadBattleHistory();
  }, []);
  
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleState?.battleLog]);
  
  // Load data functions
  const loadOpponents = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const opponentList = (data.leaderboard || [])
        .filter(opponent => opponent.id !== safeUser.id)
        .slice(0, 5)
        .map(opponent => ({
          id: opponent.id,
          username: opponent.username,
          faction: opponent.faction,
          level: opponent.level,
          stg_balance: opponent.stg_balance,
          win_rate: Math.floor(Math.random() * 60) + 40
        }));
      
      setOpponents(opponentList);
    } catch (error) {
      console.error('Failed to load opponents:', error);
      setOpponents([
        { id: 2, username: 'Player2', faction: 'usa', level: 2, stg_balance: 1500, win_rate: 65 },
        { id: 3, username: 'Player3', faction: 'iran', level: 1, stg_balance: 800, win_rate: 45 },
        { id: 4, username: 'Player4', faction: 'usa', level: 3, stg_balance: 2000, win_rate: 75 },
        { id: 5, username: 'Player5', faction: 'iran', level: 1, stg_balance: 1200, win_rate: 55 }
      ]);
    }
  };
  
  const loadBattleHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const mockHistory = [
        { id: 1, opponent: 'Player2', result: 'win', wager: 100, reward: 200, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, opponent: 'Player3', result: 'lose', wager: 50, reward: 0, timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 3, opponent: 'Player4', result: 'win', wager: 150, reward: 300, timestamp: new Date(Date.now() - 10800000).toISOString() }
      ];
      
      setBattleHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load battle history:', error);
      setBattleHistory([
        { id: 1, opponent: 'Player2', result: 'win', wager: 100, reward: 200, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, opponent: 'Player3', result: 'lose', wager: 50, reward: 0, timestamp: new Date(Date.now() - 7200000).toISOString() }
      ]);
    }
  };
  
  // Battle functions
  const initiateBattle = (opponent) => {
    if (wager < 100) {
      toast.error('Minimum wager is 100 STG');
      return;
    }
    
    if (wager > safeUser.stg_balance) {
      toast.error('Insufficient STG balance');
      return;
    }
    
    const weapon = weapons.find(w => w.id === selectedWeapon);
    const territory = territories.find(t => t.id === selectedTerritory);
    
    const engine = new BattleEngine(safeUser, opponent, weapon, territory);
    setBattleEngine(engine);
    setBattleState(engine.getBattleState());
    setSelectedOpponent(opponent);
    setGamePhase('battle');
    hapticFeedback('impact');
    
    toast.success('⚔️ Battle Started!');
  };
  
  const executePlayerAction = async (actionType, actionData) => {
    if (isAnimating || battleState.currentTurn !== 'player') return;
    
    setIsAnimating(true);
    hapticFeedback('impact');
    
    let result;
    const attacker = battleState.player;
    const defender = battleState.opponent;
    
    switch (actionType) {
      case 'attack':
        result = battleEngine.executeAttack(attacker, defender, true);
        showDamageNumber('opponent', result.damage, result.isCritical);
        break;
        
      case 'skill':
        result = battleEngine.executeSkill(attacker, defender, actionData, true);
        if (result.damage) {
          showDamageNumber('opponent', result.damage, false);
        }
        if (result.healing) {
          showDamageNumber('player', result.healing, 'heal');
        }
        break;
    }
    
    setBattleState(battleEngine.getBattleState());
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (battleState.isOver) {
      handleBattleEnd();
    } else {
      battleEngine.switchTurn();
      setBattleState(battleEngine.getBattleState());
      // Opponent turn
      setTimeout(() => executeOpponentTurn(), 1500);
    }
    
    setIsAnimating(false);
  };
  
  const executeOpponentTurn = async () => {
    if (battleState.isOver) return;
    
    setIsAnimating(true);
    
    // Simple AI
    const attacker = battleState.opponent;
    const defender = battleState.player;
    
    // Random action
    const actionType = Math.random() < 0.7 ? 'attack' : 'skill';
    let result;
    
    if (actionType === 'attack') {
      result = battleEngine.executeAttack(attacker, defender, false);
      showDamageNumber('player', result.damage, result.isCritical);
    } else {
      const availableSkills = skills.filter(s => s.manaCost <= attacker.mana);
      if (availableSkills.length > 0) {
        const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        result = battleEngine.executeSkill(attacker, defender, skill.id, false);
        if (result.damage) {
          showDamageNumber('player', result.damage, false);
        }
        if (result.healing) {
          showDamageNumber('opponent', result.healing, 'heal');
        }
      } else {
        result = battleEngine.executeAttack(attacker, defender, false);
        showDamageNumber('player', result.damage, result.isCritical);
      }
    }
    
    setBattleState(battleEngine.getBattleState());
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (battleState.isOver) {
      handleBattleEnd();
    } else {
      battleEngine.switchTurn();
      setBattleState(battleEngine.getBattleState());
    }
    
    setIsAnimating(false);
  };
  
  const showDamageNumber = (target, damage, type = 'normal') => {
    const id = Date.now();
    const newDamageNumber = {
      id,
      target,
      damage,
      type,
      x: Math.random() * 100 - 50,
      y: Math.random() * 50 - 25
    };
    
    setDamageNumbers(prev => [...prev, newDamageNumber]);
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 2000);
  };
  
  const handleBattleEnd = () => {
    const isVictory = battleState.winner === 'player';
    const quality = battleState.battleQuality;
    
    // Calculate rewards
    let baseReward = wager * 2;
    let experience = Math.round(wager * 0.5);
    
    const qualityMultipliers = {
      domination: 2.0,
      victory: 1.5,
      win: 1.2,
      struggle: 1.0
    };
    
    const multiplier = qualityMultipliers[quality] || 1.0;
    const finalReward = Math.round(baseReward * multiplier);
    const finalExperience = Math.round(experience * multiplier);
    
    // Show victory screen
    setGamePhase('victory');
    
    // Add to history
    const newBattle = {
      id: Date.now(),
      opponent: selectedOpponent.username,
      result: isVictory ? 'win' : 'lose',
      wager,
      reward: isVictory ? finalReward : 0,
      experience: isVictory ? finalExperience : 0,
      battle_quality: quality,
      territory: selectedTerritory,
      weapon: selectedWeapon,
      timestamp: new Date().toISOString()
    };
    
    setBattleHistory(prev => [newBattle, ...prev]);
    
    // Show toast
    if (isVictory) {
      toast.success(`🎉 VICTORY! +${finalReward} STG +${finalExperience} XP`);
      if (quality === 'domination') {
        toast.success('🏆 DOMINATION! Maximum rewards!');
      }
    } else {
      toast.error('💀 DEFEAT! Better luck next time!');
    }
  };
  
  const returnToSetup = () => {
    setGamePhase('setup');
    setSelectedOpponent(null);
    setBattleEngine(null);
    setBattleState(null);
    setDamageNumbers([]);
  };
  
  return (
    <Container>
      <Title>⚔️ Battle Arena</Title>
      
      {/* Setup Screen */}
      <SetupScreen show={gamePhase === 'setup'}>
        <WagerInput>
          <SectionTitle>Battle Configuration</SectionTitle>
          
          <div style={{ marginBottom: '15px' }}>
            <SectionTitle>Weapon Selection</SectionTitle>
            <Select value={selectedWeapon} onChange={(e) => setSelectedWeapon(e.target.value)}>
              {weapons.map(weapon => (
                <option key={weapon.id} value={weapon.id}>
                  {weapon.name} (ATK:{weapon.power} DEF:{weapon.defense} CRIT:{(weapon.critical * 100).toFixed(1)}%)
                </option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <SectionTitle>Territory Selection</SectionTitle>
            <Select value={selectedTerritory} onChange={(e) => setSelectedTerritory(e.target.value)}>
              {territories.map(territory => (
                <option key={territory.id} value={territory.id}>
                  {territory.name} ({territory.controller.toUpperCase()}) ATK+{territory.attack_bonus} DEF+{territory.defense_bonus} EXP+{territory.exp_bonus}x
                </option>
              ))}
            </Select>
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

          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
            <strong>Strategy Tips:</strong><br/>
            • {safeUser.faction === 'usa' ? '🇺🇸 USA gets 20% attack bonus' : '🇮🇷 Iran gets 20% defense bonus'}<br/>
            • Controlling your faction's territory gives 50% bonus<br/>
            • Choose weapons that match your faction's strengths<br/>
            • Critical hits deal 2x damage
          </div>
        </WagerInput>

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
                onClick={() => initiateBattle(opponent)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: opponents.indexOf(opponent) * 0.1 }}
              >
                <OpponentInfo>
                  <OpponentName>
                    {opponent.username} {opponent.faction === 'iran' ? ' 🇮🇷' : ' 🇺🇸'}
                  </OpponentName>
                  <OpponentStats>
                    Level {opponent.level} • {opponent.stg_balance.toLocaleString()} STG • {opponent.win_rate}% win rate
                  </OpponentStats>
                </OpponentInfo>
                <BattleButton
                  disabled={wager > (user?.stg_balance || 0)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Battle
                </BattleButton>
              </OpponentCard>
            ))
          )}
        </OpponentsList>
      </SetupScreen>
      
      {/* Battle Screen */}
      <BattleArenaScreen show={gamePhase === 'battle'}>
        <TurnIndicator>
          {battleState?.currentTurn === 'player' ? '🟢 Your Turn' : '🔴 Opponent Turn'}
        </TurnIndicator>
        
        <BattleField>
          {/* Player Character */}
          <CharacterCard isPlayer={true}>
            <CharacterAvatar 
              faction={safeUser.faction} 
              isPlayer={true}
              isAttacking={isAnimating && battleState?.currentTurn === 'player'}
              isDamaged={isAnimating && battleState?.currentTurn === 'opponent'}
            >
              {safeUser.faction === 'iran' ? '🇮🇷' : '🇺🇸'}
            </CharacterAvatar>
            <CharacterName>{safeUser.username}</CharacterName>
            <CharacterLevel>Level {safeUser.level}</CharacterLevel>
            
            <HealthBarContainer>
              <HealthBar style={{ width: `${(battleState?.player?.health || 0) / (battleState?.player?.maxHealth || 1) * 100}%` }} />
              <HealthText>{battleState?.player?.health || 0} / {battleState?.player?.maxHealth || 0}</HealthText>
            </HealthBarContainer>
            
            <ManaBarContainer>
              <ManaBar style={{ width: `${(battleState?.player?.mana || 0) / (battleState?.player?.maxMana || 1) * 100}%` }} />
            </ManaBarContainer>
            
            <BattleStatus>
              ATK: {battleState?.player?.attack || 0} | DEF: {battleState?.player?.defense || 0} | CRIT: {((battleState?.player?.critical || 0) * 100).toFixed(1)}%
            </BattleStatus>
            
            {battleState?.currentTurn === 'player' && (
              <BattleActions>
                <ActionButton
                  type="attack"
                  onClick={() => executePlayerAction('attack')}
                  disabled={isAnimating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚔️ Attack
                </ActionButton>
                
                {skills.map(skill => (
                  <ActionButton
                    key={skill.id}
                    type="skill"
                    onClick={() => executePlayerAction('skill', skill.id)}
                    disabled={isAnimating || (battleState?.player?.mana || 0) < skill.manaCost}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {skill.name} ({skill.manaCost} MP)
                  </ActionButton>
                ))}
              </BattleActions>
            )}
          </CharacterCard>
          
          {/* VS */}
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#ffffff',
            textShadow: '0 0 20px rgba(255,255,255,0.5)'
          }}>
            VS
          </div>
          
          {/* Opponent Character */}
          <CharacterCard isPlayer={false}>
            <CharacterAvatar 
              faction={selectedOpponent?.faction || 'usa'}
              isPlayer={false}
              isAttacking={isAnimating && battleState?.currentTurn === 'opponent'}
              isDamaged={isAnimating && battleState?.currentTurn === 'player'}
            >
              {selectedOpponent?.faction === 'iran' ? '🇮🇷' : '🇺🇸'}
            </CharacterAvatar>
            <CharacterName>{selectedOpponent?.username || 'Opponent'}</CharacterName>
            <CharacterLevel>Level {selectedOpponent?.level || 1}</CharacterLevel>
            
            <HealthBarContainer>
              <HealthBar style={{ width: `${(battleState?.opponent?.health || 0) / (battleState?.opponent?.maxHealth || 1) * 100}%` }} />
              <HealthText>{battleState?.opponent?.health || 0} / {battleState?.opponent?.maxHealth || 0}</HealthText>
            </HealthBarContainer>
            
            <ManaBarContainer>
              <ManaBar style={{ width: `${(battleState?.opponent?.mana || 0) / (battleState?.opponent?.maxMana || 1) * 100}%` }} />
            </ManaBarContainer>
            
            <BattleStatus>
              ATK: {battleState?.opponent?.attack || 0} | DEF: {battleState?.opponent?.defense || 0} | CRIT: {((battleState?.opponent?.critical || 0) * 100).toFixed(1)}%
            </BattleStatus>
          </CharacterCard>
        </BattleField>
        
        {/* Battle Log */}
        <BattleLog ref={battleLogRef}>
          {battleState?.battleLog?.map((entry, index) => (
            <LogEntry key={index} type={entry.type}>
              {entry.message}
            </LogEntry>
          ))}
        </BattleLog>
        
        {/* Damage Numbers */}
        <AnimatePresence>
          {damageNumbers.map(damage => (
            <DamageNumber
              key={damage.id}
              type={damage.type}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{
                left: damage.target === 'player' ? '20%' : '80%',
                top: '40%',
                transform: `translate(${damage.x}px, ${damage.y}px)`
              }}
            >
              {damage.type === 'heal' ? '+' : '-'}{damage.damage}
              {damage.type === 'critical' && '💥'}
            </DamageNumber>
          ))}
        </AnimatePresence>
      </BattleArenaScreen>
      
      {/* Victory Screen */}
      <AnimatePresence>
        {gamePhase === 'victory' && (
          <VictoryScreen
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VictoryContent
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              victory={battleState?.winner === 'player'}
            >
              <VictoryTitle victory={battleState?.winner === 'player'}>
                {battleState?.winner === 'player' ? '🎉 VICTORY!' : '💀 DEFEAT'}
              </VictoryTitle>
              
              <VictoryStats>
                {battleState?.winner === 'player' ? (
                  <>
                    <div>🏆 Battle Quality: {battleState?.battleQuality?.toUpperCase()}</div>
                    <div>💰 Reward: {wager * 2} STG</div>
                    <div>⭐ Experience: +{Math.round(wager * 0.5)} XP</div>
                    <div>⚔️ Turns: {battleState?.turnCount}</div>
                  </>
                ) : (
                  <>
                    <div>💔 Better luck next time!</div>
                    <div>💸 Lost: {wager} STG</div>
                    <div>⚔️ Turns: {battleState?.turnCount}</div>
                  </>
                )}
              </VictoryStats>
              
              <VictoryButton
                victory={battleState?.winner === 'player'}
                onClick={returnToSetup}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue
              </VictoryButton>
            </VictoryContent>
          </VictoryScreen>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default BattleArena;
