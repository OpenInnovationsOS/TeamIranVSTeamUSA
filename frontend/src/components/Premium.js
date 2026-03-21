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
  background: linear-gradient(45deg, #f39c12, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const StatusBanner = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'vip': return 'linear-gradient(45deg, #9b59b6, #8e44ad)';
      case 'premium': return 'linear-gradient(45deg, #3498db, #2980b9)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const StatusDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 12px;
`;

const StatusBenefits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const StatusBenefit = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
`;

const FilterTab = styled(motion.button)`
  flex: 1;
  padding: 12px 16px;
  background: ${props => props.active ? 'rgba(243, 156, 18, 0.2)' : 'transparent'};
  border: none;
  border-radius: 8px;
  color: ${props => props.active ? '#f39c12' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(243, 156, 18, 0.1);
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
`;

const FeatureCard = styled(motion.div)`
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
    border-color: rgba(243, 156, 18, 0.3);
  }
`;

const FeaturedBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
`;

const FeatureHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const FeatureInfo = styled.div`
  flex: 1;
`;

const FeatureName = styled.h3`
  font-size: 22px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const FeatureType = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const FeaturePrice = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 4px;
`;

const FeatureDuration = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
`;

const FeatureDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const BenefitsList = styled.div`
  background: rgba(243, 156, 18, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BenefitIcon = styled.div`
  color: #f39c12;
  font-size: 16px;
`;

const FeatureFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OwnedStatus = styled.div`
  color: #27ae60;
  font-size: 14px;
  font-weight: 500;
`;

const PurchaseButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(45deg, #f39c12, #e74c3c);
  color: white;
  border: none;
  border-radius: 8px;
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

const ActiveBoostsSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
`;

const BoostsTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16px;
`;

const BoostsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const BoostItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BoostInfo = styled.div`
  flex: 1;
`;

const BoostName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const BoostTimeRemaining = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const Premium = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [features, setFeatures] = useState([]);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [activeBoosts, setActiveBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadPremiumFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/premium/features', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Failed to load premium features:', error);
      // Fallback features
      const fallbackFeatures = [
        {
          id: 'battle_pass',
          name: 'Battle Pass',
          description: 'Unlock exclusive rewards and bonuses',
          price: 9.99,
          ton_price: 3.5,
          duration: 2592000000, // 30 days
          benefits: ['Double Battle Rewards', 'Exclusive Weapons', 'Priority Support'],
          user_owned: false
        },
        {
          id: 'vip_access',
          name: 'VIP Access',
          description: 'Premium features and exclusive content',
          price: 19.99,
          ton_price: 7.0,
          duration: 2592000000, // 30 days
          benefits: ['All Battle Pass Benefits', 'Custom Profile', 'Guild Leadership'],
          user_owned: false
        },
        {
          id: 'ultimate_pack',
          name: 'Ultimate Pack',
          description: 'Complete premium experience',
          price: 49.99,
          ton_price: 17.5,
          duration: 7776000000, // 90 days
          benefits: ['All Premium Features', 'Exclusive Tournaments', 'Maximum Rewards'],
          user_owned: false
        }
      ];
      setFeatures(fallbackFeatures);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadPremiumStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/premium/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setActiveBoosts(data.active_boosts || []);
      setPremiumStatus(data.premium_active || false);
    } catch (error) {
      console.error('Failed to load premium status:', error);
      // Fallback status
      setActiveBoosts([]);
      setPremiumStatus(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPremiumFeatures();
    loadPremiumStatus();
  }, [loadPremiumFeatures, loadPremiumStatus]);

  const purchaseFeature = async (feature) => {
    try {
      setPurchasing(feature.id);
      hapticFeedback('impact');
      
      const response = await fetch(`http://localhost:3000/api/premium/${feature.id}/purchase`, {
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
        
        // Update premium status
        await loadPremiumStatus();
        
        // Update feature ownership
        setFeatures(prev => prev.map(f => 
          f.id === feature.id ? { ...f, user_owned: true } : f
        ));
      } else {
        toast.error(data.error || 'Failed to purchase feature');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase feature');
    } finally {
      setPurchasing(null);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredFeatures = features.filter(feature => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'subscriptions') return feature.duration !== null;
    if (activeFilter === 'consumables') return feature.duration === null;
    return true;
  });

  if (loading) {
    return <LoadingScreen text="Loading Premium Shop..." />;
  }

  return (
    <Container>
      <FadeIn>
        <Header>
          <Title>💎 Premium Shop</Title>
          <Subtitle>Unlock exclusive features and bonuses</Subtitle>
        </Header>

        {premiumStatus && (
          <StatusBanner status={premiumStatus.status}>
            <StatusTitle>
              {premiumStatus.status === 'vip' ? '👑 VIP Member' :
               premiumStatus.status === 'premium' ? '⭐ Premium Member' :
               '🆓 Free Account'}
            </StatusTitle>
            <StatusDescription>
              {premiumStatus.status === 'vip' ? 'Enjoy all premium benefits and exclusive access' :
               premiumStatus.status === 'premium' ? 'Enjoy enhanced gameplay experience' :
               'Upgrade to unlock powerful features'}
            </StatusDescription>
            {premiumStatus.benefits && (
              <StatusBenefits>
                {premiumStatus.benefits.experience_multiplier > 1 && (
                  <StatusBenefit>{premiumStatus.benefits.experience_multiplier}x EXP</StatusBenefit>
                )}
                {premiumStatus.benefits.reward_multiplier > 1 && (
                  <StatusBenefit>+{Math.round((premiumStatus.benefits.reward_multiplier - 1) * 100)}% Rewards</StatusBenefit>
                )}
                {premiumStatus.benefits.critical_chance_bonus > 0 && (
                  <StatusBenefit>+{Math.round(premiumStatus.benefits.critical_chance_bonus * 100)}% Critical</StatusBenefit>
                )}
              </StatusBenefits>
            )}
          </StatusBanner>
        )}

        {activeBoosts.length > 0 && (
          <ActiveBoostsSection>
            <BoostsTitle>⚡ Active Boosts</BoostsTitle>
            <BoostsList>
              {activeBoosts.map((boost, index) => (
                <BoostItem key={boost.id}>
                  <BoostInfo>
                    <BoostName>{boost.name}</BoostName>
                    <BoostTimeRemaining>
                      {formatTimeRemaining(boost.time_remaining)} remaining
                    </BoostTimeRemaining>
                  </BoostInfo>
                </BoostItem>
              ))}
            </BoostsList>
          </ActiveBoostsSection>
        )}

        <FilterTabs>
          <FilterTab
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            All
          </FilterTab>
          <FilterTab
            active={activeFilter === 'subscriptions'}
            onClick={() => setActiveFilter('subscriptions')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Subscriptions
          </FilterTab>
          <FilterTab
            active={activeFilter === 'consumables'}
            onClick={() => setActiveFilter('consumables')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Consumables
          </FilterTab>
        </FilterTabs>

        <StaggerContainer staggerDelay={0.1}>
          <FeaturesGrid>
            {filteredFeatures.map((feature, index) => (
              <CardTransition key={feature.id} delay={index * 0.1}>
                <FeatureCard
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {feature.id === 'vip_status' && (
                    <FeaturedBadge>Most Popular</FeaturedBadge>
                  )}

                  <FeatureHeader>
                    <FeatureInfo>
                      <FeatureName>{feature.name}</FeatureName>
                      <FeatureType>
                        {feature.duration ? 'Subscription' : 'One-time Purchase'}
                      </FeatureType>
                      <FeaturePrice>${feature.price}</FeaturePrice>
                      {feature.duration && (
                        <FeatureDuration>
                          {Math.round(feature.duration / (24 * 60 * 60 * 1000))} days
                        </FeatureDuration>
                      )}
                    </FeatureInfo>
                  </FeatureHeader>

                  <FeatureDescription>{feature.description}</FeatureDescription>

                  <BenefitsList>
                    {feature.benefits.map((benefit, idx) => (
                      <BenefitItem key={idx}>
                        <BenefitIcon>✨</BenefitIcon>
                        {benefit}
                      </BenefitItem>
                    ))}
                  </BenefitsList>

                  <FeatureFooter>
                    {feature.user_owned ? (
                      <OwnedStatus>✓ Owned</OwnedStatus>
                    ) : (
                      <PurchaseButton
                        onClick={() => purchaseFeature(feature)}
                        disabled={purchasing === feature.id}
                        whileHover={{ scale: purchasing === feature.id ? 1 : 1.05 }}
                        whileTap={{ scale: purchasing === feature.id ? 1 : 0.95 }}
                      >
                        {purchasing === feature.id ? 'Purchasing...' : 'Purchase'}
                      </PurchaseButton>
                    )}
                  </FeatureFooter>
                </FeatureCard>
              </CardTransition>
            ))}
          </FeaturesGrid>
        </StaggerContainer>
      </FadeIn>
    </Container>
  );
};

export default Premium;
