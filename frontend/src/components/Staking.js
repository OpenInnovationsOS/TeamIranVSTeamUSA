import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { CardTransition, StaggerContainer, FadeIn } from './Transitions';
import LoadingScreen from './LoadingScreen';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  padding-bottom: 100px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const OverviewSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const OverviewTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16px;
`;

const OverviewStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const OverviewStat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const PoolsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
`;

const PoolCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    border-color: rgba(39, 174, 96, 0.3);
  }
`;

const PoolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const PoolInfo = styled.div`
  flex: 1;
`;

const PoolName = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const PoolRisk = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
  
  ${props => {
    switch (props.risk) {
      case 'conservative': return 'background: #27ae60; color: white;';
      case 'aggressive': return 'background: #e74c3c; color: white;';
      case 'elite': return 'background: #9b59b6; color: white;';
      default: return 'background: #95a5a6; color: white;';
    }
  }}
`;

const PoolAPY = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 4px;
`;

const PoolAPYLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const PoolStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const PoolStat = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const PoolStatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
`;

const PoolStatValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
`;

const StakingForm = styled.div`
  background: rgba(39, 174, 96, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const FormTitle = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12px;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const InputLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const StakeInput = styled.input`
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  
  &:focus {
    outline: none;
    border-color: #27ae60;
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const MaxButton = styled(motion.button)`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const StakeButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }
`;

const UnstakeButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }
`;

const ClaimButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: linear-gradient(45deg, #f39c12, #e74c3c);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  }
`;

const UserPositions = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PositionsTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16px;
`;

const PositionList = styled.div`
  display: grid;
  gap: 12px;
`;

const PositionCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PositionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PositionPool = styled.div`
  font-weight: bold;
  color: #ffffff;
`;

const PositionAmount = styled.div`
  font-weight: bold;
  color: #27ae60;
`;

const PositionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const PositionDetail = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const PositionActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const RewardsDisplay = styled.div`
  background: rgba(243, 156, 18, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  text-align: center;
`;

const RewardsAmount = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 4px;
`;

const RewardsLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const Staking = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [pools, setPools] = useState([]);
  const [userPositions, setUserPositions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState({});
  const [unstakeAmounts, setUnstakeAmounts] = useState({});
  const [claiming, setClaiming] = useState({});

  const loadStakingPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/staking/pools', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPools(data.pools || []);
    } catch (error) {
      console.error('Failed to load staking pools:', error);
      // Fallback pools
      setPools([
        { id: 'basic', name: 'Basic Pool', apy: 5.5, total_staked: 500000, stakers: 45, lock_period: 604800000, minimum_stake: 1000, status: 'active' },
        { id: 'premium', name: 'Premium Pool', apy: 8.2, total_staked: 1200000, stakers: 78, lock_period: 1209600000, minimum_stake: 5000, status: 'active' },
        { id: 'vip', name: 'VIP Pool', apy: 12.5, total_staked: 2500000, stakers: 32, lock_period: 2592000000, minimum_stake: 10000, status: 'active' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserPositions = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/staking/positions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUserPositions(data.positions || []);
    } catch (error) {
      console.error('Failed to load user positions:', error);
      // Mock positions
      const mockPositions = [
        {
          id: 1,
          pool_id: 'conservative',
          pool_name: 'Conservative Pool',
          amount: 1000,
          staked_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
          unlock_time: Date.now() + 2 * 24 * 60 * 60 * 1000,
          apy: 5.0,
          pending_rewards: 25
        }
      ];
      setUserPositions(mockPositions);
    }
  }, [user?.id]);

  const loadUserBalance = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setBalance(data.user.stg_balance || 0);
    } catch (error) {
      console.error('Failed to load user balance:', error);
      // Fallback balance
      setBalance(10000);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStakingPools();
    loadUserPositions();
    loadUserBalance();
  }, [loadStakingPools, loadUserBalance, loadUserPositions]);

  const stakeTokens = async (poolId, amount) => {
    try {
      setStaking(prev => ({ ...prev, [poolId]: true }));
      hapticFeedback('impact');
      
      if (amount < pools.find(p => p.id === poolId).minimum_stake) {
        toast.error(`Minimum stake is ${pools.find(p => p.id === poolId).minimum_stake} STG`);
        return;
      }
      
      if (amount > balance) {
        toast.error('Insufficient balance');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/staking/${poolId}/stake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseInt(amount) })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        hapticFeedback('success');
        
        // Update balance and pools
        setBalance(prev => prev - parseInt(amount));
        setPools(prev => prev.map(pool => 
          pool.id === poolId 
            ? { ...pool, user_staked: pool.user_staked + parseInt(amount) }
            : pool
        ));
        
        // Reload positions
        await loadUserPositions();
      } else {
        toast.error(data.error || 'Failed to stake tokens');
      }
    } catch (error) {
      console.error('Staking error:', error);
      toast.error('Failed to stake tokens');
    } finally {
      setStaking(prev => ({ ...prev, [poolId]: false }));
    }
  };

  const unstakeTokens = async (poolId) => {
    try {
      setStaking(prev => ({ ...prev, [poolId]: true }));
      hapticFeedback('impact');
      
      const response = await fetch(`http://localhost:3001/api/staking/${poolId}/unstake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        hapticFeedback('success');
        
        // Update balance and pools
        setBalance(prev => prev + data.total);
        setPools(prev => prev.map(pool => 
          pool.id === poolId 
            ? { ...pool, user_staked: Math.max(0, pool.user_staked - data.amount) }
            : pool
        ));
        
        // Reload positions
        await loadUserPositions();
      } else {
        toast.error(data.error || 'Failed to unstake tokens');
      }
    } catch (error) {
      console.error('Unstaking error:', error);
      toast.error('Failed to unstake tokens');
    } finally {
      setStaking(prev => ({ ...prev, [poolId]: false }));
    }
  };

  const claimRewards = async (poolId) => {
    try {
      setClaiming(prev => ({ ...prev, [poolId]: true }));
      hapticFeedback('impact');
      
      const response = await fetch(`http://localhost:3001/api/staking/${poolId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        hapticFeedback('success');
        
        // Update balance
        setBalance(prev => prev + data.rewards);
        
        // Reload positions
        await loadUserPositions();
      } else {
        toast.error(data.error || 'Failed to claim rewards');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim rewards');
    } finally {
      setClaiming(prev => ({ ...prev, [poolId]: false }));
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  const getRiskLevel = (apy) => {
    if (apy <= 5) return 'conservative';
    if (apy <= 15) return 'aggressive';
    return 'elite';
  };

  if (loading) {
    return <LoadingScreen text="Loading Staking Pools..." />;
  }

  return (
    <Container>
      <FadeIn>
        <Header>
          <Title>💰 Staking</Title>
          <Subtitle>Earn passive rewards by staking your STG tokens</Subtitle>
        </Header>

        <OverviewSection>
          <OverviewTitle>Your Staking Overview</OverviewTitle>
          <OverviewStats>
            <OverviewStat>
              <StatValue>{balance.toLocaleString()}</StatValue>
              <StatLabel>Available Balance</StatLabel>
            </OverviewStat>
            <OverviewStat>
              <StatValue>{userPositions.reduce((sum, pos) => sum + pos.amount, 0).toLocaleString()}</StatValue>
              <StatLabel>Total Staked</StatLabel>
            </OverviewStat>
            <OverviewStat>
              <StatValue>{userPositions.reduce((sum, pos) => sum + (pos.pending_rewards || 0), 0).toLocaleString()}</StatValue>
              <StatLabel>Pending Rewards</StatLabel>
            </OverviewStat>
            <OverviewStat>
              <StatValue>{userPositions.length}</StatValue>
              <StatLabel>Active Positions</StatLabel>
            </OverviewStat>
          </OverviewStats>
        </OverviewSection>

        <StaggerContainer staggerDelay={0.1}>
          <PoolsGrid>
            {pools.map((pool, index) => (
              <CardTransition key={pool.id} delay={index * 0.1}>
                <PoolCard
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PoolHeader>
                    <PoolInfo>
                      <PoolName>{pool.name}</PoolName>
                      <PoolRisk risk={getRiskLevel(pool.apy)}>
                        {getRiskLevel(pool.apy)}
                      </PoolRisk>
                    </PoolInfo>
                    <div>
                      <PoolAPY>{pool.apy}%</PoolAPY>
                      <PoolAPYLabel>Annual Percentage Yield</PoolAPYLabel>
                    </div>
                  </PoolHeader>

                  <PoolStats>
                    <PoolStat>
                      <PoolStatLabel>Total Staked</PoolStatLabel>
                      <PoolStatValue>{pool.total_staked.toLocaleString()} STG</PoolStatValue>
                    </PoolStat>
                    <PoolStat>
                      <PoolStatLabel>Stakers</PoolStatLabel>
                      <PoolStatValue>{pool.stakers}</PoolStatValue>
                    </PoolStat>
                    <PoolStat>
                      <PoolStatLabel>Lock Period</PoolStatLabel>
                      <PoolStatValue>{Math.round(pool.lock_period / (24 * 60 * 60 * 1000))} days</PoolStatValue>
                    </PoolStat>
                    <PoolStat>
                      <PoolStatLabel>Min Stake</PoolStatLabel>
                      <PoolStatValue>{pool.minimum_stake} STG</PoolStatValue>
                    </PoolStat>
                  </PoolStats>

                  {pool.user_staked > 0 ? (
                    <>
                      <StakingForm>
                        <FormTitle>Your Position</FormTitle>
                        <InputGroup>
                          <InputLabel>Staked Amount</InputLabel>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
                            {pool.user_staked.toLocaleString()} STG
                          </div>
                        </InputGroup>
                      </StakingForm>

                      <PositionActions>
                        <UnstakeButton
                          onClick={() => unstakeTokens(pool.id)}
                          disabled={!pool.can_unstake || staking[pool.id]}
                          whileHover={{ scale: pool.can_unstake ? 1.05 : 1 }}
                          whileTap={{ scale: pool.can_unstake ? 0.95 : 1 }}
                        >
                          {staking[pool.id] ? 'Processing...' : 'Unstake'}
                        </UnstakeButton>
                        <ClaimButton
                          onClick={() => claimRewards(pool.id)}
                          disabled={claiming[pool.id]}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {claiming[pool.id] ? 'Claiming...' : 'Claim Rewards'}
                        </ClaimButton>
                      </PositionActions>
                    </>
                  ) : (
                    <StakingForm>
                      <FormTitle>Stake Tokens</FormTitle>
                      <InputGroup>
                        <InputLabel>Amount (STG)</InputLabel>
                        <InputWrapper>
                          <StakeInput
                            type="number"
                            placeholder={`Min: ${pool.minimum_stake}`}
                            value={unstakeAmounts[pool.id] || ''}
                            onChange={(e) => setUnstakeAmounts(prev => ({
                              ...prev,
                              [pool.id]: e.target.value
                            }))}
                          />
                          <MaxButton
                            onClick={() => setUnstakeAmounts(prev => ({
                              ...prev,
                              [pool.id]: balance.toString()
                            }))}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            MAX
                          </MaxButton>
                        </InputWrapper>
                      </InputGroup>
                      <StakeButton
                        onClick={() => stakeTokens(pool.id, unstakeAmounts[pool.id] || 0)}
                        disabled={!unstakeAmounts[pool.id] || staking[pool.id]}
                        whileHover={{ scale: unstakeAmounts[pool.id] ? 1.05 : 1 }}
                        whileTap={{ scale: unstakeAmounts[pool.id] ? 0.95 : 1 }}
                      >
                        {staking[pool.id] ? 'Staking...' : 'Stake Tokens'}
                      </StakeButton>
                    </StakingForm>
                  )}
                </PoolCard>
              </CardTransition>
            ))}
          </PoolsGrid>
        </StaggerContainer>

        {userPositions.length > 0 && (
          <UserPositions>
            <PositionsTitle>Your Active Positions</PositionsTitle>
            <PositionList>
              {userPositions.map((position, index) => (
                <PositionCard
                  key={position.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PositionHeader>
                    <PositionPool>{position.pool_name}</PositionPool>
                    <PositionAmount>{position.amount.toLocaleString()} STG</PositionAmount>
                  </PositionHeader>
                  
                  {position.pending_rewards > 0 && (
                    <RewardsDisplay>
                      <RewardsAmount>{position.pending_rewards.toLocaleString()} STG</RewardsAmount>
                      <RewardsLabel>Pending Rewards</RewardsLabel>
                    </RewardsDisplay>
                  )}
                  
                  <PositionDetails>
                    <PositionDetail>APY: {position.apy}%</PositionDetail>
                    <PositionDetail>Staked: {new Date(position.staked_at).toLocaleDateString()}</PositionDetail>
                    <PositionDetail>Unlocks: {formatTimeRemaining(position.unlock_time - Date.now())}</PositionDetail>
                    <PositionDetail>Status: {position.unlock_time > Date.now() ? 'Locked' : 'Unlocked'}</PositionDetail>
                  </PositionDetails>
                </PositionCard>
              ))}
            </PositionList>
          </UserPositions>
        )}
      </FadeIn>
    </Container>
  );
};

export default Staking;
