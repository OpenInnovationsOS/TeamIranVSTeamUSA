// Complete Weapon System with Upgrades and Crafting
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

const WeaponContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
`;

// Sidebar
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

const SidebarTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
  text-align: center;
`;

const WeaponStats = styled.div`
  margin-bottom: 25px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

const StatValue = styled.div`
  font-weight: bold;
  color: #ffffff;
`;

const UpgradeSection = styled.div`
  margin-bottom: 25px;
`;

const UpgradeButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: #ffffff;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CraftingSection = styled.div`
  margin-bottom: 25px;
`;

const CraftingButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(45deg, #0088cc, #00aaff);
  color: #ffffff;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
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
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
      'rgba(255, 255, 255, 0.1)'};
  }
`;

// Weapon Grid
const WeaponGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const WeaponCard = styled(motion.div)`
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
  
  ${props => props.equipped && `
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

const WeaponImage = styled.div`
  height: 180px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  overflow: hidden;
`;

const WeaponBadge = styled.div`
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

const WeaponInfo = styled.div`
  padding: 20px;
`;

const WeaponName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const WeaponDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
`;

const WeaponStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const WeaponStat = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
`;

const WeaponLevel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15px;
`;

const LevelBar = styled.div`
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 5px;
`;

const LevelProgress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #66ffcc);
  border-radius: 3px;
  transition: width 0.3s ease;
  width: ${props => props.percentage}%;
`;

const WeaponActions = styled.div`
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

// Upgrade Modal
const UpgradeModal = styled(motion.div)`
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

const UpgradeContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const UpgradeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const UpgradeTitle = styled.h2`
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

const UpgradeOptions = styled.div`
  display: grid;
  gap: 15px;
  margin-bottom: 25px;
`;

const UpgradeOption = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
  
  ${props => props.selected && `
    border: 2px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
  `}
`;

const UpgradeOptionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 10px;
`;

const UpgradeOptionDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
`;

const UpgradeOptionStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UpgradeCost = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffaa00;
`;

// Crafting Modal
const CraftingModal = styled(motion.div)`
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

const CraftingContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 20px;
  padding: 30px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const CraftingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const CraftingItem = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }
  
  ${props => props.selected && `
    border: 2px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
  `}
`;

const CraftingIcon = styled.div`
  font-size: 32px;
  margin-bottom: 10px;
`;

const CraftingName = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
`;

const CraftingCount = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

// Mock Data
const generateWeapons = (category) => {
  const weapons = {
    pistols: [
      {
        id: 'pistol_001',
        name: 'Golden M1911',
        description: 'Legendary pistol with enhanced accuracy and damage',
        category: 'pistols',
        rarity: 'legendary',
        level: 5,
        experience: 750,
        maxExperience: 1000,
        stats: { damage: 45, accuracy: 88, fire_rate: 65, range: 70 },
        icon: '🔫',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        equipped: true,
        upgradeSlots: 3,
        durability: 85,
        maxDurability: 100,
        materials: { gold: 50, steel: 100, crystal: 10 }
      },
      {
        id: 'pistol_002',
        name: 'Shadow Pistol',
        description: 'Rare pistol with stealth capabilities',
        category: 'pistols',
        rarity: 'rare',
        level: 3,
        experience: 450,
        maxExperience: 600,
        stats: { damage: 35, accuracy: 82, fire_rate: 70, range: 65 },
        icon: '🌑',
        gradient: 'linear-gradient(135deg, #333333, #666666)',
        equipped: false,
        upgradeSlots: 2,
        durability: 70,
        maxDurability: 100,
        materials: { steel: 80, shadow_essence: 5 }
      }
    ],
    rifles: [
      {
        id: 'rifle_001',
        name: 'Patriot M4A1',
        description: 'USA faction exclusive with bonus damage',
        category: 'rifles',
        rarity: 'rare',
        level: 4,
        experience: 600,
        maxExperience: 800,
        stats: { damage: 65, accuracy: 85, fire_rate: 78, range: 85 },
        icon: '🇺🇸',
        gradient: 'linear-gradient(135deg, #0066cc, #0088ff)',
        equipped: false,
        upgradeSlots: 2,
        durability: 75,
        maxDurability: 100,
        materials: { steel: 150, polymer: 50, usa_emblem: 1 }
      },
      {
        id: 'rifle_002',
        name: 'Mythic SCAR-H',
        description: 'Mythic rifle with extreme power and range',
        category: 'rifles',
        rarity: 'mythic',
        level: 7,
        experience: 1200,
        maxExperience: 1500,
        stats: { damage: 85, accuracy: 92, fire_rate: 65, range: 95 },
        icon: '🎯',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        equipped: false,
        upgradeSlots: 4,
        durability: 95,
        maxDurability: 100,
        materials: { mythic_core: 1, dragon_scale: 10, crystal: 25 }
      }
    ],
    sniper: [
      {
        id: 'sniper_001',
        name: 'Eagle Eye',
        description: 'Legendary sniper with extreme range and accuracy',
        category: 'sniper',
        rarity: 'legendary',
        level: 6,
        experience: 900,
        maxExperience: 1200,
        stats: { damage: 95, accuracy: 98, fire_rate: 25, range: 100 },
        icon: '🦅',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        equipped: false,
        upgradeSlots: 3,
        durability: 80,
        maxDurability: 100,
        materials: { steel: 200, crystal: 30, eagle_feather: 5 }
      }
    ]
  };
  
  return weapons[category] || [];
};

const WEAPON_CATEGORIES = [
  { id: 'all', name: 'All Weapons', icon: '⚔️', count: 45 },
  { id: 'pistols', name: 'Pistols', icon: '🔫', count: 15 },
  { id: 'rifles', name: 'Rifles', icon: '🎯', count: 20 },
  { id: 'sniper', name: 'Snipers', icon: '🔭', count: 10 }
];

const UPGRADE_OPTIONS = [
  {
    id: 'damage_boost',
    name: 'Damage Boost',
    description: 'Increase weapon damage by 10%',
    cost: 1000,
    materials: { steel: 50, crystal: 5 },
    stats: { damage: 1.1 }
  },
  {
    id: 'accuracy_boost',
    name: 'Accuracy Boost',
    description: 'Increase weapon accuracy by 8%',
    cost: 800,
    materials: { steel: 30, polymer: 20 },
    stats: { accuracy: 1.08 }
  },
  {
    id: 'fire_rate_boost',
    name: 'Fire Rate Boost',
    description: 'Increase fire rate by 12%',
    cost: 600,
    materials: { polymer: 40, spring: 10 },
    stats: { fire_rate: 1.12 }
  },
  {
    id: 'durability_repair',
    name: 'Durability Repair',
    description: 'Fully restore weapon durability',
    cost: 200,
    materials: { steel: 20, repair_kit: 1 },
    stats: { durability: 100 }
  }
];

const CRAFTING_RECIPES = [
  {
    id: 'basic_ammo',
    name: 'Basic Ammo',
    description: 'Standard ammunition',
    result: { item: 'ammo_basic', quantity: 50 },
    materials: { steel: 10, gunpowder: 5 },
    cost: 100
  },
  {
    id: 'advanced_ammo',
    name: 'Advanced Ammo',
    description: 'High-impact ammunition',
    result: { item: 'ammo_advanced', quantity: 25 },
    materials: { steel: 20, crystal: 2, gunpowder: 10 },
    cost: 300
  },
  {
    id: 'weapon_mod',
    name: 'Weapon Mod',
    description: 'Universal weapon modification',
    result: { item: 'mod_universal', quantity: 1 },
    materials: { steel: 50, crystal: 5, polymer: 20 },
    cost: 800
  }
];

// Main Component
const WeaponSystem = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  
  // State
  const [activeCategory, setActiveCategory] = useState('all');
  const [weapons, setWeapons] = useState([]);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCraftingModalOpen, setIsCraftingModalOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Load weapons
  useEffect(() => {
    loadWeapons();
  }, [activeCategory]);
  
  const loadWeapons = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let categoryWeapons = [];
      if (activeCategory === 'all') {
        Object.keys(WEAPON_CATEGORIES).forEach(catId => {
          if (catId !== 'all') {
            categoryWeapons = [...categoryWeapons, ...generateWeapons(catId)];
          }
        });
      } else {
        categoryWeapons = generateWeapons(activeCategory);
      }
      
      setWeapons(categoryWeapons);
    } catch (error) {
      console.error('Failed to load weapons:', error);
      toast.error('Failed to load weapons');
    } finally {
      setLoading(false);
    }
  };
  
  const handleWeaponClick = (weapon) => {
    setSelectedWeapon(weapon);
    hapticFeedback('impact');
  };
  
  const handleEquip = (weapon) => {
    setWeapons(weapons.map(w => ({
      ...w,
      equipped: w.id === weapon.id
    })));
    
    toast.success(`${weapon.name} equipped!`);
    hapticFeedback('impact');
  };
  
  const handleUpgrade = (weapon) => {
    setSelectedWeapon(weapon);
    setIsUpgradeModalOpen(true);
    hapticFeedback('impact');
  };
  
  const handleCraft = () => {
    setIsCraftingModalOpen(true);
    hapticFeedback('impact');
  };
  
  const executeUpgrade = () => {
    if (!selectedWeapon || !selectedUpgrade) return;
    
    const cost = selectedUpgrade.cost;
    const userBalance = user?.stg_balance || 0;
    
    if (cost > userBalance) {
      toast.error('Insufficient STG balance');
      return;
    }
    
    // Apply upgrade
    setWeapons(weapons.map(w => {
      if (w.id === selectedWeapon.id) {
        const upgradedStats = { ...w.stats };
        Object.entries(selectedUpgrade.stats).forEach(([stat, multiplier]) => {
          if (typeof multiplier === 'number') {
            upgradedStats[stat] = Math.round(upgradedStats[stat] * multiplier);
          } else {
            upgradedStats[stat] = multiplier;
          }
        });
        
        return {
          ...w,
          stats: upgradedStats,
          level: w.level + 1,
          experience: 0,
          maxExperience: (w.level + 1) * 200
        };
      }
      return w;
    }));
    
    toast.success(`${selectedWeapon.name} upgraded successfully!`);
    setIsUpgradeModalOpen(false);
    setSelectedUpgrade(null);
    hapticFeedback('notification');
  };
  
  const executeCraft = () => {
    const totalCost = CRAFTING_RECIPES.reduce((sum, recipe) => {
      return sum + (selectedMaterials[recipe.id] ? recipe.cost : 0);
    }, 0);
    
    const userBalance = user?.stg_balance || 0;
    
    if (totalCost > userBalance) {
      toast.error('Insufficient STG balance');
      return;
    }
    
    // Simulate crafting
    const craftedItems = Object.entries(selectedMaterials).filter(([_, quantity]) => quantity > 0);
    
    craftedItems.forEach(([recipeId, quantity]) => {
      const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
      if (recipe) {
        toast.success(`Crafted ${quantity}x ${recipe.result.item}!`);
      }
    });
    
    setIsCraftingModalOpen(false);
    setSelectedMaterials({});
    hapticFeedback('notification');
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
        <Title>⚔️ Weapon System</Title>
        <subtitle>Upgrade, craft, and manage your arsenal</subtitle>
      </Header>
      
      <WeaponContainer>
        {/* Sidebar */}
        <Sidebar>
          <SidebarTitle>Weapon Arsenal</SidebarTitle>
          
          {selectedWeapon && (
            <WeaponStats>
              <h4 style={{ color: '#ffffff', marginBottom: '15px' }}>
                {selectedWeapon.name}
              </h4>
              
              <StatRow>
                <span>Level:</span>
                <StatValue>{selectedWeapon.level}</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Damage:</span>
                <StatValue>{selectedWeapon.stats.damage}</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Accuracy:</span>
                <StatValue>{selectedWeapon.stats.accuracy}%</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Fire Rate:</span>
                <StatValue>{selectedWeapon.stats.fire_rate}%</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Range:</span>
                <StatValue>{selectedWeapon.stats.range}%</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Durability:</span>
                <StatValue>{selectedWeapon.durability}%</StatValue>
              </StatRow>
              
              <StatRow>
                <span>Upgrade Slots:</span>
                <StatValue>{selectedWeapon.upgradeSlots}</StatValue>
              </StatRow>
            </WeaponStats>
          )}
          
          <UpgradeSection>
            <SidebarTitle>Quick Actions</SidebarTitle>
            <UpgradeButton
              onClick={() => selectedWeapon && handleUpgrade(selectedWeapon)}
              disabled={!selectedWeapon}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Upgrade Weapon
            </UpgradeButton>
            
            <UpgradeButton
              onClick={handleCraft}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Craft Items
            </UpgradeButton>
          </UpgradeSection>
          
          <CraftingSection>
            <SidebarTitle>Materials</SidebarTitle>
            {selectedWeapon && Object.entries(selectedWeapon.materials || {}).map(([material, count]) => (
              <StatRow key={material}>
                <span>{material.replace(/_/g, ' ').charAt(0).toUpperCase() + material.replace(/_/g, ' ').slice(1)}:</span>
                <StatValue>{count}</StatValue>
              </StatRow>
            ))}
          </CraftingSection>
        </Sidebar>
        
        {/* Main Content */}
        <MainContent>
          {/* Tabs */}
          <Tabs>
            {WEAPON_CATEGORIES.map(category => (
              <Tab
                key={category.id}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.icon} {category.name}
              </Tab>
            ))}
          </Tabs>
          
          {/* Weapon Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#ffffff', fontSize: '18px' }}>
              Loading weapons...
            </div>
          ) : (
            <WeaponGrid>
              {weapons.map(weapon => {
                const levelPercentage = (weapon.experience / weapon.maxExperience) * 100;
                
                return (
                  <WeaponCard
                    key={weapon.id}
                    equipped={weapon.equipped}
                    rarity={weapon.rarity}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWeaponClick(weapon)}
                  >
                    <WeaponImage gradient={weapon.gradient}>
                      {weapon.icon}
                      <WeaponBadge color={getRarityColor(weapon.rarity)}>
                        {weapon.rarity}
                      </WeaponBadge>
                      {weapon.equipped && (
                        <WeaponBadge color="#00ff00">
                          Equipped
                        </WeaponBadge>
                      )}
                    </WeaponImage>
                    
                    <WeaponInfo>
                      <WeaponName>{weapon.name}</WeaponName>
                      <WeaponDescription>{weapon.description}</WeaponDescription>
                      
                      <WeaponStatsGrid>
                        <WeaponStat>
                          <span>DMG:</span>
                          <span>{weapon.stats.damage}</span>
                        </WeaponStat>
                        <WeaponStat>
                          <span>DEF:</span>
                          <span>{weapon.stats.defense}</span>
                        </WeaponStat>
                        <WeaponStat>
                          <span>CRIT:</span>
                          <span>{weapon.stats.critical}%</span>
                        </WeaponStat>
                        <WeaponStat>
                          <span>RNG:</span>
                          <span>{weapon.stats.range}%</span>
                        </WeaponStat>
                      </WeaponStatsGrid>
                      
                      <WeaponLevel>
                        Level {weapon.level} ({weapon.experience}/{weapon.maxExperience} XP)
                        <LevelBar>
                          <LevelProgress percentage={levelPercentage} />
                        </LevelBar>
                      </WeaponLevel>
                      
                      <WeaponActions>
                        <ActionButton
                          primary
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquip(weapon);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {weapon.equipped ? 'Unequip' : 'Equip'}
                        </ActionButton>
                        
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgrade(weapon);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Upgrade
                        </ActionButton>
                      </WeaponActions>
                    </WeaponInfo>
                  </WeaponCard>
                );
              })}
            </WeaponGrid>
          )}
        </MainContent>
      </WeaponContainer>
      
      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && selectedWeapon && (
          <UpgradeModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsUpgradeModalOpen(false)}
          >
            <UpgradeContent
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <UpgradeHeader>
                <UpgradeTitle>Upgrade {selectedWeapon.name}</UpgradeTitle>
                <CloseButton onClick={() => setIsUpgradeModalOpen(false)}>
                  ✕
                </CloseButton>
              </UpgradeHeader>
              
              <UpgradeOptions>
                {UPGRADE_OPTIONS.map(option => (
                  <UpgradeOption
                    key={option.id}
                    selected={selectedUpgrade?.id === option.id}
                    onClick={() => setSelectedUpgrade(option)}
                  >
                    <UpgradeOptionTitle>{option.name}</UpgradeOptionTitle>
                    <UpgradeOptionDescription>{option.description}</UpgradeOptionDescription>
                    <UpgradeOptionStats>
                      <div>
                        {Object.entries(option.stats).map(([stat, value]) => (
                          <div key={stat} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            {stat}: {typeof value === 'number' ? `+${Math.round((value - 1) * 100)}%` : value}
                          </div>
                        ))}
                      </div>
                      <UpgradeCost>{option.cost} STG</UpgradeCost>
                    </UpgradeOptionStats>
                  </UpgradeOption>
                ))}
              </UpgradeOptions>
              
              <ActionButton
                primary
                onClick={executeUpgrade}
                disabled={!selectedUpgrade}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedUpgrade ? `Upgrade for ${selectedUpgrade.cost} STG` : 'Select an upgrade'}
              </ActionButton>
            </UpgradeContent>
          </UpgradeModal>
        )}
      </AnimatePresence>
      
      {/* Crafting Modal */}
      <AnimatePresence>
        {isCraftingModalOpen && (
          <CraftingModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCraftingModalOpen(false)}
          >
            <CraftingContent
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <UpgradeHeader>
                <UpgradeTitle>Crafting Workshop</UpgradeTitle>
                <CloseButton onClick={() => setIsCraftingModalOpen(false)}>
                  ✕
                </CloseButton>
              </UpgradeHeader>
              
              <CraftingGrid>
                {CRAFTING_RECIPES.map(recipe => (
                  <CraftingItem
                    key={recipe.id}
                    selected={selectedMaterials[recipe.id] > 0}
                    onClick={() => {
                      setSelectedMaterials(prev => ({
                        ...prev,
                        [recipe.id]: (prev[recipe.id] || 0) + 1
                      }));
                    }}
                  >
                    <CraftingIcon>🔧</CraftingIcon>
                    <CraftingName>{recipe.name}</CraftingName>
                    <CraftingDescription>{recipe.description}</CraftingDescription>
                    <CraftingCount>Cost: {recipe.cost} STG</CraftingCount>
                    <CraftingCount>Quantity: {selectedMaterials[recipe.id] || 0}</CraftingCount>
                  </CraftingItem>
                ))}
              </CraftingGrid>
              
              <ActionButton
                primary
                onClick={executeCraft}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Craft Items
              </ActionButton>
            </CraftingContent>
          </CraftingModal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default WeaponSystem;
