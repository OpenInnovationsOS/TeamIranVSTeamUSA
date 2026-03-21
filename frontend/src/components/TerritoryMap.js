// Enhanced TerritoryMap Component - Multi-Card & Multi-Tab System
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocketBattle } from '../hooks/useWebSocketBattle';
import { API_CONFIG } from '../config/api';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #00a6ff, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const TabButton = styled(motion.button)`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 166, 255, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #00a6ff, #00d4ff);
    color: #ffffff;
    border-color: transparent;
  }
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ModularCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 166, 255, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const CardContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const StatValue = styled.span`
  color: #00a6ff;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #00a6ff, #00d4ff);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 166, 255, 0.3);
  }
`;

const TerritoryMap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const TerritoryCard = styled(motion.div)`
  background: ${props => 
    props.faction === 'iran' ? 'rgba(0, 166, 82, 0.2)' : 
    props.faction === 'usa' ? 'rgba(0, 40, 104, 0.2)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  border: 2px solid ${props => 
    props.faction === 'iran' ? '#00a652' : 
    props.faction === 'usa' ? '#002868' : 
    'rgba(255, 255, 255, 0.2)'
  };
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 166, 255, 0.3);
  }
`;

const TerritoryName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
  font-size: 16px;
`;

const TerritoryFaction = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
`;

const TerritoryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const TerritoryStat = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 6px;
  text-align: center;
`;

const TerritoryStatLabel = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
`;

const TerritoryStatValue = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #00a6ff;
`;

const TerritoryAttackButton = styled(motion.button)`
  width: 100%;
  padding: 10px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`;

const BattleList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 166, 255, 0.5);
    border-radius: 3px;
  }
`;

const BattleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const BattleInfo = styled.div`
  flex: 1;
`;

const BattleTitle = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const BattleDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const BattleStatus = styled.div`
  text-align: right;
`;

const BattleResult = styled.div`
  font-size: 12px;
  font-weight: bold;
  color: ${props => props.result === 'victory' ? '#51cf66' : '#ff6b6b'};
`;

const BattleTime = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
`;

const TerritoryMapComponent = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [territories, setTerritories] = useState([]);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [territoryBattles, setTerritoryBattles] = useState([]);
  const [attacking, setAttacking] = useState(false);

  const territoryTabs = [
    { id: 'overview', label: 'Overview', icon: '🗺️' },
    { id: 'controlled', label: 'Controlled', icon: '🏰' },
    { id: 'battles', label: 'Battles', icon: '⚔️' },
    { id: 'rewards', label: 'Rewards', icon: '💎' },
    { id: 'statistics', label: 'Statistics', icon: '📊' }
  ];

  // WebSocket for real-time territory updates
  useWebSocketBattle({
    onTerritoryUpdate: (data) => {
      if (data.type === 'TERRITORY_UPDATE') {
        setTerritories(prev => 
          prev.map(territory => 
            territory.id === data.territoryId 
              ? { ...territory, ...data.updates } 
              : territory
          )
        );
      }
      if (data.type === 'TERRITORY_BATTLE') {
        setTerritoryBattles(prev => [data.battle, ...prev].slice(0, 10));
      }
    }
  });

  // Load territories data
  useEffect(() => {
    const loadTerritories = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/territory`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-faction': user?.faction || 'iran',
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTerritories(data.territories || []);
        } else {
          // Fallback data
          setTerritories([
            {
              id: 'tehran',
              name: 'Tehran',
              faction: 'iran',
              controlledBy: 'iran',
              defensePower: 2500,
              attackBonus: 5,
              defenseBonus: 10,
              expBonus: 1.2,
              lastAttack: new Date(Date.now() - 4 * 60 * 60 * 1000),
              canAttack: user?.faction === 'usa',
              description: 'Capital of Iran with strong defenses'
            },
            {
              id: 'new_york',
              name: 'New York',
              faction: 'usa',
              controlledBy: 'usa',
              defensePower: 2800,
              attackBonus: 10,
              defenseBonus: 5,
              expBonus: 1.2,
              lastAttack: new Date(Date.now() - 2 * 60 * 60 * 1000),
              canAttack: user?.faction === 'iran',
              description: 'Major USA city with economic power'
            },
            {
              id: 'los_angeles',
              name: 'Los Angeles',
              faction: 'usa',
              controlledBy: 'usa',
              defensePower: 2200,
              attackBonus: 8,
              defenseBonus: 7,
              expBonus: 1.1,
              lastAttack: new Date(Date.now() - 6 * 60 * 60 * 1000),
              canAttack: user?.faction === 'iran',
              description: 'West coast hub with entertainment industry'
            },
            {
              id: 'isfahan',
              name: 'Isfahan',
              faction: 'iran',
              controlledBy: 'iran',
              defensePower: 2000,
              attackBonus: 3,
              defenseBonus: 12,
              expBonus: 1.3,
              lastAttack: new Date(Date.now() - 8 * 60 * 60 * 1000),
              canAttack: user?.faction === 'usa',
              description: 'Historical city with cultural significance'
            },
            {
              id: 'chicago',
              name: 'Chicago',
              faction: 'usa',
              controlledBy: 'usa',
              defensePower: 2400,
              attackBonus: 12,
              defenseBonus: 4,
              expBonus: 1.1,
              lastAttack: new Date(Date.now() - 3 * 60 * 60 * 1000),
              canAttack: user?.faction === 'iran',
              description: 'Industrial center with strong manufacturing'
            },
            {
              id: 'mashhad',
              name: 'Mashhad',
              faction: 'iran',
              controlledBy: 'iran',
              defensePower: 2100,
              attackBonus: 4,
              defenseBonus: 11,
              expBonus: 1.2,
              lastAttack: new Date(Date.now() - 5 * 60 * 60 * 1000),
              canAttack: user?.faction === 'usa',
              description: 'Religious center with strategic importance'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load territories:', error);
        toast.error('Failed to load territories');
      } finally {
        setLoading(false);
      }
    };

    loadTerritories();
  }, [user?.faction, user?.id]);

  // Load territory battles
  useEffect(() => {
    const loadTerritoryBattles = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/territory/battles`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTerritoryBattles(data.battles || []);
        } else {
          // Fallback data
          setTerritoryBattles([
            {
              id: 1,
              territory: 'Tehran',
              attacker: 'USA Forces',
              defender: 'Iran Forces',
              result: 'victory',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              duration: 45,
              casualties: 234,
              reward: '5000 STG'
            },
            {
              id: 2,
              territory: 'New York',
              attacker: 'Iran Forces',
              defender: 'USA Forces',
              result: 'defeat',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
              duration: 38,
              casualties: 189,
              reward: '0 STG'
            },
            {
              id: 3,
              territory: 'Los Angeles',
              attacker: 'Iran Forces',
              defender: 'USA Forces',
              result: 'victory',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
              duration: 52,
              casualties: 267,
              reward: '6000 STG'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load territory battles:', error);
      }
    };

    if (activeTab === 'battles') {
      loadTerritoryBattles();
    }
  }, [activeTab, user?.id]);

  const attackTerritory = async (territoryId) => {
    if (!user) {
      toast.error('Please login to attack territories');
      return;
    }

    const territory = territories.find(t => t.id === territoryId);
    if (!territory.canAttack) {
      toast.error('You cannot attack this territory');
      return;
    }

    setAttacking(true);
    hapticFeedback('impact');

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/territory/attack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-faction': user?.faction || 'iran',
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          territory_id: territoryId,
          attack_force: 100 + Math.floor(Math.random() * 50),
          weapon_id: 'basic_sword'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`⚔️ Attack on ${territory.name} initiated!`);
        hapticFeedback('success');
        
        // Update territory status
        setTerritories(prev => 
          prev.map(t => 
            t.id === territoryId 
              ? { ...t, lastAttack: new Date(), canAttack: false }
              : t
          )
        );
      } else {
        toast.error(data.message || 'Failed to attack territory');
      }
    } catch (error) {
      console.error('Territory attack error:', error);
      toast.error('Failed to attack territory');
    } finally {
      setAttacking(false);
    }
  };

  const OverviewCards = () => [
    {
      id: 'territory-overview',
      title: 'Territory Overview',
      icon: '🗺️',
      content: (
        <CardContent>
          <TerritoryMap>
            {territories.map(territory => (
              <TerritoryCard
                key={territory.id}
                faction={territory.controlledBy}
                onClick={() => {
                  setSelectedTerritory(territory);
                  hapticFeedback('impact');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TerritoryName>{territory.name}</TerritoryName>
                <TerritoryFaction>
                  {territory.controlledBy.toUpperCase()} Controlled
                </TerritoryFaction>
                <TerritoryStats>
                  <TerritoryStat>
                    <TerritoryStatLabel>Defense</TerritoryStatLabel>
                    <TerritoryStatValue>{territory.defensePower}</TerritoryStatValue>
                  </TerritoryStat>
                  <TerritoryStat>
                    <TerritoryStatLabel>Attack Bonus</TerritoryStatLabel>
                    <TerritoryStatValue>+{territory.attackBonus}%</TerritoryStatValue>
                  </TerritoryStat>
                  <TerritoryStat>
                    <TerritoryStatLabel>Defense Bonus</TerritoryStatLabel>
                    <TerritoryStatValue>+{territory.defenseBonus}%</TerritoryStatValue>
                  </TerritoryStat>
                  <TerritoryStat>
                    <TerritoryStatLabel>EXP Bonus</TerritoryStatLabel>
                    <TerritoryStatValue>{territory.expBonus}x</TerritoryStatValue>
                  </TerritoryStat>
                </TerritoryStats>
                <TerritoryAttackButton
                  onClick={() => attackTerritory(territory.id)}
                  disabled={!territory.canAttack || attacking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {attacking ? 'Attacking...' : 'Attack'}
                </TerritoryAttackButton>
              </TerritoryCard>
            ))}
          </TerritoryMap>
        </CardContent>
      )
    },
    {
      id: 'control-status',
      title: 'Control Status',
      icon: '🏰',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Territories</StatLabel>
            <StatValue>{territories.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Controlled by {user?.faction?.toUpperCase() || 'YOUR FACTION'}</StatLabel>
            <StatValue>
              {territories.filter(t => t.controlledBy === user?.faction).length}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Controlled by Enemy</StatLabel>
            <StatValue>
              {territories.filter(t => t.controlledBy !== user?.faction).length}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Defense Power</StatLabel>
            <StatValue>
              {territories
                .filter(t => t.controlledBy === user?.faction)
                .reduce((sum, t) => sum + t.defensePower, 0)
                .toLocaleString()}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Territory Bonus</StatLabel>
            <StatValue>+15% Attack</StatValue>
          </StatRow>
        </CardContent>
      )
    },
    {
      id: 'defense-power',
      title: 'Defense Power',
      icon: '🛡️',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Defense</StatLabel>
            <StatValue>
              {territories
                .filter(t => t.controlledBy === user?.faction)
                .reduce((sum, t) => sum + t.defensePower, 0)
                .toLocaleString()}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Defense</StatLabel>
            <StatValue>
              {territories.filter(t => t.controlledBy === user?.faction).length > 0
                ? Math.round(
                    territories
                      .filter(t => t.controlledBy === user?.faction)
                      .reduce((sum, t) => sum + t.defensePower, 0) / 
                      territories.filter(t => t.controlledBy === user?.faction).length
                  ).toLocaleString()
                : '0'
              }
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Strongest Territory</StatLabel>
            <StatValue>
              {territories
                .filter(t => t.controlledBy === user?.faction)
                .sort((a, b) => b.defensePower - a.defensePower)[0]?.name || 'None'}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Weakest Territory</StatLabel>
            <StatValue>
              {territories
                .filter(t => t.controlledBy === user?.faction)
                .sort((a, b) => a.defensePower - b.defensePower)[0]?.name || 'None'}
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Defense Ranking</StatLabel>
            <StatValue>#3</StatValue>
          </StatRow>
        </CardContent>
      )
    },
    {
      id: 'attack-timer',
      title: 'Attack Timer',
      icon: '⏰',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Next Attack Available</StatLabel>
            <StatValue>1 hour</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Last Attack</StatLabel>
            <StatValue>2 hours ago</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Attacks Today</StatLabel>
            <StatValue>3 / 5</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Success Rate</StatLabel>
            <StatValue>67%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Victories</StatLabel>
            <StatValue>234</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const ControlledCards = () => [
    {
      id: 'controlled-territories',
      title: 'Controlled Territories',
      icon: '🏰',
      content: (
        <CardContent>
          {territories
            .filter(t => t.controlledBy === user?.faction)
            .map(territory => (
              <div key={territory.id} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                  {territory.name}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Defense: {territory.defensePower} • Bonuses: ATK+{territory.attackBonus}% DEF+{territory.defenseBonus}%
                </div>
                <div style={{ fontSize: '11px', color: '#00a6ff' }}>
                  EXP Multiplier: {territory.expBonus}x • Last Attack: {new Date(territory.lastAttack).toLocaleString()}
                </div>
              </div>
            ))}
        </CardContent>
      )
    },
    {
      id: 'territory-management',
      title: 'Territory Management',
      icon: '⚙️',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Upgrade Defense</StatLabel>
            <StatValue>2,500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Reinforce Troops</StatLabel>
            <StatValue>1,800 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Build Fortifications</StatLabel>
            <StatValue>3,200 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Deploy Artillery</StatLabel>
            <StatValue>4,500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Repair Damage</StatLabel>
            <StatValue>800 STG</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => {
              toast.success('🛡️ Territory upgraded!');
              hapticFeedback('success');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Upgrade Territory
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const BattlesCards = () => [
    {
      id: 'recent-battles',
      title: 'Recent Battles',
      icon: '⚔️',
      content: (
        <CardContent>
          <BattleList>
            {territoryBattles.map(battle => (
              <BattleItem
                key={battle.id}
                onClick={() => {
                  setSelectedTerritory(territories.find(t => t.id === battle.territory));
                  hapticFeedback('impact');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BattleInfo>
                  <BattleTitle>{battle.territory}</BattleTitle>
                  <BattleDetails>
                    {battle.attacker} vs {battle.defender} • {battle.duration} minutes
                  </BattleDetails>
                </BattleInfo>
                <BattleStatus>
                  <BattleResult result={battle.result}>
                    {battle.result.toUpperCase()}
                  </BattleResult>
                  <BattleTime>
                    {new Date(battle.timestamp).toLocaleString()}
                  </BattleTime>
                </BattleStatus>
              </BattleItem>
            ))}
          </BattleList>
        </CardContent>
      )
    },
    {
      id: 'battle-stats',
      title: 'Battle Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Battles</StatLabel>
            <StatValue>{territoryBattles.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Victories</StatLabel>
            <StatValue>{territoryBattles.filter(b => b.result === 'victory').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Defeats</StatLabel>
            <StatValue>{territoryBattles.filter(b => b.result === 'defeat').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Win Rate</StatLabel>
            <StatValue>
              {territoryBattles.length > 0
                ? Math.round((territoryBattles.filter(b => b.result === 'victory').length / territoryBattles.length) * 100)
                : 0}%
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Rewards</StatLabel>
            <StatValue>
              {territoryBattles
                .filter(b => b.result === 'victory')
                .reduce((sum, b) => sum + parseInt(b.reward.replace(/[^0-9]/g, '') || 0), 0)
                .toLocaleString()} STG
            </StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const RewardsCards = () => [
    {
      id: 'territory-rewards',
      title: 'Territory Rewards',
      icon: '💎',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Hourly Rewards</StatLabel>
            <StatValue>250 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Defense Bonuses</StatLabel>
            <StatValue>1,200 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Control Bonuses</StatLabel>
            <StatValue>800 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Battle Rewards</StatLabel>
            <StatValue>3,500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Earned</StatLabel>
            <StatValue>5,750 STG</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => {
              toast.success('💎 Territory rewards claimed!');
              hapticFeedback('success');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Rewards
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'reward-history',
      title: 'Reward History',
      icon: '📜',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Last Claim</StatLabel>
            <StatValue>1 hour ago</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Today</StatLabel>
            <StatValue>5,750 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>This Week</StatLabel>
            <StatValue>28,500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>This Month</StatLabel>
            <StatValue>114,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>All Time</StatLabel>
            <StatValue>450,000 STG</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const StatisticsCards = () => [
    {
      id: 'territory-statistics',
      title: 'Territory Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Territories</StatLabel>
            <StatValue>{territories.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Controlled by You</StatLabel>
            <StatValue>{territories.filter(t => t.controlledBy === user?.faction).length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Controlled by Enemy</StatLabel>
            <StatValue>{territories.filter(t => t.controlledBy !== user?.faction).length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Control Percentage</StatLabel>
            <StatValue>
              {territories.length > 0
                ? Math.round((territories.filter(t => t.controlledBy === user?.faction).length / territories.length) * 100)
                : 0}%
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Global Ranking</StatLabel>
            <StatValue>#5</StatValue>
          </StatRow>
        </CardContent>
      )
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      icon: '📈',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Battle Success Rate</StatLabel>
            <StatValue>67%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Battle Duration</StatLabel>
            <StatValue>42 minutes</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Casualties</StatLabel>
            <StatValue>1,234</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Resources Captured</StatLabel>
            <StatValue>8,900 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Efficiency Rating</StatLabel>
            <StatValue>A+</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'overview': return OverviewCards();
      case 'controlled': return ControlledCards();
      case 'battles': return BattlesCards();
      case 'rewards': return RewardsCards();
      case 'statistics': return StatisticsCards();
      default: return OverviewCards();
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <div style={{ color: '#ffffff' }}>Loading territories...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🗺️ Territory Map</Title>
      
      <TabContainer>
        {territoryTabs.map(tab => (
          <TabButton
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon} {tab.label}
          </TabButton>
        ))}
      </TabContainer>

      <CardContainer>
        {getCardsForTab().map(card => (
          <ModularCard
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: getCardsForTab().indexOf(card) * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <CardHeader>
              <CardIcon>{card.icon}</CardIcon>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            {card.content}
          </ModularCard>
        ))}
      </CardContainer>
    </Container>
  );
};

export default TerritoryMapComponent;
