// Complete Unified Shop System
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

const ShopContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
`;

// Sidebar Navigation
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

const CategoryTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
  text-align: center;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CategoryButton = styled(motion.button)`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
    'rgba(255, 255, 255, 0.1)'};
  color: #ffffff;
  border: none;
  padding: 15px 20px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(45deg, #ff6b6b, #ff8e8e)' : 
      'rgba(255, 255, 255, 0.15)'};
    transform: translateX(5px);
  }
`;

const CategoryIcon = styled.span`
  font-size: 20px;
`;

const CategoryCount = styled.span`
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
`;

// Main Content Area
const MainContent = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// Search and Filter Bar
const SearchBar = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 15px 20px;
  border-radius: 12px;
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
  padding: 15px 20px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(45deg, #0088cc, #00aaff)' : 
      'rgba(255, 255, 255, 0.15)'};
  }
`;

const SortDropdown = styled.select`
  padding: 15px 20px;
  border-radius: 12px;
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

// Shopping Cart
const CartButton = styled(motion.button)`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(45deg, #ffaa00, #ffcc66);
  color: #000000;
  border: none;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255, 170, 0, 0.3);
  z-index: 1000;
  position: relative;
`;

const CartBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff3333;
  color: #ffffff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
`;

// Product Grid
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const ProductCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
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

const ProductImage = styled.div`
  height: 180px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  overflow: hidden;
`;

const ProductBadge = styled.div`
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

const ProductInfo = styled.div`
  padding: 20px;
`;

const ProductName = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
`;

const ProductDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.4;
`;

const ProductStats = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ProductPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const Price = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #ffaa00;
`;

const DiscountBadge = styled.div`
  background: #ff3333;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
`;

const ProductActions = styled.div`
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

// Shopping Cart Modal
const CartModal = styled(motion.div)`
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

const CartContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const CartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const CartTitle = styled.h2`
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

const CartItems = styled.div`
  margin-bottom: 25px;
`;

const CartItem = styled.div`
  display: flex;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 10px;
`;

const CartItemImage = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.gradient || 'linear-gradient(135deg, #666666, #999999)'};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const CartItemInfo = styled.div`
  flex: 1;
`;

const CartItemName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 5px;
`;

const CartItemPrice = styled.div`
  color: #ffaa00;
  font-weight: bold;
`;

const CartItemQuantity = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuantityButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  cursor: pointer;
`;

const Quantity = styled.div`
  color: #ffffff;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
`;

const CartSummary = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.8);
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
`;

const CheckoutButton = styled(motion.button)`
  width: 100%;
  background: linear-gradient(45deg, #00ff00, #66ff66);
  color: #000000;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
`;

// Loading State
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 24px;
  color: #ffffff;
`;

// Shop Categories Data
const SHOP_CATEGORIES = {
  weapons: {
    id: 'weapons',
    name: 'Weapons',
    icon: '⚔️',
    count: 45,
    gradient: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)'
  },
  skins: {
    id: 'skins',
    name: 'Character Skins',
    icon: '👤',
    count: 28,
    gradient: 'linear-gradient(135deg, #0088cc, #00aaff)'
  },
  collectibles: {
    id: 'collectibles',
    name: 'Collectibles',
    icon: '💎',
    count: 67,
    gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)'
  },
  boosts: {
    id: 'boosts',
    name: 'Power-Ups',
    icon: '⚡',
    count: 15,
    gradient: 'linear-gradient(135deg, #00ff88, #66ffcc)'
  },
  crates: {
    id: 'crates',
    name: 'Loot Crates',
    icon: '📦',
    count: 8,
    gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)'
  },
  special: {
    id: 'special',
    name: 'Special Offers',
    icon: '🌟',
    count: 12,
    gradient: 'linear-gradient(135deg, #ff3333, #ff6666)'
  }
};

// Mock Product Data
const generateProducts = (category) => {
  const products = {
    weapons: [
      {
        id: 'weapon_001',
        name: 'Golden M4A1',
        description: 'Legendary assault rifle with enhanced damage and accuracy',
        category: 'weapons',
        rarity: 'legendary',
        price: 5000,
        discount: 20,
        stats: { damage: 85, accuracy: 92, fire_rate: 78 },
        icon: '🔫',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        tags: ['weapon', 'assault', 'legendary'],
        stock: 100,
        limited: true
      },
      {
        id: 'weapon_002',
        name: 'Diamond SCAR-H',
        description: 'Mythic sniper rifle with extreme range and power',
        category: 'weapons',
        rarity: 'mythic',
        price: 10000,
        discount: 0,
        stats: { damage: 95, accuracy: 98, fire_rate: 45 },
        icon: '🎯',
        gradient: 'linear-gradient(135deg, #00ffff, #66ffff)',
        tags: ['weapon', 'sniper', 'mythic'],
        stock: 50,
        limited: true
      },
      {
        id: 'weapon_003',
        name: 'Patriot M4',
        description: 'USA faction exclusive with bonus damage vs Iran',
        category: 'weapons',
        rarity: 'rare',
        price: 2500,
        discount: 15,
        stats: { damage: 75, accuracy: 85, fire_rate: 80 },
        icon: '🇺🇸',
        gradient: 'linear-gradient(135deg, #0066cc, #0088ff)',
        tags: ['weapon', 'assault', 'usa', 'rare'],
        stock: 200,
        limited: false
      }
    ],
    skins: [
      {
        id: 'skin_001',
        name: 'Iranian Elite Guard',
        description: 'Elite guard skin with golden trim and special effects',
        category: 'skins',
        rarity: 'elite',
        price: 2500,
        discount: 0,
        stats: { health: 10, speed: 5 },
        icon: '🛡️',
        gradient: 'linear-gradient(135deg, #00aa00, #66ff66)',
        tags: ['skin', 'iran', 'elite'],
        stock: 500,
        limited: false
      },
      {
        id: 'skin_002',
        name: 'Phoenix Warrior',
        description: 'Mythic skin with fire effects and resurrection ability',
        category: 'skins',
        rarity: 'mythic',
        price: 15000,
        discount: 25,
        stats: { health: 30, speed: 15, damage: 10 },
        icon: '🔥',
        gradient: 'linear-gradient(135deg, #ff6600, #ffaa00)',
        tags: ['skin', 'mythic', 'phoenix'],
        stock: 100,
        limited: true
      }
    ],
    collectibles: [
      {
        id: 'collectible_001',
        name: 'Victory Medal',
        description: 'Commemorative medal for battle victories',
        category: 'collectibles',
        rarity: 'rare',
        price: 1000,
        discount: 0,
        stats: { prestige: 50 },
        icon: '🏆',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        tags: ['collectible', 'medal', 'victory'],
        stock: 1000,
        limited: false
      },
      {
        id: 'collectible_002',
        name: 'Dragon Statue',
        description: 'Legendary dragon statue with mystical powers',
        category: 'collectibles',
        rarity: 'legendary',
        price: 7500,
        discount: 30,
        stats: { luck: 25, prestige: 100 },
        icon: '🐉',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        tags: ['collectible', 'dragon', 'legendary'],
        stock: 50,
        limited: true
      }
    ],
    boosts: [
      {
        id: 'boost_001',
        name: 'Double XP Boost',
        description: 'Double experience for 24 hours',
        category: 'boosts',
        rarity: 'common',
        price: 500,
        discount: 0,
        stats: { duration: '24h', multiplier: 2 },
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #00ff88, #66ffcc)',
        tags: ['boost', 'xp', 'temporary'],
        stock: 9999,
        limited: false
      },
      {
        id: 'boost_002',
        name: 'STG Booster',
        description: '50% bonus STG earnings for 12 hours',
        category: 'boosts',
        rarity: 'uncommon',
        price: 750,
        discount: 10,
        stats: { duration: '12h', multiplier: 1.5 },
        icon: '💰',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        tags: ['boost', 'stg', 'temporary'],
        stock: 9999,
        limited: false
      }
    ],
    crates: [
      {
        id: 'crate_001',
        name: 'Warrior Crate',
        description: 'Random weapon or skin with guaranteed rare item',
        category: 'crates',
        rarity: 'rare',
        price: 1500,
        discount: 0,
        stats: { guarantee: 'rare', chance_legendary: 5 },
        icon: '📦',
        gradient: 'linear-gradient(135deg, #8b4513, #cd853f)',
        tags: ['crate', 'random', 'weapon'],
        stock: 5000,
        limited: false
      },
      {
        id: 'crate_002',
        name: 'Legendary Crate',
        description: 'High chance for legendary or mythic items',
        category: 'crates',
        rarity: 'legendary',
        price: 5000,
        discount: 20,
        stats: { guarantee: 'epic', chance_mythic: 10 },
        icon: '🎁',
        gradient: 'linear-gradient(135deg, #ffaa00, #ffcc66)',
        tags: ['crate', 'random', 'legendary'],
        stock: 1000,
        limited: true
      }
    ],
    special: [
      {
        id: 'special_001',
        name: 'Starter Pack',
        description: 'Perfect for new players with weapons and boosts',
        category: 'special',
        rarity: 'special',
        price: 2000,
        discount: 50,
        stats: { items: 5, value: 4000 },
        icon: '🎯',
        gradient: 'linear-gradient(135deg, #00ff00, #66ff66)',
        tags: ['bundle', 'starter', 'discount'],
        stock: 1000,
        limited: true
      },
      {
        id: 'special_002',
        name: 'VIP Pass',
        description: '30 days of premium benefits and exclusive items',
        category: 'special',
        rarity: 'premium',
        price: 10000,
        discount: 0,
        stats: { duration: '30d', benefits: 12 },
        icon: '👑',
        gradient: 'linear-gradient(135deg, #ff00ff, #ff66ff)',
        tags: ['subscription', 'premium', 'vip'],
        stock: 500,
        limited: false
      }
    ]
  };
  
  return products[category] || [];
};

// Main Component
const UnifiedShop = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  
  // State
  const [activeCategory, setActiveCategory] = useState('weapons');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  
  // Load products
  useEffect(() => {
    loadProducts();
  }, [activeCategory]);
  
  // Filter and sort products
  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, activeFilter, sortBy]);
  
  const loadProducts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const categoryProducts = generateProducts(activeCategory);
      setProducts(categoryProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(product =>
        product.tags.includes(activeFilter)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_low':
          return (a.price * (1 - a.discount/100)) - (b.price * (1 - b.discount/100));
        case 'price_high':
          return (b.price * (1 - b.discount/100)) - (a.price * (1 - a.discount/100));
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        default:
          return 0;
      }
    });
    
    setFilteredProducts(filtered);
  };
  
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    hapticFeedback('impact');
    toast.success(`${product.name} added to cart`);
  };
  
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    hapticFeedback('impact');
  };
  
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.price * (1 - item.discount/100);
      return total + (price * item.quantity);
    }, 0);
  };
  
  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase');
      return;
    }
    
    const total = calculateTotal();
    const userBalance = user.stg_balance || 0;
    
    if (total > userBalance) {
      toast.error('Insufficient STG balance');
      return;
    }
    
    setPurchasing(true);
    
    try {
      // Simulate purchase API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user balance (in real app, this would be handled by backend)
      // user.stg_balance -= total;
      
      toast.success('Purchase successful! 🎉');
      setCart([]);
      setIsCartOpen(false);
      hapticFeedback('notification');
      
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };
  
  const getRarityColor = (rarity) => {
    const colors = {
      common: '#888888',
      uncommon: '#00ff00',
      rare: '#0088ff',
      epic: '#ff00ff',
      legendary: '#ffaa00',
      mythic: '#ff00ff',
      elite: '#ff6600',
      premium: '#ff00ff',
      special: '#00ff00'
    };
    return colors[rarity] || '#888888';
  };
  
  return (
    <Container>
      <Header>
        <Title>🛍️ Unified Shop</Title>
        <Subtitle>Discover exclusive weapons, skins, and collectibles</Subtitle>
      </Header>
      
      <ShopContainer>
        {/* Sidebar Navigation */}
        <Sidebar>
          <CategoryTitle>Categories</CategoryTitle>
          <CategoryList>
            {Object.values(SHOP_CATEGORIES).map(category => (
              <CategoryButton
                key={category.id}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CategoryIcon>{category.icon}</CategoryIcon>
                <span>{category.name}</span>
                <CategoryCount>{category.count}</CategoryCount>
              </CategoryButton>
            ))}
          </CategoryList>
        </Sidebar>
        
        {/* Main Content */}
        <MainContent>
          {/* Search and Filter Bar */}
          <SearchBar>
            <SearchInput
              type="text"
              placeholder="Search items..."
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
              active={activeFilter === 'limited'}
              onClick={() => setActiveFilter('limited')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Limited Time
            </FilterButton>
            
            <FilterButton
              active={activeFilter === 'discount'}
              onClick={() => setActiveFilter('discount')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              On Sale
            </FilterButton>
            
            <SortDropdown
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rarity">Sort by Rarity</option>
            </SortDropdown>
          </SearchBar>
          
          {/* Products Grid */}
          {loading ? (
            <LoadingSpinner>Loading products...</LoadingSpinner>
          ) : (
            <ProductGrid>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  rarity={product.rarity}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ProductImage gradient={product.gradient}>
                    {product.icon}
                    <ProductBadge color={getRarityColor(product.rarity)}>
                      {product.rarity}
                    </ProductBadge>
                    {product.discount > 0 && (
                      <ProductBadge color="#ff3333">
                        -{product.discount}%
                      </ProductBadge>
                    )}
                  </ProductImage>
                  
                  <ProductInfo>
                    <ProductName>{product.name}</ProductName>
                    <ProductDescription>{product.description}</ProductDescription>
                    
                    <ProductStats>
                      {Object.entries(product.stats).map(([key, value]) => (
                        <Stat key={key}>
                          <span>{key}:</span>
                          <span>{value}</span>
                        </Stat>
                      ))}
                    </ProductStats>
                    
                    <ProductPrice>
                      <Price>
                        {product.discount > 0 ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                              {product.price} STG
                            </span>
                            <span> {Math.round(product.price * (1 - product.discount/100))} STG</span>
                          </>
                        ) : (
                          `${product.price} STG`
                        )}
                      </Price>
                      {product.limited && (
                        <span style={{ fontSize: '12px', color: '#ff6b6b' }}>
                          {product.stock} left
                        </span>
                      )}
                    </ProductPrice>
                    
                    <ProductActions>
                      <ActionButton
                        primary
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </ActionButton>
                      
                      <ActionButton
                        onClick={() => {
                          hapticFeedback('impact');
                          toast.success('Added to wishlist');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ❤️
                      </ActionButton>
                    </ProductActions>
                  </ProductInfo>
                </ProductCard>
              ))}
            </ProductGrid>
          )}
        </MainContent>
      </ShopContainer>
      
      {/* Shopping Cart Button */}
      <CartButton
        onClick={() => setIsCartOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        🛒
        {cart.length > 0 && (
          <CartBadge>{cart.reduce((sum, item) => sum + item.quantity, 0)}</CartBadge>
        )}
      </CartButton>
      
      {/* Shopping Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <CartModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          >
            <CartContent
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CartHeader>
                <CartTitle>Shopping Cart</CartTitle>
                <CloseButton onClick={() => setIsCartOpen(false)}>
                  ✕
                </CloseButton>
              </CartHeader>
              
              <CartItems>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    Your cart is empty
                  </div>
                ) : (
                  cart.map(item => (
                    <CartItem key={item.id}>
                      <CartItemImage gradient={item.gradient}>
                        {item.icon}
                      </CartItemImage>
                      
                      <CartItemInfo>
                        <CartItemName>{item.name}</CartItemName>
                        <CartItemPrice>
                          {item.discount > 0 ? (
                            <>
                              <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>
                                {item.price} STG
                              </span>
                              <span> {Math.round(item.price * (1 - item.discount/100))} STG</span>
                            </>
                          ) : (
                            `${item.price} STG`
                          )}
                        </CartItemPrice>
                      </CartItemInfo>
                      
                      <CartItemQuantity>
                        <QuantityButton
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </QuantityButton>
                        <Quantity>{item.quantity}</Quantity>
                        <QuantityButton
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </QuantityButton>
                      </CartItemQuantity>
                    </CartItem>
                  ))
                )}
              </CartItems>
              
              {cart.length > 0 && (
                <CartSummary>
                  <SummaryRow>
                    <span>Subtotal:</span>
                    <span>{calculateTotal().toLocaleString()} STG</span>
                  </SummaryRow>
                  <SummaryRow>
                    <span>Discount:</span>
                    <span>-{cart.reduce((sum, item) => sum + (item.price * item.discount/100 * item.quantity), 0).toLocaleString()} STG</span>
                  </SummaryRow>
                  <SummaryTotal>
                    <span>Total:</span>
                    <span>{calculateTotal().toLocaleString()} STG</span>
                  </SummaryTotal>
                  
                  <CheckoutButton
                    onClick={handlePurchase}
                    disabled={purchasing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {purchasing ? 'Processing...' : 'Checkout'}
                  </CheckoutButton>
                </CartSummary>
              )}
            </CartContent>
          </CartModal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default UnifiedShop;
