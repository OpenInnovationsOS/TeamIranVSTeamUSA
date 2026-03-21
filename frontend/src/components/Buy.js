import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useTelegram } from '../hooks/useTelegram';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Heading = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  background: linear-gradient(45deg, #0088cc, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PaymentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const PackCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch(props.tier) {
        case 'starter': return 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        case 'pro': return 'linear-gradient(90deg, #2196F3, #03A9F4)';
        case 'expert': return 'linear-gradient(90deg, #9C27B0, #E91E63)';
        case 'master': return 'linear-gradient(90deg, #FF9800, #FF5722)';
        case 'vip': return 'linear-gradient(90deg, #FFD700, #FFA500)';
        case 'bronze': return 'linear-gradient(90deg, #CD7F32, #B87333)';
        case 'silver': return 'linear-gradient(90deg, #C0C0C0, #808080)';
        case 'gold': return 'linear-gradient(90deg, #FFD700, #FFA500)';
        case 'diamond': return 'linear-gradient(90deg, #B9F2FF, #00BFFF)';
        case 'whale': return 'linear-gradient(90deg, #1E90FF, #000080)';
        default: return 'linear-gradient(90deg, #667eea, #764ba2)';
      }
    }};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const PackName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #ffffff;
`;

const PackPrice = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  color: ${props => props.currency === 'stars' ? '#FFD700' : '#00BFFF'};
`;

const PackAmount = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 16px;
`;

const PurchaseButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #4CAF50, #8BC34A);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(45deg, #45a049, #7cb342);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const TonTransactionsButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: linear-gradient(45deg, #00BFFF, #1E90FF);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;

  &:hover {
    background: linear-gradient(45deg, #0099CC, #1E88E5);
  }
`;

const SecurityNote = styled.div`
  text-align: center;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Buy = () => {
  const { hapticFeedback } = useTelegram();
  const [loading, setLoading] = useState({});
  const [packs, setPacks] = useState({
    stars: [
      { id: 'starter', name: 'Starter Pack', price: 50, amount: 5000, tier: 'starter' },
      { id: 'pro', name: 'Pro Pack', price: 100, amount: 12000, tier: 'pro' },
      { id: 'expert', name: 'Expert Pack', price: 200, amount: 30000, tier: 'expert' },
      { id: 'master', name: 'Master Pack', price: 400, amount: 75000, tier: 'master' },
      { id: 'vip', name: 'VIP Pack', price: 750, amount: 150000, tier: 'vip' }
    ],
    ton: [
      { id: 'bronze', name: 'BRONZE Pack', price: 5, amount: 5000, tier: 'bronze' },
      { id: 'silver', name: 'SILVER Pack', price: 15, amount: 15000, tier: 'silver' },
      { id: 'gold', name: 'GOLD Pack', price: 30, amount: 40000, tier: 'gold' },
      { id: 'diamond', name: 'DIAMOND Pack', price: 100000, amount: 100000, tier: 'diamond' },
      { id: 'whale', name: 'WHALE Pack', price: 150, amount: 250000, tier: 'whale' }
    ]
  });

  useEffect(() => {
    loadBuyPacks();
  }, []);

  const loadBuyPacks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/buy/packs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.packs) {
          setPacks(data.packs);
        }
      }
    } catch (error) {
      console.error('Failed to load buy packs:', error);
    }
  };

  const handlePurchase = async (pack, currency) => {
    if (loading[pack.id]) return;
    
    setLoading(prev => ({ ...prev, [pack.id]: true }));
    hapticFeedback('impact');

    try {
      const response = await fetch('http://localhost:3001/api/buy/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          packId: pack.id,
          currency: currency,
          amount: pack.amount,
          price: pack.price
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully purchased ${pack.name}! +${pack.amount.toLocaleString()} STG`);
        hapticFeedback('success');
      } else {
        toast.error(data.error || 'Purchase failed');
        hapticFeedback('error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Network error. Please try again.');
      hapticFeedback('error');
    } finally {
      setLoading(prev => ({ ...prev, [pack.id]: false }));
    }
  };

  const handleTonTransactions = () => {
    hapticFeedback('impact');
    toast.success('Opening TON transaction history...');
    // Navigate to TON transactions page or open modal
  };

  return (
    <Container>
      <Header>
        <Heading>BUY BUY STG</Heading>
      </Header>

      <Section>
        <SectionTitle>
          <span>⭐</span>
          PAY WITH STARS
        </SectionTitle>
        <PaymentGrid>
          {packs.stars.map((pack) => (
            <PackCard
              key={pack.id}
              tier={pack.tier}
              currency="stars"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PackName>{pack.name}</PackName>
              <PackPrice currency="stars">⭐ {pack.price} Stars</PackPrice>
              <PackAmount>{pack.amount.toLocaleString()} STG</PackAmount>
              <PurchaseButton
                onClick={() => handlePurchase(pack, 'stars')}
                disabled={loading[pack.id]}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading[pack.id] ? <LoadingSpinner /> : 'Buy Now'}
              </PurchaseButton>
            </PackCard>
          ))}
        </PaymentGrid>
      </Section>

      <Section>
        <SectionTitle>
          <span>💎</span>
          PAY WITH TON
        </SectionTitle>
        <PaymentGrid>
          {packs.ton.map((pack) => (
            <PackCard
              key={pack.id}
              tier={pack.tier}
              currency="ton"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PackName>{pack.name}</PackName>
              <PackPrice currency="ton">💎 {pack.price} TON</PackPrice>
              <PackAmount>{pack.amount.toLocaleString()} STG</PackAmount>
              <PurchaseButton
                onClick={() => handlePurchase(pack, 'ton')}
                disabled={loading[pack.id]}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading[pack.id] ? <LoadingSpinner /> : 'Buy Now'}
              </PurchaseButton>
            </PackCard>
          ))}
        </PaymentGrid>
      </Section>

      <TonTransactionsButton
        onClick={handleTonTransactions}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        TON TRANSACTIONS
      </TonTransactionsButton>

      <SecurityNote>
        <span>🔒</span>
        All payments are processed securely.
      </SecurityNote>
    </Container>
  );
};

export default Buy;
