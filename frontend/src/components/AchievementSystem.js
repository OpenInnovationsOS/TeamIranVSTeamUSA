// Complete Achievement System with Notifications
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { API_CONFIG } from '../config/api';

// Styled Components
const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  font-family: 'Segoe UI', system-ui, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #0088cc, #ffaa00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
`;

const AchievementContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Stats Overview
const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
`;

const ProgressBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 10px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  border-radius: 4px;
  transition: width 0.5s ease;
  width: ${props => props.percentage}%;
`;

// Category Tabs
const CategoryTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
  overflow-x: auto;
`;

const CategoryTab = styled(motion.button)`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
    'transparent'};
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px 8px 0 0;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
      'rgba(255, 255, 255, 0.1)'};
  }
`;

const TabBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff3333;
  color: #ffffff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
`;

// Search and Filter
const Controls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 16px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FilterButton = styled(motion.button)`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #0088cc, #00aaff)' : 
    'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(45deg, #0088cc, #00aaff)' : 
      'rgba(255, 255, 255, 0.15)'};
  }
`;

const SortDropdown = styled.select`
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

// Achievement Grid
const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const AchievementCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  ${props => props.completed && `
    border-color: #00ff00;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  `}
  
  ${props => props.rarity === 'legendary' && `
    border-color: #ffaa00;
    box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
  `}
  
  ${props => props.rarity === 'mythic' && `
    border-color: #ff00ff;
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
  `}
`;

const AchievementHeader = styled.div`
  height: 120px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  overflow: hidden;
`;

const AchievementBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => props.color || '#ff6b6b'};
  color: #ffffff;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
`;

const CompletionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 255, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #00ff00;
  font-weight: bold;
`;

const AchievementInfo = styled.div`
  padding: 20px;
`;

const AchievementName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const AchievementDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
`;

const AchievementProgress = styled.div`
  margin-bottom: 15px;
`;

const ProgressLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
`;

const ProgressBarLarge = styled.div`
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressFillLarge = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  border-radius: 5px;
  transition: width 0.5s ease;
  width: ${props => props.percentage}%;
`;

const AchievementReward = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const Reward = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffaa00;
`;

const AchievementActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled(motion.button)`
  flex: 1;
  background: ${props => props.primary ? 
    'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
    'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Achievement Detail Modal
const AchievementModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
`;

const ModalBody = styled.div`
  color: #ffffff;
`;

const ModalStats = styled.div`
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

// Achievement Notification Toast
const NotificationToast = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 10px;
  border: 2px solid #00ff00;
  box-shadow: 0 10px 30px rgba(0, 255, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 300px;
`;

const NotificationIcon = styled.div`
  font-size: 32px;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 5px;
`;

const NotificationMessage = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

// Achievement Categories
const ACHIEVEMENT_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🏆', count: 156 },
  { id: 'combat', name: 'Combat', icon: '⚔️', count: 45 },
  { id: 'collection', name: 'Collection', icon: '💎', count: 34 },
  { id: 'social', name: 'Social', icon: '👥', count: 23 },
  { id: 'tournament', name: 'Tournament', icon: '🎯', count: 28 },
  { id: 'special', name: 'Special', icon: '🌟', count: 26 }
];

// Mock Achievement Data
const generateAchievements = (category) => {
  const achievements = {
    combat: [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Win your first battle',
        category: 'combat',
        rarity: 'common',
        reward: 100,
        experience: 50,
        progress: { current: 1, target: 1 },
        completed: true,
        completedAt: '2026-03-01T10:30:00Z',
        icon: '⚔️',
        gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
        stats: { battles_won: 1, total_damage: 1250 }
      },
      {
        id: 'battle_master',
        name: 'Battle Master',
        description: 'Win 100 battles',
        category: 'combat',
        rarity: 'legendary',
        reward: 5000,
        experience: 1000,
        progress: { current: 67, target: 100 },
        completed: false,
        icon: '👑',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        stats: { battles_won: 67, win_rate: 78.5 }
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Achieve 90% accuracy in 10 battles',
        category: 'combat',
        rarity: 'epic',
        reward: 2000,
        experience: 500,
        progress: { current: 7, target: 10 },
        completed: false,
        icon: '🎯',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        stats: { accuracy: 92.3, battles: 7 }
      }
    ],
    collection: [
      {
        id: 'weapon_collector',
        name: 'Weapon Collector',
        description: 'Collect 50 different weapons',
        category: 'collection',
        rarity: 'rare',
        reward: 1500,
        experience: 300,
        progress: { current: 23, target: 50 },
        completed: false,
        icon: '🔫',
        gradient: 'linear-gradient(135deg, #0088cc, #00aaff)',
        stats: { weapons_collected: 23, legendary_weapons: 3 }
      },
      {
        id: 'skin_hunter',
        name: 'Skin Hunter',
        description: 'Collect all character skins',
        category: 'collection',
        rarity: 'mythic',
        reward: 10000,
        experience: 2000,
        progress: { current: 45, target: 75 },
        completed: false,
        icon: '👤',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        stats: { skins_collected: 45, epic_skins: 12 }
      }
    ],
    social: [
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Share achievements 50 times',
        category: 'social',
        rarity: 'uncommon',
        reward: 500,
        experience: 150,
        progress: { current: 12, target: 50 },
        completed: false,
        icon: '🦋',
        gradient: 'linear-gradient(135deg, #00ff88, #66ffcc)',
        stats: { shares: 12, likes_received: 234 }
      },
      {
        id: 'team_player',
        name: 'Team Player',
        description: 'Participate in 20 team battles',
        category: 'social',
        rarity: 'rare',
        reward: 1200,
        experience: 400,
        progress: { current: 20, target: 20 },
        completed: true,
        completedAt: '2026-03-05T14:20:00Z',
        icon: '🤝',
        gradient: 'linear-gradient(135deg, #0088cc, #00aaff)',
        stats: { team_battles: 20, team_wins: 15 }
      }
    ],
    tournament: [
      {
        id: 'tournament_champion',
        name: 'Tournament Champion',
        description: 'Win a tournament',
        category: 'tournament',
        rarity: 'legendary',
        reward: 7500,
        experience: 1500,
        progress: { current: 0, target: 1 },
        completed: false,
        icon: '🏆',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        stats: { tournaments_played: 3, best_rank: 2 }
      }
    ],
    special: [
      {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Join the game in the first month',
        category: 'special',
        rarity: 'mythic',
        reward: 3000,
        experience: 600,
        progress: { current: 1, target: 1 },
        completed: true,
        completedAt: '2026-02-15T08:00:00Z',
        icon: '⭐',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        stats: { join_date: '2026-02-15', days_active: 21 }
      }
    ]
  };
  
  return achievements[category] || [];
};

// Main Component
const AchievementSystem = () => {
  const { user } = useAuthStore();
  const { hapticFeedback, shareScore } = useTelegram();
  
  // State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [achievements, setAchievements] = useState([]);
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Stats
  const [achievementStats, setAchievementStats] = useState({
    totalAchievements: 0,
    completedAchievements: 0,
    completionPercentage: 0,
    totalRewards: 0,
    legendaryCompleted: 0,
    mythicCompleted: 0
  });
  
  // Load achievements
  useEffect(() => {
    loadAchievements();
  }, [activeCategory]);
  
  // Filter and sort
  useEffect(() => {
    filterAndSortAchievements();
  }, [achievements, searchQuery, activeFilter, sortBy]);
  
  const loadAchievements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/achievements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        }
      });
      
      const data = await response.json();
      const categoryAchievements = generateAchievements(activeCategory);
      
      setAchievements(categoryAchievements);
      updateStats(categoryAchievements);
      
      // Simulate new achievement notification
      if (Math.random() > 0.7) {
        const newAchievement = categoryAchievements.find(a => !a.completed);
        if (newAchievement) {
          showAchievementNotification(newAchievement);
        }
      }
      
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };
  
  const updateStats = (achievementsList) => {
    const completed = achievementsList.filter(a => a.completed);
    const totalRewards = completed.reduce((sum, a) => sum + a.reward, 0);
    
    const stats = {
      totalAchievements: achievementsList.length,
      completedAchievements: completed.length,
      completionPercentage: Math.round((completed.length / achievementsList.length) * 100),
      totalRewards,
      legendaryCompleted: completed.filter(a => a.rarity === 'legendary').length,
      mythicCompleted: completed.filter(a => a.rarity === 'mythic').length
    };
    
    setAchievementStats(stats);
  };
  
  const filterAndSortAchievements = () => {
    let filtered = [...achievements];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(achievement =>
        achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (activeFilter === 'completed') {
      filtered = filtered.filter(achievement => achievement.completed);
    } else if (activeFilter === 'incomplete') {
      filtered = filtered.filter(achievement => !achievement.completed);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'progress':
          const aProgress = ((a.progress?.current || 0) / (a.progress?.target || 1)) * 100;
          const bProgress = ((b.progress?.current || 0) / (b.progress?.target || 1)) * 100;
          return bProgress - aProgress;
        case 'reward':
          return (b.reward || 0) - (a.reward || 0);
        case 'completed':
          return b.completed - a.completed;
        default:
          return 0;
      }
    });
    
    setFilteredAchievements(filtered);
  };
  
  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
    setIsModalOpen(true);
    hapticFeedback('impact');
  };
  
  const handleShare = (achievement) => {
    const shareText = `🏆 Just unlocked: ${achievement.name}!\n${achievement.description}\n\nPlay Team Iran vs USA!`;
    
    // Use the enhanced share functionality
    if (window.Telegram?.WebApp?.openTelegramLink) {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
      window.Telegram.WebApp.openTelegramLink(telegramUrl);
    } else if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: shareText,
        url: window.location.href
      }).catch(err => console.log('Web Share API failed:', err));
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`).then(() => {
        toast.success('Achievement copied to clipboard!');
      }).catch(err => console.error('Failed to copy:', err));
    }
    
    hapticFeedback('notification');
    toast.success('Achievement shared!');
  };
  
  const showAchievementNotification = (achievement) => {
    const notification = {
      id: Date.now(),
      achievement,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev]);
    toast.success(`🏆 Achievement Progress: ${achievement.name}`);
    hapticFeedback('notification');
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };
  
  const getRarityColor = (rarity) => {
    const colors = {
      common: '#888888',
      uncommon: '#00ff00',
      rare: '#0088ff',
      epic: '#ff00ff',
      legendary: '#ffaa00',
      mythic: '#ff00ff'
    };
    return colors[rarity] || '#888888';
  };
  
  return (
    <Container>
      <Header>
        <Title>🏆 Achievement System</Title>
        <Subtitle>Track your progress and unlock rewards</Subtitle>
      </Header>
      
      <AchievementContainer>
        {/* Stats Overview */}
        <StatsOverview>
          <StatCard whileHover={{ scale: 1.05 }}>
            <StatValue>{achievementStats.completedAchievements}</StatValue>
            <StatLabel>Completed</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={achievementStats.completionPercentage} />
            </ProgressBar>
          </StatCard>
          
          <StatCard whileHover={{ scale: 1.05 }}>
            <StatValue>{achievementStats.completionPercentage}%</StatValue>
            <StatLabel>Completion Rate</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={achievementStats.completionPercentage} />
            </ProgressBar>
          </StatCard>
          
          <StatCard whileHover={{ scale: 1.05 }}>
            <StatValue>{achievementStats.totalRewards.toLocaleString()}</StatValue>
            <StatLabel>Total Rewards (STG)</StatLabel>
          </StatCard>
          
          <StatCard whileHover={{ scale: 1.05 }}>
            <StatValue>{achievementStats.legendaryCompleted}</StatValue>
            <StatLabel>Legendary Completed</StatLabel>
          </StatCard>
          
          <StatCard whileHover={{ scale: 1.05 }}>
            <StatValue>{achievementStats.mythicCompleted}</StatValue>
            <StatLabel>Mythic Completed</StatLabel>
          </StatCard>
        </StatsOverview>
        
        {/* Category Tabs */}
        <CategoryTabs>
          {ACHIEVEMENT_CATEGORIES.map(category => (
            <CategoryTab
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon} {category.name}
              {category.count > 0 && (
                <TabBadge>{category.count}</TabBadge>
              )}
            </CategoryTab>
          ))}
        </CategoryTabs>
        
        {/* Search and Filter */}
        <Controls>
          <SearchInput
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <FilterButton
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </FilterButton>
          
          <FilterButton
            active={activeFilter === 'completed'}
            onClick={() => setActiveFilter('completed')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Completed
          </FilterButton>
          
          <FilterButton
            active={activeFilter === 'incomplete'}
            onClick={() => setActiveFilter('incomplete')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            In Progress
          </FilterButton>
          
          <SortDropdown
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="rarity">Sort by Rarity</option>
            <option value="progress">Sort by Progress</option>
            <option value="reward">Sort by Reward</option>
            <option value="completed">Sort by Status</option>
          </SortDropdown>
        </Controls>
        
        {/* Achievement Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#ffffff', fontSize: '18px' }}>
            Loading achievements...
          </div>
        ) : (
          <AchievementGrid>
            {filteredAchievements.map(achievement => {
              const progressPercentage = ((achievement.progress?.current || 0) / (achievement.progress?.target || 1)) * 100;
              
              return (
                <AchievementCard
                  key={achievement.id}
                  completed={achievement.completed}
                  rarity={achievement.rarity}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAchievementClick(achievement)}
                >
                  <AchievementHeader gradient={achievement.gradient}>
                    {achievement.icon}
                    <AchievementBadge color={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </AchievementBadge>
                    {achievement.completed && (
                      <CompletionOverlay>
                        ✓ COMPLETED
                      </CompletionOverlay>
                    )}
                  </AchievementHeader>
                  
                  <AchievementInfo>
                    <AchievementName>{achievement.name || 'Unknown Achievement'}</AchievementName>
                    <AchievementDescription>{achievement.description || 'No description available'}</AchievementDescription>
                    
                    <AchievementProgress>
                      <ProgressLabel>
                        <span>Progress</span>
                        <span>{achievement.progress?.current || 0} / {achievement.progress?.target || 1}</span>
                      </ProgressLabel>
                      <ProgressBarLarge>
                        <ProgressFillLarge percentage={progressPercentage} />
                      </ProgressBarLarge>
                    </AchievementProgress>
                    
                    <AchievementReward>
                      <Reward>Reward: {(achievement.reward || 0).toLocaleString()} STG</Reward>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                        +{(achievement.experience || 0)} XP
                      </span>
                    </AchievementReward>
                    
                    <AchievementActions>
                      <ActionButton
                        primary
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(achievement);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Share
                      </ActionButton>
                      
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          showAchievementNotification(achievement);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Track
                      </ActionButton>
                    </AchievementActions>
                  </AchievementInfo>
                </AchievementCard>
              );
            })}
          </AchievementGrid>
        )}
      </AchievementContainer>
      
      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAchievement && (
          <AchievementModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <ModalContent
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>{selectedAchievement.name}</ModalTitle>
                <CloseButton onClick={() => setIsModalOpen(false)}>
                  ✕
                </CloseButton>
              </ModalHeader>
              
              <ModalBody>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: getRarityColor(selectedAchievement.rarity), marginBottom: '10px' }}>
                    {selectedAchievement.rarity.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '15px' }}>
                    {selectedAchievement.description}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Progress: </span>
                      <span style={{ fontWeight: 'bold' }}>
                        {(selectedAchievement?.progress?.current || 0)} / {(selectedAchievement?.progress?.target || 1)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Reward: </span>
                      <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                        {(selectedAchievement.reward || 0).toLocaleString()} STG
                      </span>
                    </div>
                  </div>
                </div>
                
                <ModalStats>
                  <h3 style={{ marginBottom: '15px' }}>Statistics</h3>
                  {Object.entries(selectedAchievement?.stats || {}).map(([key, value]) => (
                    <StatRow key={key}>
                      <span>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:</span>
                      <span>{value}</span>
                    </StatRow>
                  ))}
                </ModalStats>
                
                {selectedAchievement.completed && (
                  <div style={{ 
                    padding: '15px', 
                    background: 'rgba(0, 255, 0, 0.1)', 
                    borderRadius: '10px', 
                    marginTop: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '18px' }}>
                      ✓ COMPLETED
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '5px' }}>
                      Completed on {new Date(selectedAchievement.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                  <ActionButton
                    primary
                    onClick={() => handleShare(selectedAchievement)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Share Achievement
                  </ActionButton>
                  
                  <ActionButton
                    onClick={() => showAchievementNotification(selectedAchievement)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Track Progress
                  </ActionButton>
                </div>
              </ModalBody>
            </ModalContent>
          </AchievementModal>
        )}
      </AnimatePresence>
      
      {/* Achievement Notifications */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 3000,
        maxWidth: '400px'
      }}>
        <AnimatePresence>
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              <NotificationIcon>
                {notification.achievement.icon}
              </NotificationIcon>
              <NotificationContent>
                <NotificationTitle>
                  Achievement Progress!
                </NotificationTitle>
                <NotificationMessage>
                  {notification.achievement?.name}: {notification.achievement?.progress?.current || 0}/{notification.achievement?.progress?.target || 0}
                </NotificationMessage>
              </NotificationContent>
            </NotificationToast>
          ))}
        </AnimatePresence>
      </div>
    </Container>
  );
};

export default AchievementSystem;
