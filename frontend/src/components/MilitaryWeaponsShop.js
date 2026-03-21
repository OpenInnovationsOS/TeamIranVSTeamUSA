// Enhanced Military Weapons Shop System
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { API_CONFIG } from '../config/api';

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

const WeaponGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const WeaponCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 136, 204, 0.3);
  }
`;

const WeaponHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const WeaponIcon = styled.div`
  font-size: 32px;
  margin-right: 12px;
`;

const WeaponInfo = styled.div`
  flex: 1;
`;

const WeaponName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const WeaponCategory = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const WeaponStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const Stat = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 8px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
`;

const WeaponDescription = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  line-height: 1.4;
`;

const WeaponFooter = styled.div`
  margin-top: 16px;
`;

const WeaponPrice = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #00a6ff;
  margin-bottom: 4px;
`;

const PurchaseButton = styled.button`
  width: 100%;
  padding: 12px;
  background: rgba(0, 136, 204, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 136, 204, 0.3);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 8px;
`;

const FilterTab = styled(motion.button)`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }
`;

const MilitaryWeaponsShop = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasing, setPurchasing] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Enhanced Military Weapons Catalog
  const militaryWeapons = [
    // GROUND VEHICLES - TANKS
    {
      id: 'tank_abrams',
      name: 'M1A2 Abrams Tank',
      category: 'tanks',
      faction: 'usa',
      rarity: 'legendary',
      price: 15000,
      icon: '🚜',
      description: 'Main battle tank with advanced armor and 120mm smoothbore cannon',
      stats: {
        damage: 95,
        defense: 98,
        speed: 45,
        range: 85,
        accuracy: 88
      },
      specialAbility: 'Armor Piercing Rounds',
      unlockLevel: 10
    },
    {
      id: 'tank_t90',
      name: 'T-90M Tank',
      category: 'tanks',
      faction: 'iran',
      rarity: 'legendary',
      price: 14500,
      icon: '🛡️',
      description: 'Advanced Russian-designed tank with reactive armor and guided missiles',
      stats: {
        damage: 92,
        defense: 95,
        speed: 48,
        range: 82,
        accuracy: 85
      },
      specialAbility: 'Reactive Armor',
      unlockLevel: 10
    },
    {
      id: 'tank_merkava',
      name: 'Merkava Tank',
      category: 'tanks',
      faction: 'iran',
      rarity: 'legendary',
      price: 16000,
      icon: '🚜',
      description: 'Israeli main battle tank with advanced armor and Trophy system',
      stats: {
        damage: 90,
        defense: 92,
        speed: 42,
        range: 80,
        accuracy: 82
      },
      specialAbility: 'Trophy System',
      unlockLevel: 12
    },

    // MISSILE SYSTEMS
    {
      id: 'missile_patriot',
      name: 'Patriot Missile System',
      category: 'missiles',
      faction: 'usa',
      rarity: 'epic',
      price: 12000,
      icon: '🚀',
      description: 'Advanced surface-to-air missile system with multi-target capability',
      stats: {
        damage: 85,
        defense: 70,
        speed: 85,
        range: 90,
        accuracy: 90
      },
      specialAbility: 'Anti-Missile Defense',
      unlockLevel: 8
    },
    {
      id: 'missile_s300',
      name: 'S-300 Missile System',
      category: 'missiles',
      faction: 'iran',
      rarity: 'legendary',
      price: 17500,
      icon: '💥',
      description: 'Russian long-range surface-to-air missile system with multi-target capability',
      stats: {
        damage: 95,
        defense: 75,
        speed: 92,
        range: 96,
        accuracy: 92
      },
      specialAbility: 'Multi-Target Engagement',
      unlockLevel: 12
    },
    {
      id: 'missile_shahed',
      name: 'Shahed-136 Drone',
      category: 'missiles',
      faction: 'iran',
      rarity: 'rare',
      price: 8500,
      icon: '💥',
      description: 'Iranian loitering munition with precision guidance',
      stats: {
        damage: 70,
        defense: 40,
        speed: 82,
        range: 78,
        accuracy: 75
      },
      specialAbility: 'Loitering Attack Mode',
      unlockLevel: 6
    },
    {
      id: 'missile_tomahawk',
      name: 'Tomahawk Cruise Missile',
      category: 'missiles',
      faction: 'usa',
      rarity: 'epic',
      price: 13000,
      icon: '🎯',
      description: 'Long-range subsonic cruise missile with precision guidance',
      stats: {
        damage: 90,
        defense: 60,
        speed: 85,
        range: 94,
        accuracy: 88
      },
      specialAbility: 'Precision Strike',
      unlockLevel: 9
    },

    // DRONE SYSTEMS
    {
      id: 'drone_reaper',
      name: 'MQ-9 Reaper',
      category: 'drones',
      faction: 'usa',
      rarity: 'epic',
      price: 11000,
      icon: '🛸',
      description: 'Unmanned combat aerial vehicle with surveillance and strike capabilities',
      stats: {
        damage: 75,
        defense: 45,
        speed: 88,
        range: 88,
        accuracy: 82
      },
      specialAbility: '24-Hour Surveillance',
      unlockLevel: 7
    },
    {
      id: 'drone_shahed',
      name: 'Shahed-136',
      category: 'drones',
      faction: 'iran',
      rarity: 'rare',
      price: 8500,
      icon: '🛸',
      description: 'Iranian loitering munition with precision guidance',
      stats: {
        damage: 70,
        defense: 40,
        speed: 82,
        range: 78,
        accuracy: 75
      },
      specialAbility: 'Loitering Attack Mode',
      unlockLevel: 6
    },
    {
      id: 'drone_bayraktar',
      name: 'Bayraktar TB2',
      category: 'drones',
      faction: 'iran',
      rarity: 'epic',
      price: 10500,
      icon: '🛸',
      description: 'Turkish combat drone with advanced optics and strike capabilities',
      stats: {
        damage: 72,
        defense: 48,
        speed: 85,
        range: 88,
        accuracy: 82
      },
      specialAbility: 'Advanced Optics System',
      unlockLevel: 7
    },

    // WARSHIPS
    {
      id: 'warship_ford',
      name: 'USS Gerald Ford',
      category: 'warships',
      faction: 'usa',
      rarity: 'mythic',
      price: 25000,
      icon: '🚢',
      description: 'Nuclear-powered aircraft carrier with advanced strike capabilities',
      stats: {
        damage: 98,
        defense: 99,
        speed: 35,
        range: 95,
        accuracy: 92
      },
      specialAbility: 'Nuclear Strike Capability',
      unlockLevel: 15
    },
    {
      id: 'warship_burke',
      name: 'USS Arleigh Burke',
      category: 'warships',
      faction: 'usa',
      rarity: 'legendary',
      price: 20000,
      icon: '🚢',
      description: 'Advanced destroyer with AEGIS combat system',
      stats: {
        damage: 92,
        defense: 88,
        speed: 40,
        range: 90,
        accuracy: 88
      },
      specialAbility: 'AEGIS Combat System',
      unlockLevel: 13
    },
    {
      id: 'warship_sahand',
      name: 'Sahand Frigate',
      category: 'warships',
      faction: 'iran',
      rarity: 'epic',
      price: 18000,
      icon: '🚢',
      description: 'Iranian warship with anti-ship missile defense',
      stats: {
        damage: 85,
        defense: 80,
        speed: 45,
        range: 85,
        accuracy: 80
      },
      specialAbility: 'Anti-Ship Missile Defense',
      unlockLevel: 9
    },

    // AIRCRAFT
    {
      id: 'aircraft_f35',
      name: 'F-35 Lightning II',
      category: 'aircraft',
      faction: 'usa',
      rarity: 'mythic',
      price: 22000,
      icon: '✈️',
      description: '5th generation stealth fighter with advanced avionics',
      stats: {
        damage: 95,
        defense: 82,
        speed: 98,
        range: 85,
        accuracy: 92
      },
      specialAbility: 'Stealth Technology',
      unlockLevel: 15
    },
    {
      id: 'aircraft_su57',
      name: 'Su-57 Felon',
      category: 'aircraft',
      faction: 'iran',
      rarity: 'legendary',
      price: 19000,
      icon: '✈️',
      description: 'Russian 5th generation stealth fighter with advanced radar tracking',
      stats: {
        damage: 90,
        defense: 85,
        speed: 95,
        range: 88,
        accuracy: 90
      },
      specialAbility: 'Advanced Radar Tracking',
      unlockLevel: 13
    },
    {
      id: 'aircraft_f22',
      name: 'F-22 Raptor',
      category: 'aircraft',
      faction: 'usa',
      rarity: 'mythic',
      price: 25000,
      icon: '✈️',
      description: 'Stealth air superiority fighter with advanced capabilities',
      stats: {
        damage: 98,
        defense: 90,
        speed: 95,
        range: 85,
        accuracy: 92
      },
      specialAbility: 'Air Dominance Mode',
      unlockLevel: 15
    },
    {
      id: 'aircraft_mig35',
      name: 'MiG-35',
      category: 'aircraft',
      faction: 'iran',
      rarity: 'legendary',
      price: 17000,
      icon: '✈️',
      description: 'Russian multirole fighter with advanced radar tracking',
      stats: {
        damage: 85,
        defense: 80,
        speed: 90,
        range: 82,
        accuracy: 85
      },
      specialAbility: 'Advanced Radar Tracking',
      unlockLevel: 11
    },
    {
      id: 'aircraft_apache',
      name: 'AH-64 Apache',
      category: 'aircraft',
      faction: 'usa',
      rarity: 'epic',
      price: 12500,
      icon: '✈️',
      description: 'American attack helicopter designed for anti-armor and close air support',
      stats: {
        damage: 78,
        defense: 70,
        speed: 70,
        range: 75,
        accuracy: 82
      },
      specialAbility: 'Tank Hunter Mode',
      unlockLevel: 8
    },
    {
      id: 'aircraft_havoc',
      name: 'Mi-28 Havoc',
      category: 'aircraft',
      faction: 'iran',
      rarity: 'epic',
      price: 12000,
      icon: '✈️',
      description: 'Russian attack helicopter designed for anti-armor and close air support',
      stats: {
        damage: 75,
        defense: 72,
        speed: 68,
        range: 72,
        accuracy: 80
      },
      specialAbility: 'Night Attack Capability',
      unlockLevel: 8
    }
  ];

  const categories = [
    { id: 'all', name: 'All Weapons', icon: '⚔️' },
    { id: 'tanks', name: 'Tanks', icon: '🚜' },
    { id: 'missiles', name: 'Missiles', icon: '🚀' },
    { id: 'drones', name: 'Drones', icon: '🛸' },
    { id: 'warships', name: 'Warships', icon: '🚢' },
    { id: 'aircraft', name: 'Aircraft', icon: '✈️' }
  ];

  const filteredWeapons = selectedCategory === 'all' 
    ? militaryWeapons 
    : militaryWeapons.filter(weapon => weapon.category === selectedCategory);

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#ffffff',
      rare: '#0088ff',
      epic: '#9933ff',
      legendary: '#ff8800',
      mythic: '#ff0088'
    };
    return colors[rarity] || '#ffffff';
  };

  const addToFavorites = (weapon) => {
    const newFavorites = [...favorites, weapon.id];
    setFavorites(newFavorites);
    toast.success(`⭐ ${weapon.name} added to favorites!`);
    hapticFeedback('success');
  };

  const removeFromFavorites = (weaponId) => {
    const newFavorites = favorites.filter(w => w.id !== weaponId);
    setFavorites(newFavorites);
    toast.success('Weapon removed from favorites');
    hapticFeedback('success');
  };

  const handlePurchase = async (weapon) => {
    if (!user) {
      toast.error('Please login to purchase weapons');
      return;
    }

    if (user.level < weapon.unlockLevel) {
      toast.error(`Requires level ${weapon.unlockLevel}`);
      return;
    }

    if (user.stg_balance < weapon.price) {
      toast.error('Insufficient STG balance');
      return;
    }

    setPurchasing(weapon.id);
    hapticFeedback('impact');

    try {
      // Call backend API for weapon purchase
      const response = await fetch(`${API_CONFIG.baseURL}/api/weapons/${weapon.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          weaponId: weapon.id,
          price: weapon.price,
          currency: 'STG'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`🎯 Purchased ${weapon.name}!`);
        hapticFeedback('success');
        
        // Add to user inventory and favorites
        addToFavorites(weapon);
      } else {
        toast.error(data.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Weapon purchase error:', error);
      toast.error('Failed to purchase weapon');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Container>
      <Title>🎯 Military Weapons Arsenal</Title>
      
      <FilterTabs>
        {categories.map(category => (
          <FilterTab
            key={category.id}
            active={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category.icon} {category.name}
          </FilterTab>
        ))}
      </FilterTabs>

      <WeaponGrid>
        {filteredWeapons.map(weapon => (
          <WeaponCard
            key={weapon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredWeapons.indexOf(weapon) * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <WeaponHeader>
              <WeaponIcon>{weapon.icon}</WeaponIcon>
              <WeaponInfo>
                <WeaponName style={{ color: getRarityColor(weapon.rarity) }}>
                  {weapon.name}
                </WeaponName>
                <WeaponCategory>
                  {weapon.category.toUpperCase()} • {weapon.rarity.toUpperCase()}
                </WeaponCategory>
              </WeaponInfo>
            </WeaponHeader>

            <WeaponStats>
              <Stat>
                <StatLabel>Damage:</StatLabel>
                <StatValue>{weapon.stats.damage}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Defense:</StatLabel>
                <StatValue>{weapon.stats.defense}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Speed:</StatLabel>
                <StatValue>{weapon.stats.speed}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Range:</StatLabel>
                <StatValue>{weapon.stats.range}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Accuracy:</StatLabel>
                <StatValue>{weapon.stats.accuracy}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Faction:</StatLabel>
                <StatValue>{weapon.faction.toUpperCase()}</StatValue>
              </Stat>
            </WeaponStats>

            <WeaponDescription>
              {weapon.description}
            </WeaponDescription>

            <div style={{ 
              padding: '10px', 
              background: 'rgba(0, 136, 204, 0.1)', 
              borderRadius: '8px',
              margin: '10px 0',
              fontSize: '14px',
              color: '#00a6ff'
            }}>
              <strong>Special:</strong> {weapon.specialAbility}
            </div>

            <WeaponFooter>
              <div>
                <WeaponPrice>{weapon.price.toLocaleString()} STG</WeaponPrice>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Requires Level {weapon.unlockLevel}
                </div>
              </div>
              <PurchaseButton
                onClick={() => handlePurchase(weapon)}
                disabled={purchasing === weapon.id || !user || user.stg_balance < weapon.price || user.level < weapon.unlockLevel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {purchasing === weapon.id ? 'Purchasing...' : 'Purchase'}
              </PurchaseButton>
            </WeaponFooter>
          </WeaponCard>
        ))}
      </WeaponGrid>
    </Container>
  );
};

export default MilitaryWeaponsShop;
