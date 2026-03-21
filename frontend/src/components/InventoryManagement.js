// Complete Inventory Management System
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

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

const InventoryContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
`;

// Sidebar Stats
const Sidebar = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
`;

const StatsTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
  text-align: center;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.percentage}%;
`;

// Main Content
const MainContent = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// Tabs
const Tabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
`;

const Tab = styled(motion.button)`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
    'transparent'};
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px 8px 0 0;
  font-weight: bold;
  cursor: pointer;
  position: relative;
  
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

// Inventory Grid
const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InventoryItem = styled(motion.div)`
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
  
  ${props => props.rarity === 'legendary' && `
    border-color: #ffaa00;
    box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
  `}
  
  ${props => props.rarity === 'mythic' && `
    border-color: #ff00ff;
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
  `}
`;

const ItemImage = styled.div`
  height: 120px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  position: relative;
`;

const ItemBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${props => props.color || '#ff6b6b'};
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

const ItemInfo = styled.div`
  padding: 15px;
`;

const ItemName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemStats = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled(motion.button)`
  flex: 1;
  background: ${props => props.primary ? 
    'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
    'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 12px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Item Detail Modal
const ItemModal = styled(motion.div)`
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
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 25px;
  margin-bottom: 25px;
`;

const ModalImage = styled.div`
  height: 150px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
`;

const ModalInfo = styled.div`
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

const ModalActions = styled.div`
  display: flex;
  gap: 15px;
`;

// Collection Progress
const CollectionProgress = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
`;

const ProgressTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 15px;
`;

const CollectionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const CollectionCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 15px;
`;

const CollectionName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const CollectionProgress = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
`;

// Mock Data
const generateInventoryItems = (category) => {
  const items = {
    weapons: [
      {
        id: 'weapon_001',
        name: 'Golden M4A1',
        description: 'Legendary assault rifle with enhanced damage',
        category: 'weapons',
        rarity: 'legendary',
        quantity: 1,
        durability: 85,
        stats: { damage: 85, accuracy: 92, fire_rate: 78 },
        icon: '🔫',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        equipped: true,
        level: 5,
        upgradeSlots: 3
      },
      {
        id: 'weapon_002',
        name: 'Diamond SCAR-H',
        description: 'Mythic sniper rifle with extreme range',
        category: 'weapons',
        rarity: 'mythic',
        quantity: 1,
        durability: 92,
        stats: { damage: 95, accuracy: 98, fire_rate: 45 },
        icon: '🎯',
        gradient: 'linear-gradient(135deg, #00ffff, #66ffff)',
        equipped: false,
        level: 8,
        upgradeSlots: 5
      },
      {
        id: 'weapon_003',
        name: 'Patriot M4',
        description: 'USA faction exclusive rifle',
        category: 'weapons',
        rarity: 'rare',
        quantity: 2,
        durability: 70,
        stats: { damage: 75, accuracy: 85, fire_rate: 80 },
        icon: '🇺🇸',
        gradient: 'linear-gradient(135deg, #0066cc, #0088ff)',
        equipped: false,
        level: 3,
        upgradeSlots: 2
      }
    ],
    skins: [
      {
        id: 'skin_001',
        name: 'Iranian Elite Guard',
        description: 'Elite guard skin with golden trim',
        category: 'skins',
        rarity: 'elite',
        quantity: 1,
        stats: { health: 10, speed: 5 },
        icon: '🛡️',
        gradient: 'linear-gradient(135deg, #00aa00, #66ff66)',
        equipped: true,
        level: 4,
        specialEffects: ['golden_trim', 'glowing_eyes']
      },
      {
        id: 'skin_002',
        name: 'Phoenix Warrior',
        description: 'Mythic skin with fire effects',
        category: 'skins',
        rarity: 'mythic',
        quantity: 1,
        stats: { health: 30, speed: 15, damage: 10 },
        icon: '🔥',
        gradient: 'linear-gradient(135deg, #ff6600, #ffaa00)',
        equipped: false,
        level: 10,
        specialEffects: ['fire_aura', 'phoenix_wings']
      }
    ],
    collectibles: [
      {
        id: 'collectible_001',
        name: 'Victory Medal',
        description: 'Commemorative medal for victories',
        category: 'collectibles',
        rarity: 'rare',
        quantity: 5,
        stats: { prestige: 50 },
        icon: '🏆',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        equipped: false,
        level: 1,
        collectionSet: 'medals'
      },
      {
        id: 'collectible_002',
        name: 'Dragon Statue',
        description: 'Legendary dragon statue',
        category: 'collectibles',
        rarity: 'legendary',
        quantity: 1,
        stats: { luck: 25, prestige: 100 },
        icon: '🐉',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        equipped: false,
        level: 7,
        collectionSet: 'statues'
      }
    ],
    boosts: [
      {
        id: 'boost_001',
        name: 'Double XP Boost',
        description: 'Double experience for 24 hours',
        category: 'boosts',
        rarity: 'common',
        quantity: 10,
        stats: { duration: '24h', multiplier: 2 },
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #00ff88, #66ffcc)',
        equipped: false,
        level: 1,
        consumable: true
      },
      {
        id: 'boost_002',
        name: 'STG Booster',
        description: '50% bonus STG earnings',
        category: 'boosts',
        rarity: 'uncommon',
        quantity: 5,
        stats: { duration: '12h', multiplier: 1.5 },
        icon: '💰',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        equipped: false,
        level: 2,
        consumable: true
      }
    ]
  };
  
  return items[category] || [];
};

const INVENTORY_TABS = [
  { id: 'weapons', name: 'Weapons', icon: '⚔️', count: 12 },
  { id: 'skins', name: 'Skins', icon: '👤', count: 8 },
  { id: 'collectibles', name: 'Collectibles', icon: '💎', count: 34 },
  { id: 'boosts', name: 'Boosts', icon: '⚡', count: 15 },
  { id: 'materials', name: 'Materials', icon: '🔧', count: 67 }
];

// Main Component
const InventoryManagement = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  
  // State
  const [activeTab, setActiveTab] = useState('weapons');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalValue: 0,
    rareItems: 0,
    legendaryItems: 0,
    mythicItems: 0,
    equippedItems: 0
  });
  
  // Load inventory
  useEffect(() => {
    loadInventory();
  }, [activeTab]);
  
  // Filter and sort
  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchQuery, activeFilter, sortBy]);
  
  const loadInventory = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const items = generateInventoryItems(activeTab);
      setInventory(items);
      updateStats(items);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };
  
  const updateStats = (items) => {
    const stats = {
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => {
        const baseValue = item.rarity === 'legendary' ? 5000 : 
                         item.rarity === 'mythic' ? 10000 : 
                         item.rarity === 'rare' ? 2500 : 
                         item.rarity === 'elite' ? 3000 : 1000;
        return sum + (baseValue * item.quantity);
      }, 0),
      rareItems: items.filter(item => item.rarity === 'rare').length,
      legendaryItems: items.filter(item => item.rarity === 'legendary').length,
      mythicItems: items.filter(item => item.rarity === 'mythic').length,
      equippedItems: items.filter(item => item.equipped).length
    };
    setInventoryStats(stats);
  };
  
  const filterAndSortInventory = () => {
    let filtered = [...inventory];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (activeFilter === 'equipped') {
      filtered = filtered.filter(item => item.equipped);
    } else if (activeFilter === 'unequipped') {
      filtered = filtered.filter(item => !item.equipped);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, elite: 4, epic: 5, legendary: 6, mythic: 7 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'level':
          return (b.level || 0) - (a.level || 0);
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });
    
    setFilteredInventory(filtered);
  };
  
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    hapticFeedback('impact');
  };
  
  const handleEquip = (item) => {
    // Toggle equip status
    setInventory(inventory.map(invItem =>
      invItem.id === item.id ? { ...invItem, equipped: !invItem.equipped } : invItem
    ));
    
    toast.success(`${item.name} ${item.equipped ? 'unequipped' : 'equipped'}`);
    hapticFeedback('impact');
  };
  
  const handleUpgrade = (item) => {
    toast.success(`Upgrading ${item.name}...`);
    hapticFeedback('impact');
  };
  
  const handleUse = (item) => {
    if (item.consumable && item.quantity > 1) {
      setInventory(inventory.map(invItem =>
        invItem.id === item.id ? { ...invItem, quantity: invItem.quantity - 1 } : invItem
      ));
      toast.success(`Used ${item.name}`);
      hapticFeedback('notification');
    } else {
      toast.success(`${item.name} activated`);
    }
  };
  
  const handleSell = (item) => {
    const value = item.rarity === 'legendary' ? 2500 : 
                  item.rarity === 'mythic' ? 5000 : 
                  item.rarity === 'rare' ? 1250 : 
                  item.rarity === 'elite' ? 1500 : 500;
    
    toast.success(`Sold ${item.name} for ${value} STG`);
    hapticFeedback('impact');
    
    // Remove from inventory
    setInventory(inventory.filter(invItem => invItem.id !== item.id));
    setIsModalOpen(false);
  };
  
  const getRarityColor = (rarity) => {
    const colors = {
      common: '#888888',
      uncommon: '#00ff00',
      rare: '#0088ff',
      elite: '#ff6600',
      epic: '#ff00ff',
      legendary: '#ffaa00',
      mythic: '#ff00ff'
    };
    return colors[rarity] || '#888888';
  };
  
  const getCollectionProgress = () => {
    return [
      { name: 'Weapon Collection', progress: 45, total: 100, color: '#ff6b6b' },
      { name: 'Skin Collection', progress: 67, total: 75, color: '#0088cc' },
      { name: 'Medal Collection', progress: 23, total: 50, color: '#ffaa00' },
      { name: 'Statue Collection', progress: 8, total: 25, color: '#00ff88' }
    ];
  };
  
  return (
    <Container>
      <Header>
        <Title>📦 Inventory Management</Title>
        <Subtitle>Manage your weapons, skins, and collectibles</Subtitle>
      </Header>
      
      <InventoryContainer>
        {/* Sidebar Stats */}
        <Sidebar>
          <StatsTitle>Inventory Stats</StatsTitle>
          
          <StatCard>
            <StatLabel>Total Items</StatLabel>
            <StatValue>{inventoryStats.totalItems}</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Total Value</StatLabel>
            <StatValue>{inventoryStats.totalValue.toLocaleString()} STG</StatValue>
          </StatCard>
          
          <StatCard>
            <StatLabel>Rare Items</StatLabel>
            <StatValue>{inventoryStats.rareItems}</StatValue>
            <ProgressBar>
              <ProgressFill percentage={(inventoryStats.rareItems / 10) * 100} />
            </ProgressBar>
          </StatCard>
          
          <StatCard>
            <StatLabel>Legendary Items</StatLabel>
            <StatValue>{inventoryStats.legendaryItems}</StatValue>
            <ProgressBar>
              <ProgressFill percentage={(inventoryStats.legendaryItems / 5) * 100} />
            </ProgressBar>
          </StatCard>
          
          <StatCard>
            <StatLabel>Mythic Items</StatLabel>
            <StatValue>{inventoryStats.mythicItems}</StatValue>
            <ProgressBar>
              <ProgressFill percentage={(inventoryStats.mythicItems / 3) * 100} />
            </ProgressBar>
          </StatCard>
          
          <StatCard>
            <StatLabel>Equipped Items</StatLabel>
            <StatValue>{inventoryStats.equippedItems}</StatValue>
            <ProgressBar>
              <ProgressFill percentage={(inventoryStats.equippedItems / 10) * 100} />
            </ProgressBar>
          </StatCard>
        </Sidebar>
        
        {/* Main Content */}
        <MainContent>
          {/* Tabs */}
          <Tabs>
            {INVENTORY_TABS.map(tab => (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon} {tab.name}
                {tab.count > 0 && (
                  <TabBadge>{tab.count}</TabBadge>
                )}
              </Tab>
            ))}
          </Tabs>
          
          {/* Search and Filter */}
          <Controls>
            <SearchInput
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <FilterButton
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All Items
            </FilterButton>
            
            <FilterButton
              active={activeFilter === 'equipped'}
              onClick={() => setActiveFilter('equipped')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Equipped
            </FilterButton>
            
            <FilterButton
              active={activeFilter === 'unequipped'}
              onClick={() => setActiveFilter('unequipped')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Unequipped
            </FilterButton>
            
            <SortDropdown
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="level">Sort by Level</option>
              <option value="quantity">Sort by Quantity</option>
            </SortDropdown>
          </Controls>
          
          {/* Inventory Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#ffffff', fontSize: '18px' }}>
              Loading inventory...
            </div>
          ) : (
            <InventoryGrid>
              {filteredInventory.map(item => (
                <InventoryItem
                  key={item.id}
                  rarity={item.rarity}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                >
                  <ItemImage gradient={item.gradient}>
                    {item.icon}
                    <ItemBadge color={getRarityColor(item.rarity)}>
                      {item.rarity}
                    </ItemBadge>
                    {item.equipped && (
                      <ItemBadge color="#00ff00">
                        Equipped
                      </ItemBadge>
                    )}
                    {item.quantity > 1 && (
                      <ItemBadge color="#ffffff">
                        {item.quantity}
                      </ItemBadge>
                    )}
                  </ItemImage>
                  
                  <ItemInfo>
                    <ItemName>{item.name}</ItemName>
                    <ItemStats>
                      Level {item.level || 1}
                      {item.durability && ` • ${item.durability}%`}
                    </ItemStats>
                    
                    <ItemActions>
                      <ActionButton
                        primary
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquip(item);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.equipped ? 'Unequip' : 'Equip'}
                      </ActionButton>
                      
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUse(item);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Use
                      </ActionButton>
                    </ItemActions>
                  </ItemInfo>
                </InventoryItem>
              ))}
            </InventoryGrid>
          )}
          
          {/* Collection Progress */}
          <CollectionProgress>
            <ProgressTitle>Collection Progress</ProgressTitle>
            <CollectionsList>
              {getCollectionProgress().map((collection, index) => (
                <CollectionCard key={index}>
                  <CollectionName>{collection.name}</CollectionName>
                  <CollectionProgress>
                    {collection.progress} / {collection.total} items
                  </CollectionProgress>
                  <ProgressBar>
                    <ProgressFill 
                      percentage={(collection.progress / collection.total) * 100}
                      style={{ background: collection.color }}
                    />
                  </ProgressBar>
                </CollectionCard>
              ))}
            </CollectionsList>
          </CollectionProgress>
        </MainContent>
      </InventoryContainer>
      
      {/* Item Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <ItemModal
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
                <ModalTitle>{selectedItem.name}</ModalTitle>
                <CloseButton onClick={() => setIsModalOpen(false)}>
                  ✕
                </CloseButton>
              </ModalHeader>
              
              <ModalBody>
                <ModalImage gradient={selectedItem.gradient}>
                  {selectedItem.icon}
                </ModalImage>
                
                <ModalInfo>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: getRarityColor(selectedItem.rarity) }}>
                      {selectedItem.rarity.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '16px', margin: '10px 0' }}>
                      {selectedItem.description}
                    </div>
                  </div>
                  
                  <ModalStats>
                    <StatRow>
                      <span>Level:</span>
                      <span>{selectedItem.level || 1}</span>
                    </StatRow>
                    <StatRow>
                      <span>Quantity:</span>
                      <span>{selectedItem.quantity}</span>
                    </StatRow>
                    {selectedItem.durability && (
                      <StatRow>
                        <span>Durability:</span>
                        <span>{selectedItem.durability}%</span>
                      </StatRow>
                    )}
                    {selectedItem.upgradeSlots && (
                      <StatRow>
                        <span>Upgrade Slots:</span>
                        <span>{selectedItem.upgradeSlots}</span>
                      </StatRow>
                    )}
                    {Object.entries(selectedItem.stats).map(([key, value]) => (
                      <StatRow key={key}>
                        <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                        <span>{value}</span>
                      </StatRow>
                    ))}
                  </ModalStats>
                </ModalInfo>
              </ModalBody>
              
              <ModalActions>
                <ActionButton
                  primary
                  onClick={() => handleEquip(selectedItem)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {selectedItem.equipped ? 'Unequip' : 'Equip'}
                </ActionButton>
                
                <ActionButton
                  onClick={() => handleUpgrade(selectedItem)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upgrade
                </ActionButton>
                
                <ActionButton
                  onClick={() => handleSell(selectedItem)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sell
                </ActionButton>
              </ModalActions>
            </ModalContent>
          </ItemModal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default InventoryManagement;
