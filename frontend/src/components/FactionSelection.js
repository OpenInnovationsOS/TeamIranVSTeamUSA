import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  background: linear-gradient(45deg, #0088cc, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40px;
  text-align: center;
  max-width: 300px;
`;

const FactionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px;
`;

const FactionCard = styled(motion.div)`
  background: linear-gradient(135deg, ${props => 
    props.faction === 'iran' ? '#00a652' : '#002868'
  } 0%, ${props => 
    props.faction === 'iran' ? '#008844' : '#001848'
  } 100%);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  ${props => props.selected && `
    border-color: #ffffff;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  `}
`;

const FactionFlag = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const FactionName = styled.h3`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #ffffff;
`;

const FactionDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
`;

const BonusText = styled.div`
  font-size: 12px;
  color: #ffd43b;
  margin-top: 8px;
  font-weight: bold;
`;

const SelectButton = styled(motion.button)`
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: #ffffff;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 136, 204, 0.4);
  }
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

const FactionSelection = () => {
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateUser } = useAuthStore();
  const { hapticFeedback, showAlert } = useTelegram();

  const factions = [
    {
      id: 'iran',
      name: 'Team Iran',
      flag: '🇮🇷',
      description: 'Join the Persian warriors and fight for honor and glory!',
      bonus: '+10% Defense Bonus'
    },
    {
      id: 'usa',
      name: 'Team USA',
      flag: '🇺🇸',
      description: 'Stand with the American heroes and defend freedom!',
      bonus: '+10% Attack Bonus'
    }
  ];

  const handleFactionSelect = async () => {
    if (!selectedFaction) {
      toast.error('Please select a faction');
      return;
    }

    setIsSubmitting(true);
    hapticFeedback('impact');

    try {
      const response = await fetch('http://localhost:3001/api/game/faction/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ faction: selectedFaction })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        updateUser({ faction: selectedFaction });
        hapticFeedback('success');
        showAlert(`Welcome to Team ${selectedFaction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!`);
        toast.success(data.message);
        
        // Reload the page to show the game dashboard
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to select faction');
      }
    } catch (error) {
      console.error('Faction selection error:', error);
      toast.error(error.message || 'Failed to select faction');
      hapticFeedback('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Choose Your Side</Title>
        <Subtitle>
          Select your faction and join the ultimate battle for dominance!
        </Subtitle>
      </motion.div>

      <InfoBox>
        ⚠️ This choice is permanent and will affect your gameplay experience
      </InfoBox>

      <FactionGrid>
        {factions.map((faction, index) => (
          <FactionCard
            key={faction.id}
            faction={faction.id}
            selected={selectedFaction === faction.id}
            onClick={() => {
              setSelectedFaction(faction.id);
              hapticFeedback('impact');
            }}
            initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FactionFlag>{faction.flag}</FactionFlag>
            <FactionName>{faction.name}</FactionName>
            <FactionDescription>{faction.description}</FactionDescription>
            <BonusText>{faction.bonus}</BonusText>
          </FactionCard>
        ))}
      </FactionGrid>

      <SelectButton
        onClick={handleFactionSelect}
        disabled={!selectedFaction || isSubmitting}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isSubmitting ? 'Joining...' : `Join Team ${selectedFaction === 'iran' ? 'Iran 🇮🇷' : selectedFaction === 'usa' ? 'USA 🇺🇸' : '...'}`}
      </SelectButton>
    </Container>
  );
};

export default FactionSelection;
