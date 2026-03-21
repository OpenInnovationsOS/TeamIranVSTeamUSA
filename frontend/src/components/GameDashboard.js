// Enhanced Game Dashboard - Multi-Card & Multi-Tab System
import React, { useState } from 'react';
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
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #ff6b6b, #0088cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const TabButton = styled(motion.button)`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #0088cc, #ff6b6b);
    color: #ffffff;
    border-color: transparent;
  }
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ModularCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 136, 204, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const CardContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const StatValue = styled.span`
  color: #00a6ff;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #0088cc, #ff6b6b);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }
`;

const GameDashboard = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('overview');

  const dashboardTabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'battle', label: 'Battle', icon: '⚔️' },
    { id: 'weapons', label: 'Weapons', icon: '🎯' },
    { id: 'territory', label: 'Territory', icon: '🗺️' },
    { id: 'guilds', label: 'Guilds', icon: '👥' },
    { id: 'tournaments', label: 'Tournaments', icon: '🏆' }
  ];

  const OverviewCards = () => [
    {
      id: 'player-stats',
      title: 'Player Statistics',
      icon: '👤',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Level</StatLabel>
            <StatValue>{user?.level || 1}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Faction</StatLabel>
            <StatValue>{user?.faction || 'None'}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>STG Balance</StatLabel>
            <StatValue>{(user?.stg_balance || 0).toLocaleString()}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Win Rate</StatLabel>
            <StatValue>67%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Battles</StatLabel>
            <StatValue>1,234</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Profile
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'battle-history',
      title: 'Battle History',
      icon: '⚔️',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Last Battle</StatLabel>
            <StatValue>Victory</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Win Streak</StatLabel>
            <StatValue>5</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Battle Score</StatLabel>
            <StatValue>2,450</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Rank</StatLabel>
            <StatValue>#42</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Experience</StatLabel>
            <StatValue>12,450 / 15,000</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View History
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'territory-status',
      title: 'Territory Status',
      icon: '🗺️',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Controlled</StatLabel>
            <StatValue>3 / 6</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Territory Bonus</StatLabel>
            <StatValue>+15% ATK</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Defense Power</StatLabel>
            <StatValue>2,340</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Last Attack</StatLabel>
            <StatValue>2 hours ago</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Next Battle</StatLabel>
            <StatValue>1 hour</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Territory
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'guild-info',
      title: 'Guild Information',
      icon: '👥',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Guild</StatLabel>
            <StatValue>Elite Warriors</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Members</StatLabel>
            <StatValue>45 / 50</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Guild Rank</StatLabel>
            <StatValue>#8</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Guild Power</StatLabel>
            <StatValue>12,450</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Contribution</StatLabel>
            <StatValue>2,340</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Guild
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'tournaments',
      title: 'Active Tournaments',
      icon: '🏆',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Current</StatLabel>
            <StatValue>Spring Championship</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Participants</StatLabel>
            <StatValue>234 / 500</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Prize Pool</StatLabel>
            <StatValue>50,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Ends In</StatLabel>
            <StatValue>3 days</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Rank</StatLabel>
            <StatValue>#67</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Tournaments
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      icon: '🛒',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>New Items</StatLabel>
            <StatValue>12</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Weapons</StatLabel>
            <StatValue>18</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Special Offers</StatLabel>
            <StatValue>3</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Market Volume</StatLabel>
            <StatValue>125,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Listings</StatLabel>
            <StatValue>2</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Marketplace
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const BattleCards = () => [
    {
      id: 'quick-battle',
      title: 'Quick Battle',
      icon: '⚡',
      content: (
        <CardContent>
          <p>Jump into an instant battle with random opponent!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Quick Battle
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'ranked-battle',
      title: 'Ranked Battle',
      icon: '🏆',
      content: (
        <CardContent>
          <p>Compete for ranking points and climb the leaderboard!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Ranked Battle
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'tournament-battle',
      title: 'Tournament Battle',
      icon: '🎯',
      content: (
        <CardContent>
          <p>Join ongoing tournaments and win exclusive rewards!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Tournaments
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const WeaponsCards = () => [
    {
      id: 'weapon-shop',
      title: 'Weapon Shop',
      icon: '🛒',
      content: (
        <CardContent>
          <p>Browse and purchase advanced military weapons!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Visit Weapon Shop
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'weapon-inventory',
      title: 'Weapon Inventory',
      icon: '🎒',
      content: (
        <CardContent>
          <p>Manage your weapon collection and equipment!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Inventory
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'weapon-upgrades',
      title: 'Weapon Upgrades',
      icon: '⚡',
      content: (
        <CardContent>
          <p>Enhance your weapons with powerful upgrades!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Upgrade Weapons
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const TerritoryCards = () => [
    {
      id: 'territory-map',
      title: 'Territory Map',
      icon: '🗺️',
      content: (
        <CardContent>
          <p>View and control strategic territories!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Open Territory Map
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'territory-battles',
      title: 'Territory Battles',
      icon: '⚔️',
      content: (
        <CardContent>
          <p>Engage in territory control battles!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Territory Battles
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'territory-rewards',
      title: 'Territory Rewards',
      icon: '💎',
      content: (
        <CardContent>
          <p>Claim rewards from controlled territories!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Rewards
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const GuildCards = () => [
    {
      id: 'guild-list',
      title: 'Guild List',
      icon: '👥',
      content: (
        <CardContent>
          <p>Browse and join powerful guilds!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Guilds
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'guild-activities',
      title: 'Guild Activities',
      icon: '🎯',
      content: (
        <CardContent>
          <p>Participate in guild events and activities!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Activities
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'guild-war',
      title: 'Guild War',
      icon: '⚔️',
      content: (
        <CardContent>
          <p>Compete against other guilds in epic wars!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Guild War
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const TournamentCards = () => [
    {
      id: 'active-tournaments',
      title: 'Active Tournaments',
      icon: '🏆',
      content: (
        <CardContent>
          <p>Join ongoing tournaments and compete!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Tournaments
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'tournament-history',
      title: 'Tournament History',
      icon: '📜',
      content: (
        <CardContent>
          <p>View your past tournament performances!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View History
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'tournament-rewards',
      title: 'Tournament Rewards',
      icon: '💎',
      content: (
        <CardContent>
          <p>Claim your tournament rewards!</p>
          <ActionButton
            onClick={() => hapticFeedback('impact')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Rewards
          </ActionButton>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'overview': return OverviewCards();
      case 'battle': return BattleCards();
      case 'weapons': return WeaponsCards();
      case 'territory': return TerritoryCards();
      case 'guilds': return GuildCards();
      case 'tournaments': return TournamentCards();
      default: return OverviewCards();
    }
  };

  return (
    <Container>
      <Title>🎮 Game Dashboard</Title>
      
      <TabContainer>
        {dashboardTabs.map(tab => (
          <TabButton
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon} {tab.label}
          </TabButton>
        ))}
      </TabContainer>

      <CardContainer>
        {getCardsForTab().map(card => (
          <ModularCard
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: getCardsForTab().indexOf(card) * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <CardHeader>
              <CardIcon>{card.icon}</CardIcon>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            {card.content}
          </ModularCard>
        ))}
      </CardContainer>
    </Container>
  );
};

export default GameDashboard;
