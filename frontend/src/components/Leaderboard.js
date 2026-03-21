// Enhanced Leaderboard Component - Multi-Card & Multi-Tab System
import React, { useState, useEffect, useCallback } from 'react';
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
  background: linear-gradient(45deg, #ffd700, #ffed4e);
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
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000000;
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
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
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
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
`;

const LeaderboardList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.5);
    border-radius: 3px;
  }
`;

const LeaderboardItem = styled.div`
  display: flex;
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

const RankNumber = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.rank <= 3 ? '#ffd700' : '#ffffff'};
  margin-right: 16px;
  min-width: 30px;
  text-align: center;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const PlayerDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const PlayerStats = styled.div`
  text-align: right;
`;

const PlayerScore = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
`;

const PlayerLevel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const FactionBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  background: ${props => 
    props.faction === 'iran' ? 'rgba(0, 166, 82, 0.3)' : 
    props.faction === 'usa' ? 'rgba(0, 40, 104, 0.3)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  color: ${props => 
    props.faction === 'iran' ? '#00a652' : 
    props.faction === 'usa' ? '#002868' : 
    '#ffffff'
  };
`;

const TimeRangeSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const TimeRangeButton = styled(motion.button)`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    color: #000000;
    border-color: transparent;
  }
`;

const Leaderboard = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('global');
  const [timeRange, setTimeRange] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [factionLeaderboard, setFactionLeaderboard] = useState([]);
  const [guildLeaderboard, setGuildLeaderboard] = useState([]);
  const [territoryLeaderboard, setTerritoryLeaderboard] = useState([]);
  const [weaponLeaderboard, setWeaponLeaderboard] = useState([]);

  const leaderboardTabs = [
    { id: 'global', label: 'Global', icon: '🌍' },
    { id: 'faction', label: 'Faction', icon: '🏴' },
    { id: 'guild', label: 'Guild', icon: '👥' },
    { id: 'territory', label: 'Territory', icon: '🗺️' },
    { id: 'weapons', label: 'Weapons', icon: '⚔️' }
  ];

  const timeRanges = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'alltime', label: 'All Time' }
  ];

  // WebSocket for real-time leaderboard updates
  useWebSocketBattle({
    onLeaderboardUpdate: (data) => {
      if (data.type === 'LEADERBOARD_UPDATE') {
        setLeaderboard(prev => {
          const updatedData = [...prev];
          const playerIndex = updatedData.findIndex(p => p.id === data.playerId);
          if (playerIndex !== -1) {
            updatedData[playerIndex] = { ...updatedData[playerIndex], ...data.updates };
          }
          return updatedData.sort((a, b) => b.score - a.score);
        });
      }
    }
  });

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        // Fallback data
        setLeaderboard([
          {
            id: 1,
            rank: 1,
            username: 'DragonSlayer',
            level: 45,
            faction: 'usa',
            score: 125000,
            battles: 2340,
            winRate: 78,
            guild: 'Elite Warriors',
            avatar: '🐉'
          },
          {
            id: 2,
            rank: 2,
            username: 'PhoenixRising',
            level: 42,
            faction: 'iran',
            score: 118000,
            battles: 2156,
            winRate: 75,
            guild: 'Phoenix Legion',
            avatar: '🔥'
          },
          {
            id: 3,
            rank: 3,
            username: 'ShadowHunter',
            level: 40,
            faction: 'usa',
            score: 112000,
            battles: 1987,
            winRate: 72,
            guild: 'Shadow Guild',
            avatar: '🌑'
          },
          {
            id: 4,
            rank: 4,
            username: 'DesertEagle',
            level: 38,
            faction: 'iran',
            score: 105000,
            battles: 1876,
            winRate: 70,
            guild: 'Desert Eagles',
            avatar: '🦅'
          },
          {
            id: 5,
            rank: 5,
            username: 'ThunderBolt',
            level: 36,
            faction: 'usa',
            score: 98000,
            battles: 1654,
            winRate: 68,
            guild: 'Thunder Clan',
            avatar: '⚡'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [timeRange, user?.id]);

  // Load faction leaderboard
  const loadFactionLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard/faction?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-faction': user?.faction || 'iran',
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFactionLeaderboard(data.leaderboard || []);
      } else {
        // Fallback data
        setFactionLeaderboard([
          {
            id: 1,
            rank: 1,
            username: 'IranChampion',
            level: 41,
            faction: 'iran',
            score: 108000,
            battles: 2012,
            winRate: 73,
            guild: 'Persian Warriors',
            avatar: '🦁'
          },
          {
            id: 2,
            rank: 2,
            username: 'DesertStorm',
            level: 39,
            faction: 'iran',
            score: 98000,
            battles: 1876,
            winRate: 70,
            guild: 'Sand Vipers',
            avatar: '🌪'
          },
          {
            id: 3,
            rank: 3,
            username: 'MountainEagle',
            level: 37,
            faction: 'iran',
            score: 92000,
            battles: 1654,
            winRate: 68,
            guild: 'Highlanders',
            avatar: '🏔️'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load faction leaderboard:', error);
    }
  }, [activeTab, timeRange, user?.faction, user?.id]);

  // Load guild leaderboard
  const loadGuildLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard/guild?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGuildLeaderboard(data.leaderboard || []);
      } else {
        // Fallback data
        setGuildLeaderboard([
          {
            id: 1,
            rank: 1,
            guildName: 'Elite Warriors',
            level: 25,
            members: 50,
            totalPower: 125000,
            territories: 3,
            score: 145000,
            faction: 'usa',
            avatar: '⚔️'
          },
          {
            id: 2,
            rank: 2,
            guildName: 'Phoenix Legion',
            level: 23,
            members: 48,
            totalPower: 118000,
            territories: 2,
            score: 132000,
            faction: 'iran',
            avatar: '🔥'
          },
          {
            id: 3,
            rank: 3,
            guildName: 'Shadow Guild',
            level: 22,
            members: 45,
            totalPower: 108000,
            territories: 2,
            score: 125000,
            faction: 'usa',
            avatar: '🌑'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load guild leaderboard:', error);
    }
  }, [activeTab, timeRange, user?.id]);

  // Load territory leaderboard
  const loadTerritoryLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard/territory?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTerritoryLeaderboard(data.leaderboard || []);
      } else {
        // Fallback data
        setTerritoryLeaderboard([
          {
            id: 1,
            rank: 1,
            territoryName: 'New York',
            faction: 'usa',
            controlledBy: 'Elite Warriors',
            defensePower: 3500,
            attacks: 234,
            defenses: 198,
            score: 45000,
            avatar: '🗽'
          },
          {
            id: 2,
            rank: 2,
            territoryName: 'Tehran',
            faction: 'iran',
            controlledBy: 'Persian Warriors',
            defensePower: 3200,
            attacks: 198,
            defenses: 176,
            score: 42000,
            avatar: '🕌'
          },
          {
            id: 3,
            rank: 3,
            territoryName: 'Los Angeles',
            faction: 'usa',
            controlledBy: 'Thunder Clan',
            defensePower: 2800,
            attacks: 165,
            defenses: 143,
            score: 38000,
            avatar: '🌴'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load territory leaderboard:', error);
    }
  }, [activeTab, timeRange, user?.id]);

  // Load weapon leaderboard
  const loadWeaponLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/leaderboard/weapons?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeaponLeaderboard(data.leaderboard || []);
      } else {
        // Fallback data
        setWeaponLeaderboard([
          {
            id: 1,
            rank: 1,
            weaponName: 'F-22 Raptor',
            category: 'aircraft',
            faction: 'usa',
            kills: 1250,
            damage: 98000,
            accuracy: 92,
            score: 85000,
            avatar: '✈️'
          },
          {
            id: 2,
            rank: 2,
            weaponName: 'Su-57 Felon',
            category: 'aircraft',
            faction: 'iran',
            kills: 1180,
            damage: 92000,
            accuracy: 90,
            score: 78000,
            avatar: '✈️'
          },
          {
            id: 3,
            rank: 3,
            weaponName: 'M1A2 Abrams',
            category: 'tanks',
            faction: 'usa',
            kills: 980,
            damage: 76000,
            accuracy: 88,
            score: 65000,
            avatar: '🚜️'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load weapon leaderboard:', error);
    }
  }, [activeTab, timeRange, user?.id]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (activeTab === 'faction') {
      loadFactionLeaderboard();
    }
  }, [activeTab, loadFactionLeaderboard]);

  useEffect(() => {
    if (activeTab === 'guild') {
      loadGuildLeaderboard();
    }
  }, [activeTab, loadGuildLeaderboard]);

  useEffect(() => {
    if (activeTab === 'territory') {
      loadTerritoryLeaderboard();
    }
  }, [activeTab, loadTerritoryLeaderboard]);

  useEffect(() => {
    if (activeTab === 'weapons') {
      loadWeaponLeaderboard();
    }
  }, [activeTab, loadWeaponLeaderboard]);

  const GlobalCards = () => [
    {
      id: 'top-players',
      title: 'Top Players',
      icon: '🏆',
      content: (
        <CardContent>
          <LeaderboardList>
            {leaderboard.map(player => (
              <LeaderboardItem
                key={player.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${player.username}'s profile`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RankNumber rank={player.rank}>#{player.rank}</RankNumber>
                <PlayerInfo>
                  <PlayerName>
                    {player.username}
                    <FactionBadge faction={player.faction}>
                      {player.faction.toUpperCase()}
                    </FactionBadge>
                  </PlayerName>
                  <PlayerDetails>
                    Level {player.level} • {player.guild} • {player.battles} battles
                  </PlayerDetails>
                </PlayerInfo>
                <PlayerStats>
                  <PlayerScore>{player.score.toLocaleString()}</PlayerScore>
                  <PlayerLevel>Win Rate: {player.winRate}%</PlayerLevel>
                </PlayerStats>
              </LeaderboardItem>
            ))}
          </LeaderboardList>
        </CardContent>
      )
    },
    {
      id: 'rising-stars',
      title: 'Rising Stars',
      icon: '⭐',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Top Rising Player</StatLabel>
            <StatValue>ThunderBolt</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Biggest Jump</StatLabel>
            <StatValue>+12 ranks</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Highest Win Rate</StatLabel>
            <StatValue>89%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Most Battles</StatLabel>
            <StatValue>156</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Ranking</StatLabel>
            <StatValue>#42</StatValue>
          </StatRow>
        </CardContent>
      )
    },
    {
      id: 'player-stats',
      title: 'Player Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Players</StatLabel>
            <StatValue>12,456</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Active Today</StatLabel>
            <StatValue>3,234</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Level</StatLabel>
            <StatValue>28</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Score</StatLabel>
            <StatValue>45,678</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Position</StatLabel>
            <StatValue>#42 (Top 0.3%)</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const FactionCards = () => [
    {
      id: 'faction-leaders',
      title: 'Faction Leaders',
      icon: '🏴',
      content: (
        <CardContent>
          <LeaderboardList>
            {factionLeaderboard.map(player => (
              <LeaderboardItem
                key={player.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${player.username}'s profile`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RankNumber rank={player.rank}>#{player.rank}</RankNumber>
                <PlayerInfo>
                  <PlayerName>
                    {player.username}
                    <FactionBadge faction={player.faction}>
                      {player.faction.toUpperCase()}
                    </FactionBadge>
                  </PlayerName>
                  <PlayerDetails>
                    Level {player.level} • {player.guild} • {player.battles} battles
                  </PlayerDetails>
                </PlayerInfo>
                <PlayerStats>
                  <PlayerScore>{player.score.toLocaleString()}</PlayerScore>
                  <PlayerLevel>Win Rate: {player.winRate}%</PlayerLevel>
                </PlayerStats>
              </LeaderboardItem>
            ))}
          </LeaderboardList>
        </CardContent>
      )
    },
    {
      id: 'faction-stats',
      title: 'Faction Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>USA Players</StatLabel>
            <StatValue>6,234</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Iran Players</StatLabel>
            <StatValue>6,222</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>USA Average Score</StatLabel>
            <StatValue>46,789</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Iran Average Score</StatLabel>
            <StatValue>44,567</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Leading Faction</StatLabel>
            <StatValue>USA</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const GuildCards = () => [
    {
      id: 'guild-rankings',
      title: 'Guild Rankings',
      icon: '👥',
      content: (
        <CardContent>
          <LeaderboardList>
            {guildLeaderboard.map(guild => (
              <LeaderboardItem
                key={guild.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${guild.guildName}'s profile`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RankNumber rank={guild.rank}>#{guild.rank}</RankNumber>
                <PlayerInfo>
                  <PlayerName>
                    {guild.guildName}
                    <FactionBadge faction={guild.faction}>
                      {guild.faction.toUpperCase()}
                    </FactionBadge>
                  </PlayerName>
                  <PlayerDetails>
                    Level {guild.level} • {guild.members} members • {guild.territories} territories
                  </PlayerDetails>
                </PlayerInfo>
                <PlayerStats>
                  <PlayerScore>{guild.score.toLocaleString()}</PlayerScore>
                  <PlayerLevel>Power: {guild.totalPower.toLocaleString()}</PlayerLevel>
                </PlayerStats>
              </LeaderboardItem>
            ))}
          </LeaderboardList>
        </CardContent>
      )
    },
    {
      id: 'guild-stats',
      title: 'Guild Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Guilds</StatLabel>
            <StatValue>234</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Active Guilds</StatLabel>
            <StatValue>189</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Members</StatLabel>
            <StatValue>42</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Territory Control</StatLabel>
            <StatValue>USA: 3 • Iran: 3</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Guild Rank</StatLabel>
            <StatValue>#8</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const TerritoryCards = () => [
    {
      id: 'territory-rankings',
      title: 'Territory Rankings',
      icon: '🗺️',
      content: (
        <CardContent>
          <LeaderboardList>
            {territoryLeaderboard.map(territory => (
              <LeaderboardItem
                key={territory.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${territory.territoryName}'s details`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RankNumber rank={territory.rank}>#{territory.rank}</RankNumber>
                <PlayerInfo>
                  <PlayerName>
                    {territory.territoryName}
                    <FactionBadge faction={territory.faction}>
                      {territory.faction.toUpperCase()}
                    </FactionBadge>
                  </PlayerName>
                  <PlayerDetails>
                    Controlled by {territory.controlledBy} • Defense: {territory.defensePower}
                  </PlayerDetails>
                </PlayerInfo>
                <PlayerStats>
                  <PlayerScore>{territory.score.toLocaleString()}</PlayerScore>
                  <PlayerLevel>A/D: {territory.attacks}/{territory.defenses}</PlayerLevel>
                </PlayerStats>
              </LeaderboardItem>
            ))}
          </LeaderboardList>
        </CardContent>
      )
    },
    {
      id: 'territory-stats',
      title: 'Territory Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Territories</StatLabel>
            <StatValue>6</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>USA Controlled</StatLabel>
            <StatValue>3</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Iran Controlled</StatLabel>
            <StatValue>3</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Most Attacked</StatLabel>
            <StatValue>New York</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Best Defended</StatLabel>
            <StatValue>Tehran</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const WeaponsCards = () => [
    {
      id: 'weapon-rankings',
      title: 'Weapon Rankings',
      icon: '⚔️',
      content: (
        <CardContent>
          <LeaderboardList>
            {weaponLeaderboard.map(weapon => (
              <LeaderboardItem
                key={weapon.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${weapon.weaponName}'s stats`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RankNumber rank={weapon.rank}>#{weapon.rank}</RankNumber>
                <PlayerInfo>
                  <PlayerName>
                    {weapon.weaponName}
                    <FactionBadge faction={weapon.faction}>
                      {weapon.faction.toUpperCase()}
                    </FactionBadge>
                  </PlayerName>
                  <PlayerDetails>
                    {weapon.category} • Accuracy: {weapon.accuracy}% • Damage: {weapon.damage.toLocaleString()}
                  </PlayerDetails>
                </PlayerInfo>
                <PlayerStats>
                  <PlayerScore>{weapon.score.toLocaleString()}</PlayerScore>
                  <PlayerLevel>Kills: {weapon.kills}</PlayerLevel>
                </PlayerStats>
              </LeaderboardItem>
            ))}
          </LeaderboardList>
        </CardContent>
      )
    },
    {
      id: 'weapon-stats',
      title: 'Weapon Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Weapons</StatLabel>
            <StatValue>18</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Most Used</StatLabel>
            <StatValue>F-22 Raptor</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Highest Damage</StatLabel>
            <StatValue>F-22 Raptor</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Most Accurate</StatLabel>
            <StatValue>Su-57 Felon</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Best Weapon</StatLabel>
            <StatValue>M1A2 Abrams</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'global': return GlobalCards();
      case 'faction': return FactionCards();
      case 'guild': return GuildCards();
      case 'territory': return TerritoryCards();
      case 'weapons': return WeaponsCards();
      default: return GlobalCards();
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
          <div style={{ color: '#ffffff' }}>Loading leaderboard...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏆 Leaderboard</Title>
      
      <TimeRangeSelector>
        {timeRanges.map(range => (
          <TimeRangeButton
            key={range.id}
            className={timeRange === range.id ? 'active' : ''}
            onClick={() => setTimeRange(range.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {range.label}
          </TimeRangeButton>
        ))}
      </TimeRangeSelector>

      <TabContainer>
        {leaderboardTabs.map(tab => (
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

export default Leaderboard;
