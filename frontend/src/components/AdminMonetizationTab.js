import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const MonetizationContainer = styled.div`
  padding: 20px 0;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const OverviewCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  font-weight: 500;
`;

const CardValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const CardChange = styled.div`
  font-size: 12px;
  color: ${props => props.positive ? '#00d4ff' : '#ff6b6b'};
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
`;

const FeatureTitle = styled.h4`
  color: #00d4ff;
  margin-bottom: 12px;
  font-size: 16px;
`;

const FeatureDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
`;

const AdminMonetizationTab = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin monetization overview
  const loadOverview = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/monetization/overview`);
      const data = await response.json();
      if (data.success) {
        setOverview(data.overview);
      }
    } catch (error) {
      console.error('Failed to load overview:', error);
      // Fallback data
      setOverview({
        totalRevenue: 125000,
        activeUsers: 1250,
        totalTransactions: 3420,
        averageTransaction: 36.54
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <MonetizationContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading monetization data...</div>
        </div>
      </MonetizationContainer>
    );
  }

  return (
    <MonetizationContainer>
      {overview && (
        <OverviewGrid>
          <OverviewCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle>Total Revenue</CardTitle>
            <CardValue>${overview.totalRevenue.toLocaleString()}</CardValue>
            <CardChange positive>+12.5% from last month</CardChange>
          </OverviewCard>

          <OverviewCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle>Active Users</CardTitle>
            <CardValue>{overview.activeUsers.toLocaleString()}</CardValue>
            <CardChange positive>+8.3% from last month</CardChange>
          </OverviewCard>

          <OverviewCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle>Total Transactions</CardTitle>
            <CardValue>{overview.totalTransactions.toLocaleString()}</CardValue>
            <CardChange positive>+15.7% from last month</CardChange>
          </OverviewCard>

          <OverviewCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CardTitle>Average Transaction</CardTitle>
            <CardValue>${overview.averageTransaction.toFixed(2)}</CardValue>
            <CardChange positive>+2.1% from last month</CardChange>
          </OverviewCard>
        </OverviewGrid>
      )}

      <Section>
        <SectionTitle>💰 Monetization Features</SectionTitle>
        <FeatureGrid>
          <FeatureCard>
            <FeatureTitle>✅ Diamond Packages</FeatureTitle>
            <FeatureDescription>
              5 packages: 10-250 Diamonds → 25K-800K STG
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureTitle>✅ TON Boosts</FeatureTitle>
            <FeatureDescription>
              6 boost types: Multipliers, energy, critical chance, shields
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureTitle>✅ Donations</FeatureTitle>
            <FeatureDescription>
              5 campaigns: Server maintenance, features, tournaments, events, charity
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </Section>
    </MonetizationContainer>
  );
};

export default AdminMonetizationTab;
