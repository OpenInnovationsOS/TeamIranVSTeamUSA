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
  background: linear-gradient(45deg, #ffd43b, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const MissionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
  border: ${props => props.completed ? '2px solid #51cf66' : '1px solid rgba(255, 255, 255, 0.1)'};
`;

const MissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MissionTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const MissionDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;

const MissionRewards = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const RewardBadge = styled.div`
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #51cf66, #69db7c);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 12px;
`;

const ClaimButton = styled(motion.button)`
  background: ${props => props.completed ? 
    'linear-gradient(45deg, #51cf66, #69db7c)' : 
    'linear-gradient(45deg, #6c757d, #868e96)'
  };
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 20px;
`;

const DailyMissions = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real app, this would come from API
      const mockMissions = [
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
          claimed: false
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
          claimed: false
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
          claimed: false
        },
        {
          id: 4,
          title: 'Social Butterfly',
          description: 'Share your achievements 3 times on social media',
          mission_type: 'social_shares',
          target_value: 3,
          stg_reward: 300,
          win_reward: 5,
          current_progress: 1,
          is_completed: false,
          claimed: false
        },
        {
          id: 5,
          title: 'Territory Conqueror',
          description: 'Participate in 10 territory control battles',
          mission_type: 'territory_battles',
          target_value: 10,
          stg_reward: 800,
          win_reward: 20,
          current_progress: 0,
          is_completed: false,
          claimed: false
        }
      ];
      
      setMissions(mockMissions);
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId) => {
    hapticFeedback('impact');
    
    try {
      // Mock API call
      const mission = missions.find(m => m.id === missionId);
      if (mission && mission.is_completed) {
        toast.success(`Claimed ${mission.stg_reward} STG and ${mission.win_reward} WIN tokens!`);
        
        // Update local state
        setMissions(prev => prev.map(m => 
          m.id === missionId ? { ...m, claimed: true } : m
        ));
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      toast.error('Failed to claim reward');
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <div>Loading missions...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🎯 Daily Missions</Title>

      {missions.length === 0 ? (
        <EmptyState>
          No missions available right now. Check back tomorrow!
        </EmptyState>
      ) : (
        missions.map((mission) => {
          const progressPercentage = getProgressPercentage(mission.current_progress, mission.target_value);
          const isCompleted = mission.current_progress >= mission.target_value;
          
          return (
            <MissionCard
              key={mission.id}
              completed={isCompleted && !mission.claimed}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: missions.indexOf(mission) * 0.1 }}
            >
              <MissionHeader>
                <div>
                  <MissionTitle>{mission.title}</MissionTitle>
                  <MissionDescription>{mission.description}</MissionDescription>
                </div>
              </MissionHeader>

              <MissionRewards>
                <RewardBadge>🪙 {mission.stg_reward} STG</RewardBadge>
                {mission.win_reward > 0 && (
                  <RewardBadge>💎 {mission.win_reward} WIN</RewardBadge>
                )}
              </MissionRewards>

              <ProgressBar>
                <ProgressFill percentage={progressPercentage} />
              </ProgressBar>

              <ProgressText>
                {mission.current_progress} / {mission.target_value} ({progressPercentage}%)
              </ProgressText>

              <ClaimButton
                completed={isCompleted && !mission.claimed}
                onClick={() => claimReward(mission.id)}
                disabled={!isCompleted || mission.claimed}
                whileHover={{ scale: isCompleted && !mission.claimed ? 1.02 : 1 }}
                whileTap={{ scale: isCompleted && !mission.claimed ? 0.98 : 1 }}
              >
                {mission.claimed ? '✅ Claimed' : 
                 isCompleted ? '🎁 Claim Reward' : 
                 `🎯 In Progress (${mission.current_progress}/${mission.target_value})`}
              </ClaimButton>
            </MissionCard>
          );
        })
      )}
    </Container>
  );
};

export default DailyMissions;
