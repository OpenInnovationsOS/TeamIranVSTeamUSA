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
  background: linear-gradient(45deg, #00a652, #002868);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const MapContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TerritoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const TerritoryCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => 
    props.controllingFaction === 'iran' ? '#00a652' : 
    props.controllingFaction === 'usa' ? '#002868' : 
    'rgba(255, 255, 255, 0.1)'
  } 0%, ${props => 
    props.controllingFaction === 'iran' ? '#008844' : 
    props.controllingFaction === 'usa' ? '#001848' : 
    'rgba(255, 255, 255, 0.05)'
  } 100%);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => 
    props.controllingFaction === 'iran' ? '#00a652' : 
    props.controllingFaction === 'usa' ? '#002868' : 
    'rgba(255, 255, 255, 0.2)'
  };
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
`;

const TerritoryName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const TerritoryFlag = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const TerritoryScore = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
`;

const TerritoryProgress = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #00a6ff);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
`;

const TerritoryMap = () => {
  const { user } = useAuthStore();
  const [territories, setTerritories] = useState([]);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  useEffect(() => {
    loadTerritories();
  }, []);

  const loadTerritories = async () => {
    try {
      // Mock data for now - in real app, this would come from API
      const mockTerritories = [
        { id: 1, name: 'Tehran', controllingFaction: 'iran', iranScore: 800, usaScore: 200 },
        { id: 2, name: 'Washington D.C.', controllingFaction: 'usa', iranScore: 150, usaScore: 1200 },
        { id: 3, name: 'New York', controllingFaction: 'usa', iranScore: 200, usaScore: 1000 },
        { id: 4, name: 'Los Angeles', controllingFaction: 'usa', iranScore: 150, usaScore: 800 },
        { id: 5, name: 'Chicago', controllingFaction: 'neutral', iranScore: 400, usaScore: 400 },
        { id: 6, name: 'Houston', controllingFaction: 'neutral', iranScore: 300, usaScore: 300 },
        { id: 7, name: 'Isfahan', controllingFaction: 'iran', iranScore: 700, usaScore: 150 },
        { id: 8, name: 'Mashhad', controllingFaction: 'iran', iranScore: 600, usaScore: 100 },
        { id: 9, name: 'Tabriz', controllingFaction: 'iran', iranScore: 550, usaScore: 200 },
        { id: 10, name: 'Shiraz', controllingFaction: 'iran', iranScore: 500, usaScore: 180 },
        { id: 11, name: 'London', controllingFaction: 'neutral', iranScore: 450, usaScore: 450 },
        { id: 12, name: 'Paris', controllingFaction: 'neutral', iranScore: 400, usaScore: 400 },
        { id: 13, name: 'Berlin', controllingFaction: 'neutral', iranScore: 350, usaScore: 350 },
        { id: 14, name: 'Tokyo', controllingFaction: 'neutral', iranScore: 300, usaScore: 300 },
        { id: 15, name: 'Sydney', controllingFaction: 'neutral', iranScore: 250, usaScore: 250 },
      ];
      
      setTerritories(mockTerritories);
    } catch (error) {
      console.error('Failed to load territories:', error);
    }
  };

  const getTerritoryFlag = (controllingFaction) => {
    switch (controllingFaction) {
      case 'iran': return '🇮🇷';
      case 'usa': return '🇺🇸';
      default: return '⚪';
    }
  };

  const getProgressPercentage = (iranScore, usaScore) => {
    const total = iranScore + usaScore;
    if (total === 0) return 50;
    return Math.round((iranScore / total) * 100);
  };

  const getFactionStats = () => {
    const iranTerritories = territories.filter(t => t.controllingFaction === 'iran').length;
    const usaTerritories = territories.filter(t => t.controllingFaction === 'usa').length;
    const neutralTerritories = territories.filter(t => t.controllingFaction === 'neutral').length;
    
    return { iranTerritories, usaTerritories, neutralTerritories };
  };

  const stats = getFactionStats();

  return (
    <Container>
      <Title>🗺️ Territory Control</Title>

      <MapContainer>
        <TerritoryGrid>
          {territories.map((territory) => (
            <TerritoryCard
              key={territory.id}
              controllingFaction={territory.controllingFaction}
              onClick={() => setSelectedTerritory(territory)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: territory.id * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TerritoryName>{territory.name}</TerritoryName>
              <TerritoryFlag>{getTerritoryFlag(territory.controllingFaction)}</TerritoryFlag>
              <TerritoryScore>
                🇮🇷 {territory.iranScore} vs 🇺🇸 {territory.usaScore}
              </TerritoryScore>
              <TerritoryProgress>
                <ProgressBar 
                  percentage={getProgressPercentage(territory.iranScore, territory.usaScore)}
                />
              </TerritoryProgress>
            </TerritoryCard>
          ))}
        </TerritoryGrid>

        <StatsContainer>
          <StatCard>
            <StatLabel>🇮🇷 Iran Territories</StatLabel>
            <StatValue>{stats.iranTerritories}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>🇺🇸 USA Territories</StatLabel>
            <StatValue>{stats.usaTerritories}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>⚪ Neutral Territories</StatLabel>
            <StatValue>{stats.neutralTerritories}</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>🗺️ Total Territories</StatLabel>
            <StatValue>{territories.length}</StatValue>
          </StatCard>
        </StatsContainer>

        {selectedTerritory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
            }}
          >
            <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>
              {selectedTerritory.name} Details
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              Controlled by: {selectedTerritory.controllingFaction === 'iran' ? '🇮🇷 Iran' : 
                           selectedTerritory.controllingFaction === 'usa' ? '🇺🇸 USA' : 
                           '⚪ Neutral'}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
              Iran Score: {selectedTerritory.iranScore} | USA Score: {selectedTerritory.usaScore}
            </p>
          </motion.div>
        )}
      </MapContainer>
    </Container>
  );
};

export default TerritoryMap;
