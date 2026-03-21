import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { 
  AUTO_TAP_PLANS, 
  PLAN_TIERS, 
  AUTO_TAP_STATUS, 
  getPlanById,
  getPlansByTier,
  calculateRemainingTime,
  calculateProgress,
  calculateCurrentEarnings,
  formatDuration,
  getAffordablePlans,
  AUTO_TAP_CONFIG
} from '../data/autoTapPlans';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #0088cc;
  margin-bottom: 10px;
  font-weight: bold;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #0088cc;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const ActivePlansSection = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #0088cc;
  margin-bottom: 20px;
`;

const ActivePlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ActivePlanCard = styled.div`
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
`;

const PlanTier = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => PLAN_TIERS[props.tier].color};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
`;

const PlanName = styled.h3`
  font-size: 1.3rem;
  color: #0088cc;
  margin-bottom: 15px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #00aaff);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const PlanStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
`;

const PlanStat = styled.div`
  text-align: center;
`;

const StatValueSmall = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #0088cc;
`;

const StatLabelSmall = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const CollectButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #0088cc, #00aaff);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
  }
`;

const PlansSection = styled.div`
  margin-bottom: 40px;
`;

const TierSection = styled.div`
  margin-bottom: 40px;
`;

const TierHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const TierIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 10px;
`;

const TierTitle = styled.h3`
  font-size: 1.5rem;
  color: ${props => PLAN_TIERS[props.tier].color};
  margin: 0;
`;

const TierDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 5px 0 0 0;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
`;

const PlanCard = styled.div`
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid ${props => PLAN_TIERS[props.tier].borderColor};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 136, 204, 0.2);
    border-color: ${props => PLAN_TIERS[props.tier].color};
  }

  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
`;

const PlanIcon = styled.div`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 10px;
`;

const PlanTitle = styled.h4`
  font-size: 1.2rem;
  color: #0088cc;
  margin-bottom: 10px;
  text-align: center;
`;

const PlanDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 15px;
  text-align: center;
`;

const PlanMetrics = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const Metric = styled.div`
  text-align: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const MetricValue = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #0088cc;
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const PlanCost = styled.div`
  text-align: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: ${props => props.canAfford ? '#4CAF50' : '#ff6b6b'};
  margin-bottom: 15px;
`;

const PurchaseButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${props => props.canAfford 
    ? 'linear-gradient(135deg, #0088cc, #00aaff)' 
    : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: ${props => props.canAfford ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;

  ${props => props.canAfford && `
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
    }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.7);
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const Notification = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  min-width: 300px;
  z-index: 1000;
`;

const NotificationTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #0088cc;
`;

const NotificationMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
`;

const AutoTap = () => {
  const { user, updateUser } = useAuthStore();
  const [activePlans, setActivePlans] = useState([]);
  const [userBalance, setUserBalance] = useState(user?.stg_balance || 0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load active plans from localStorage or API
  useEffect(() => {
    const savedPlans = localStorage.getItem('activeAutoTapPlans');
    if (savedPlans) {
      setActivePlans(JSON.parse(savedPlans));
    }
  }, []);

  // Save active plans to localStorage
  useEffect(() => {
    if (activePlans.length > 0) {
      localStorage.setItem('activeAutoTapPlans', JSON.stringify(activePlans));
    } else {
      localStorage.removeItem('activeAutoTapPlans');
    }
  }, [activePlans]);

  // Update user balance
  useEffect(() => {
    if (user) {
      setUserBalance(user.stg_balance || 0);
    }
  }, [user]);

  // Check for completed plans
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlans(prevPlans => {
        const updatedPlans = prevPlans.map(plan => {
          const remainingTime = calculateRemainingTime(plan.startTime, plan.duration);
          const progress = calculateProgress(plan.startTime, plan.duration);
          
          if (remainingTime <= 0 && plan.status === AUTO_TAP_STATUS.ACTIVE) {
            // Plan completed
            showNotification('Auto Tap Completed!', `${plan.name} has finished generating STG. Collect your rewards!`);
            return { ...plan, status: AUTO_TAP_STATUS.COMPLETED };
          }
          
          return plan;
        });
        
        return updatedPlans;
      });
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const showNotification = (title, message) => {
    const notification = {
      id: Date.now(),
      title,
      message
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const purchasePlan = async (planId) => {
    const plan = getPlanById(planId);
    if (!plan) return;
    
    if (userBalance < plan.cost) {
      showNotification('Insufficient Balance', `You need ${plan.cost} STG to purchase this plan.`);
      return;
    }
    
    if (activePlans.length >= AUTO_TAP_CONFIG.maxConcurrentPlans) {
      showNotification('Maximum Plans', `You can only have ${AUTO_TAP_CONFIG.maxConcurrentPlans} plans active at once.`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Deduct cost from balance
      const newBalance = userBalance - plan.cost;
      setUserBalance(newBalance);
      
      // Update user balance in store
      if (updateUser) {
        updateUser({ stg_balance: newBalance });
      }
      
      // Create active plan
      const newPlan = {
        id: Date.now().toString(),
        planId: plan.id,
        name: plan.name,
        tier: plan.tier,
        duration: plan.duration,
        stgReward: plan.stgReward,
        startTime: Date.now(),
        status: AUTO_TAP_STATUS.ACTIVE,
        icon: plan.icon
      };
      
      setActivePlans(prev => [...prev, newPlan]);
      
      showNotification('Plan Purchased!', `${plan.name} is now active and generating STG.`);
      
    } catch (error) {
      console.error('Error purchasing plan:', error);
      showNotification('Purchase Failed', 'There was an error purchasing the plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const collectRewards = async (planId) => {
    const planIndex = activePlans.findIndex(p => p.id === planId);
    if (planIndex === -1) return;
    
    const plan = activePlans[planIndex];
    if (plan.status !== AUTO_TAP_STATUS.COMPLETED) return;
    
    setLoading(true);
    
    try {
      // Add rewards to balance
      const newBalance = userBalance + plan.stgReward;
      setUserBalance(newBalance);
      
      // Update user balance in store
      if (updateUser) {
        updateUser({ stg_balance: newBalance });
      }
      
      // Remove completed plan
      setActivePlans(prev => prev.filter(p => p.id !== planId));
      
      showNotification('Rewards Collected!', `Successfully collected ${plan.stgReward} STG from ${plan.name}.`);
      
    } catch (error) {
      console.error('Error collecting rewards:', error);
      showNotification('Collection Failed', 'There was an error collecting rewards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAffordablePlans = useCallback(() => {
    return Object.values(AUTO_TAP_PLANS).filter(plan => plan.cost <= userBalance);
  }, [userBalance]);

  const renderActivePlan = (plan) => {
    const remainingTime = calculateRemainingTime(plan.startTime, plan.duration);
    const progress = calculateProgress(plan.startTime, plan.duration);
    const currentEarnings = calculateCurrentEarnings(plan.startTime, plan.duration, plan.stgReward);
    
    return (
      <ActivePlanCard key={plan.id}>
        <PlanTier tier={plan.tier}>{PLAN_TIERS[plan.tier].name}</PlanTier>
        <PlanName>{plan.icon} {plan.name}</PlanName>
        
        <ProgressBar>
          <ProgressFill progress={progress} />
        </ProgressBar>
        
        <PlanStats>
          <PlanStat>
            <StatValueSmall>{plan.stgReward} STG</StatValueSmall>
            <StatLabelSmall>Total Reward</StatLabelSmall>
          </PlanStat>
          <PlanStat>
            <StatValueSmall>{currentEarnings.toFixed(2)} STG</StatValueSmall>
            <StatLabelSmall>Current Earnings</StatLabelSmall>
          </PlanStat>
          <PlanStat>
            <StatValueSmall>{formatDuration(remainingTime)}</StatValueSmall>
            <StatLabelSmall>Time Remaining</StatLabelSmall>
          </PlanStat>
        </PlanStats>
        
        <CollectButton
          onClick={() => collectRewards(plan.id)}
          disabled={plan.status !== AUTO_TAP_STATUS.COMPLETED}
        >
          {plan.status === AUTO_TAP_STATUS.COMPLETED 
            ? `Collect ${plan.stgReward} STG` 
            : remainingTime > 0 
              ? `Collecting... ${Math.round(progress)}%`
              : 'Processing...'
          }
        </CollectButton>
      </ActivePlanCard>
    );
  };

  const renderPlanCard = (plan) => {
    const canAfford = userBalance >= plan.cost;
    const affordablePlans = getAffordablePlans();
    
    return (
      <PlanCard 
        key={plan.id} 
        tier={plan.tier}
        disabled={!canAfford}
        onClick={() => canAfford && purchasePlan(plan.id)}
      >
        <PlanIcon>{plan.icon}</PlanIcon>
        <PlanTitle>{plan.name}</PlanTitle>
        <PlanDescription>{plan.description}</PlanDescription>
        
        <PlanMetrics>
          <Metric>
            <MetricValue>{plan.stgReward} STG</MetricValue>
            <MetricLabel>Total Reward</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{formatDuration(plan.duration)}</MetricValue>
            <MetricLabel>Duration</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{plan.stgPerHour.toFixed(2)}/h</MetricValue>
            <MetricLabel>STG per Hour</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{plan.bonusMultiplier ? `${plan.bonusMultiplier}x` : '1x'}</MetricValue>
            <MetricLabel>Bonus</MetricLabel>
          </Metric>
        </PlanMetrics>
        
        <PlanCost canAfford={canAfford}>
          {canAfford ? `Cost: ${plan.cost} STG` : `Need ${plan.cost - userBalance} more STG`}
        </PlanCost>
        
        <PurchaseButton 
          canAfford={canAfford}
          onClick={() => canAfford && purchasePlan(plan.id)}
          disabled={!canAfford || loading}
        >
          {canAfford ? 'Purchase Plan' : 'Insufficient Balance'}
        </PurchaseButton>
      </PlanCard>
    );
  };

  return (
    <Container>
      <Header>
        <Title>⚡ Auto Tap</Title>
        <subtitle>Purchase automated STG generation plans</subtitle>
      </Header>

      <StatsSection>
        <StatCard>
          <StatValue>{userBalance.toFixed(2)}</StatValue>
          <StatLabel>Your STG Balance</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{activePlans.length}</StatValue>
          <StatLabel>Active Plans</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{AUTO_TAP_CONFIG.maxConcurrentPlans}</StatValue>
          <StatLabel>Max Concurrent Plans</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{getAffordablePlans().length}</StatValue>
          <StatLabel>Available Plans</StatLabel>
        </StatCard>
      </StatsSection>

      <ActivePlansSection>
        <SectionTitle>🔄 Active Plans</SectionTitle>
        {activePlans.length > 0 ? (
          <ActivePlansGrid>
            {activePlans.map(renderActivePlan)}
          </ActivePlansGrid>
        ) : (
          <EmptyState>
            <EmptyStateIcon>⚡</EmptyStateIcon>
            <p>No active plans. Purchase a plan below to start generating STG automatically!</p>
          </EmptyState>
        )}
      </ActivePlansSection>

      <PlansSection>
        <SectionTitle>🛍️ Available Plans</SectionTitle>
        
        {Object.keys(PLAN_TIERS).map(tier => (
          <TierSection key={tier}>
            <TierHeader>
              <TierIcon>{tier === 'basic' ? '⚡' : tier === 'premium' ? '💎' : tier === 'elite' ? '👑' : '🌟'}</TierIcon>
              <div>
                <TierTitle tier={tier}>{PLAN_TIERS[tier].name} Plans</TierTitle>
                <TierDescription>{PLAN_TIERS[tier].description}</TierDescription>
              </div>
            </TierHeader>
            
            <PlansGrid>
              {getPlansByTier(tier).map(renderPlanCard)}
            </PlansGrid>
          </TierSection>
        ))}
      </PlansSection>

      <AnimatePresence>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <NotificationTitle>{notification.title}</NotificationTitle>
            <NotificationMessage>{notification.message}</NotificationMessage>
          </Notification>
        ))}
      </AnimatePresence>
    </Container>
  );
};

export default AutoTap;
