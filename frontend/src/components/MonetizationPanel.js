import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MonetizationContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  margin: 20px 0;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const ProductCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const ProductIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const ProductName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ProductPrice = styled.div`
  color: #4ecdc4;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ProductDescription = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 15px;
`;

const PurchaseButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PromotionInput = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 15px;
  color: white;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4ecdc4;
  }
`;

const ApplyButton = styled.button`
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid #4ecdc4;
  border-radius: 10px;
  color: #4ecdc4;
  font-weight: bold;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(78, 205, 196, 0.3);
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ecdc4;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 5px;
`;

const MonetizationPanel = ({ userStats, onPurchase }) => {
  const [products, setProducts] = useState({ stgTokens: [], premiumFeatures: [] });
  const [loading, setLoading] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionDiscount, setPromotionDiscount] = useState(null);
  const [userPurchases, setUserPurchases] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchUserPurchases();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchUserPurchases = async () => {
    try {
      const response = await fetch('/api/user/purchases');
      const data = await response.json();
      setUserPurchases(data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const validatePromotion = async () => {
    if (!promotionCode.trim()) return;

    try {
      const response = await fetch('/api/validate-promotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userStats.id
        },
        body: JSON.stringify({ code: promotionCode })
      });

      const data = await response.json();
      
      if (data.valid) {
        setPromotionDiscount(data);
        toast.success(`Promotion applied! ${data.discount * 100}% discount`);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Invalid promotion code');
    }
  };

  const purchaseSTGTokens = async (productId) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/purchase/stg-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userStats.id
        },
        body: JSON.stringify({ 
          productId,
          paymentMethod: 'stripe',
          promotionCode: promotionDiscount ? promotionCode : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        onPurchase('stg_tokens', data.tokens);
        fetchUserPurchases();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const subscribePremium = async (featureId) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/subscribe/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userStats.id
        },
        body: JSON.stringify({ 
          featureId,
          paymentMethod: 'stripe'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        onPurchase('premium', featureId);
        fetchUserPurchases();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (price) => {
    if (!promotionDiscount) return price;
    
    if (promotionDiscount.type === 'percentage') {
      return price * (1 - promotionDiscount.discount);
    } else if (promotionDiscount.type === 'fixed') {
      return Math.max(0, price - promotionDiscount.discount);
    }
    
    return price;
  };

  const renderSTGTokenProducts = () => (
    <div>
      <Title>💰 STG Token Packs</Title>
      <ProductGrid>
        {products.stgTokens?.map((product) => (
          <ProductCard
            key={product.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !loading && purchaseSTGTokens(product.id)}
          >
            <ProductIcon>💎</ProductIcon>
            <ProductName>{product.amount.toLocaleString()} STG</ProductName>
            <ProductPrice>${calculatePrice(product.price).toFixed(2)}</ProductPrice>
            {product.bonus > 0 && (
              <ProductDescription>+{product.bonus.toLocaleString()} bonus tokens!</ProductDescription>
            )}
            <PurchaseButton disabled={loading}>
              {loading ? 'Processing...' : 'Purchase'}
            </PurchaseButton>
          </ProductCard>
        ))}
      </ProductGrid>
    </div>
  );

  const renderPremiumFeatures = () => (
    <div>
      <Title>⭐ Premium Features</Title>
      <ProductGrid>
        {products.premiumFeatures?.map((feature) => {
          const isSubscribed = userStats.premiumFeatures?.includes(feature.id);
          
          return (
            <ProductCard
              key={feature.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !loading && !isSubscribed && subscribePremium(feature.id)}
            >
              <ProductIcon>⭐</ProductIcon>
              <ProductName>{feature.name}</ProductName>
              <ProductPrice>${calculatePrice(feature.monthly).toFixed(2)}/month</ProductPrice>
              <ProductDescription>{feature.description}</ProductDescription>
              <PurchaseButton disabled={loading || isSubscribed}>
                {isSubscribed ? 'Subscribed' : loading ? 'Processing...' : 'Subscribe'}
              </PurchaseButton>
            </ProductCard>
          );
        })}
      </ProductGrid>
    </div>
  );

  const renderStats = () => (
    <div>
      <Title>📊 Your Stats</Title>
      <StatsContainer>
        <StatCard>
          <StatValue>{userStats.stgTokens.toLocaleString()}</StatValue>
          <StatLabel>STG Tokens</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{userStats.energy}/{userStats.maxEnergy}</StatValue>
          <StatLabel>Energy</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{userStats.wins}</StatValue>
          <StatLabel>Wins</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{userStats.winRate}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
      </StatsContainer>
    </div>
  );

  return (
    <MonetizationContainer>
      <PromotionInput>
        <Input
          type="text"
          placeholder="Enter promotion code"
          value={promotionCode}
          onChange={(e) => setPromotionCode(e.target.value)}
        />
        <ApplyButton onClick={validatePromotion}>Apply</ApplyButton>
      </PromotionInput>

      {renderStats()}
      {renderSTGTokenProducts()}
      {renderPremiumFeatures()}
    </MonetizationContainer>
  );
};

export default MonetizationPanel;
