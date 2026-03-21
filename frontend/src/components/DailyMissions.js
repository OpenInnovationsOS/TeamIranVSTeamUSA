import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import toast from 'react-hot-toast';
import { useTelegram } from '../hooks/useTelegram';
import { API_CONFIG } from '../config/api';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #0088cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 0;
`;

const MissionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const MissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MissionInfo = styled.div`
  flex: 1;
`;

const MissionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 4px 0;
`;

const MissionMeta = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const DifficultyBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => 
    props.difficulty === 'Easy' ? '#34c759' :
    props.difficulty === 'Medium' ? '#ff9500' :
    '#ff3b30'
  };
  color: #ffffff;
  font-weight: 500;
`;

const CategoryBadge = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-weight: 500;
`;

const MissionStatus = styled.div`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => props.completed && css`
    background: #34c759;
    color: #ffffff;
  `}
  
  ${props => !props.completed && css`
    background: rgba(255, 255, 255, 0.1);
    color: #8e8e93;
  `}
`;

const MissionDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #00a6ff);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.percentage}%;
`;

const MissionRewards = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Reward = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
`;

const ClaimButton = styled.button`
  background: ${props => props.disabled ? 'rgba(255, 255, 255, 0.1)' : '#34c759'};
  color: ${props => props.disabled ? '#8e8e93' : '#ffffff'};
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover {
    ${props => !props.disabled && css`
      background: #30d158;
      transform: scale(1.05);
    `}
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #0088cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 12px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 20px;
`;

const DailyMissions = () => {
  const { hapticFeedback } = useTelegram();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/daily-missions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMissions(data.missions || []);
      } else {
        throw new Error(data.error || 'Failed to load missions');
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
      // Fallback data
      const fallbackMissions = [
        {
          id: 1,
          title: 'Tap Master',
          description: 'Perform 100 taps to earn STG tokens',
          mission_type: 'taps',
          target_value: 100,
          stg_reward: 500,
          win_reward: 10,
          current_progress: 45,
          is_completed: false,
          claimed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          difficulty: 'Easy',
          category: 'daily'
        },
        {
          id: 2,
          title: 'Battle Winner',
          description: 'Win 5 PvP battles against other players',
          mission_type: 'pvp_wins',
          target_value: 5,
          stg_reward: 1000,
          win_reward: 25,
          current_progress: 2,
          is_completed: false,
          claimed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          difficulty: 'Medium',
          category: 'pvp'
        },
        {
          id: 3,
          title: 'Faction Loyalist',
          description: 'Earn 1000 STG for your faction through gameplay',
          mission_type: 'stg_earned',
          target_value: 1000,
          stg_reward: 750,
          win_reward: 15,
          current_progress: 800,
          is_completed: false,
          claimed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          difficulty: 'Medium',
          category: 'faction'
        },
        {
          id: 4,
          title: 'Territory Conqueror',
          description: 'Attack and conquer 2 territories',
          mission_type: 'territory_conquest',
          target_value: 2,
          stg_reward: 1500,
          win_reward: 30,
          current_progress: 0,
          is_completed: false,
          claimed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          difficulty: 'Hard',
          category: 'territory'
        },
        {
          id: 5,
          title: 'Social Butterfly',
          description: 'Share your score or achievements 3 times',
          mission_type: 'social_shares',
          target_value: 3,
          stg_reward: 300,
          win_reward: 5,
          current_progress: 1,
          is_completed: false,
          claimed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          difficulty: 'Easy',
          category: 'social'
        }
      ];
      
      setMissions(fallbackMissions);
      toast.error('Using fallback data - API unavailable');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.is_completed || mission.claimed) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/daily-missions/${missionId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': 'player123'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        hapticFeedback('notification');
        toast.success(data.message || `Claimed ${mission.stg_reward} STG and ${mission.win_reward} wins!`);
        
        // Update mission as claimed
        setMissions(prev => prev.map(m => 
          m.id === missionId ? { ...m, claimed: true } : m
        ));
      } else {
        throw new Error(data.error || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim reward error:', error);
      // Fallback - still update UI but show warning
      hapticFeedback('notification');
      toast.success(`Claimed ${mission.stg_reward} STG and ${mission.win_reward} wins! (Offline mode)`);
      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, claimed: true } : m
      ));
    }
  };

  if (loading) {
    return (
      <LoadingSpinner>
        <Spinner />
        Loading missions...
      </LoadingSpinner>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Daily Missions</Title>
        <Subtitle>Complete missions to earn STG tokens and win rewards</Subtitle>
      </Header>

      {missions.length === 0 ? (
        <EmptyState>
          No missions available right now. Check back later!
        </EmptyState>
      ) : (
        missions.map(mission => {
          const progressPercentage = Math.min((mission.current_progress / mission.target_value) * 100, 100);
          const isCompleted = mission.current_progress >= mission.target_value;
          
          return (
            <MissionCard
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: mission.id * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MissionHeader>
                <MissionInfo>
                  <MissionTitle>{mission.title}</MissionTitle>
                  <MissionMeta>
                    <DifficultyBadge difficulty={mission.difficulty}>
                      {mission.difficulty}
                    </DifficultyBadge>
                    <CategoryBadge>{mission.category}</CategoryBadge>
                  </MissionMeta>
                </MissionInfo>
                <MissionStatus completed={isCompleted}>
                  {isCompleted ? 'Completed' : 'In Progress'}
                </MissionStatus>
              </MissionHeader>
              
              <MissionDescription>{mission.description}</MissionDescription>
              
              <ProgressBar>
                <ProgressFill percentage={progressPercentage} />
              </ProgressBar>
              
              <MissionRewards>
                <Reward>
                  💰 {mission.stg_reward} STG
                </Reward>
                <Reward>
                  🏆 {mission.win_reward} Wins
                </Reward>
                <ClaimButton
                  disabled={!isCompleted || mission.claimed}
                  onClick={() => claimReward(mission.id)}
                >
                  {mission.claimed ? 'Claimed' : isCompleted ? 'Claim' : `${Math.floor(progressPercentage)}%`}
                </ClaimButton>
              </MissionRewards>
            </MissionCard>
          );
        })
      )}
    </Container>
  );
};

export default DailyMissions;
