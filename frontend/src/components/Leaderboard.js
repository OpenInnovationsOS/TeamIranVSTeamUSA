import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuthStore } from '../stores/authStore';

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
`;

const Tab = styled(motion.button)`
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  background: ${props => props.active ? 'linear-gradient(45deg, #0088cc, #00a6ff)' : 'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(45deg, #0088cc, #00a6ff)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const LeaderboardList = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const LeaderboardItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
  border: ${props => props.isCurrentUser ? '2px solid #0088cc' : '1px solid rgba(255, 255, 255, 0.1)'};
`;

const Rank = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  width: 40px;
  text-align: center;
  margin-right: 16px;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const PlayerStats = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const Score = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-align: right;
`;

const Medal = styled.div`
  font-size: 24px;
  margin-right: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 20px;
`;

const Leaderboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback user data
  const safeUser = user || {
    id: 1,
    username: 'Player1',
    faction: 'iran',
    stg_balance: 1000,
    level: 1
  };

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab]);

  const loadLeaderboard = async (type) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let leaderboardData = data.leaderboard || [];

      // Filter based on active tab
      if (type === 'iran') {
        leaderboardData = leaderboardData.filter(player => player.faction === 'iran');
      } else if (type === 'usa') {
        leaderboardData = leaderboardData.filter(player => player.faction === 'usa');
      }

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Fallback leaderboard data
      const fallbackData = [
        { id: 1, username: 'ChampionPlayer', faction: 'iran', stg_balance: 50000, level: 25, wins: 150, losses: 20 },
        { id: 2, username: 'TopGamer', faction: 'usa', stg_balance: 45000, level: 23, wins: 140, losses: 25 },
        { id: 3, username: 'ProPlayer', faction: 'iran', stg_balance: 40000, level: 22, wins: 130, losses: 30 },
        { id: 4, username: 'MasterBattler', faction: 'usa', stg_balance: 35000, level: 21, wins: 120, losses: 35 },
        { id: 5, username: 'EliteWarrior', faction: 'iran', stg_balance: 30000, level: 20, wins: 110, losses: 40 },
        { id: 6, username: 'SkilledFighter', faction: 'usa', stg_balance: 25000, level: 19, wins: 100, losses: 45 },
        { id: 7, username: 'VeteranPlayer', faction: 'iran', stg_balance: 20000, level: 18, wins: 90, losses: 50 },
        { id: 8, username: 'ExperiencedGamer', faction: 'usa', stg_balance: 18000, level: 17, wins: 85, losses: 55 }
      ];

      // Filter fallback data based on tab
      if (type === 'iran') {
        setLeaderboard(fallbackData.filter(player => player.faction === 'iran'));
      } else if (type === 'usa') {
        setLeaderboard(fallbackData.filter(player => player.faction === 'usa'));
      } else {
        setLeaderboard(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank) => {
    switch (rank) {
      case 1: return <Medal>🥇</Medal>;
      case 2: return <Medal>🥈</Medal>;
      case 3: return <Medal>🥉</Medal>;
      default: return <Rank>#{rank}</Rank>;
    }
  };

  const tabs = [
    { id: 'global', label: '🌍 Global' },
    { id: 'faction', label: user.faction === 'iran' ? '🇮🇷 Iran' : '🇺🇸 USA' },
  ];

  return (
    <Container>
      <Title>🏆 Leaderboard</Title>

      <TabContainer>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.label}
          </Tab>
        ))}
      </TabContainer>

      <LeaderboardList>
        {loading ? (
          <EmptyState>Loading leaderboard...</EmptyState>
        ) : leaderboard.length === 0 ? (
          <EmptyState>No players on the leaderboard yet</EmptyState>
        ) : (
          leaderboard.map((player, index) => (
            <LeaderboardItem
              key={player.id}
              isCurrentUser={player.id === user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {getRankDisplay(player.rank)}
              <PlayerInfo>
                <PlayerName>
                  {player.first_name || player.username}
                  {player.faction === 'iran' ? ' 🇮🇷' : ' 🇺🇸'}
                  {player.id === user.id && ' (You)'}
                </PlayerName>
                <PlayerStats>
                  Level {player.level} • {player.experience} XP
                </PlayerStats>
              </PlayerInfo>
              <Score>
                {player.stg_balance.toLocaleString()}
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  STG
                </div>
              </Score>
            </LeaderboardItem>
          ))
        )}
      </LeaderboardList>
    </Container>
  );
};

export default Leaderboard;
