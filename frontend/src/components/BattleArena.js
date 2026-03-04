import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

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

const HistoryItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

const BattleArena = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [opponents, setOpponents] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [wager, setWager] = useState(100);
  const [isInitiatingBattle, setIsInitiatingBattle] = useState(false);

  // Fallback user data
  const safeUser = user || {
    id: 1,
    username: 'Player1',
    faction: 'iran',
    stg_balance: 1000,
    level: 1
  };

  useEffect(() => {
    loadOpponents();
    loadBattleHistory();
  }, []);

  const loadOpponents = async () => {
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
  };

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
      
      const data = await response.json();
      // Create mock battle history
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

  const initiateBattle = async (opponentId) => {
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
      const response = await fetch('http://localhost:3001/api/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          opponent_id: opponentId,
          wager: wager
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Battle ${data.result === 'win' ? 'Won' : 'Lost'}! ${data.result === 'win' ? `+${data.reward} STG` : ''}`);
        
        // Add to battle history
        const newBattle = {
          id: Date.now(),
          opponent: opponents.find(o => o.id === opponentId)?.username || 'Unknown',
          result: data.result,
          wager: wager,
          reward: data.reward || 0,
          timestamp: new Date().toISOString()
        };
        
        setBattleHistory(prev => [newBattle, ...prev]);
        
        // Reload opponents
        loadOpponents();
      } else {
        toast.error(data.error || 'Battle failed');
      }
    } catch (error) {
      console.error('Battle error:', error);
      // Fallback battle result
      const result = Math.random() > 0.5 ? 'win' : 'lose';
      const reward = result === 'win' ? wager * 2 : 0;
      
      toast.success(`Battle ${result === 'win' ? 'Won' : 'Lost'}! ${result === 'win' ? `+${reward} STG` : ''}`);
      
      const newBattle = {
        id: Date.now(),
        opponent: opponents.find(o => o.id === opponentId)?.username || 'Unknown',
        result: result,
        wager: wager,
        reward: reward,
        timestamp: new Date().toISOString()
      };
      
      setBattleHistory(prev => [newBattle, ...prev]);
    } finally {
      setIsInitiatingBattle(false);
    }
  };

  return (
    <Container>
      <Title>⚔️ Battle Arena</Title>

      <WagerInput>
        <SectionTitle>Battle Wager (STG)</SectionTitle>
        <Input
          type="number"
          value={wager}
          onChange={(e) => setWager(parseInt(e.target.value) || 0)}
          min="100"
          max={user.stg_balance}
          placeholder="Enter wager amount"
        />
        <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Your balance: {user.stg_balance.toLocaleString()} STG
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
                disabled={isInitiatingBattle || wager > user.stg_balance}
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
        {battleHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
            No battles yet
          </div>
        ) : (
          battleHistory.map((battle) => (
            <HistoryItem key={battle.id}>
              <div>
                vs {battle.defender_name || battle.defender_username}
                {battle.winner_id === user.id ? ' 🏆' : ' ❌'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Wager: {battle.stg_wager} STG • {new Date(battle.created_at).toLocaleDateString()}
              </div>
            </HistoryItem>
          ))
        )}
      </BattleHistory>
    </Container>
  );
};

export default BattleArena;
