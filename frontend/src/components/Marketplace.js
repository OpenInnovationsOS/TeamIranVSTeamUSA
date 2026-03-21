// Enhanced Marketplace Component - Multi-Card & Multi-Tab System
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocketBattle } from '../hooks/useWebSocketBattle';
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
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
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
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #ff6b6b, #ff8e53);
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
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
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
  color: #ff6b6b;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
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
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`;

const ItemList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 107, 107, 0.5);
    border-radius: 3px;
  }
`;

const MarketItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const ItemDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const ItemStats = styled.div`
  text-align: right;
`;

const ItemPrice = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
`;

const ItemLevel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const RarityBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  background: ${props => 
    props.rarity === 'common' ? 'rgba(255, 255, 255, 0.2)' : 
    props.rarity === 'rare' ? 'rgba(0, 136, 255, 0.3)' : 
    props.rarity === 'epic' ? 'rgba(153, 51, 255, 0.3)' : 
    props.rarity === 'legendary' ? 'rgba(255, 136, 0, 0.3)' : 
    props.rarity === 'mythic' ? 'rgba(255, 0, 136, 0.3)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  color: ${props => 
    props.rarity === 'common' ? '#ffffff' : 
    props.rarity === 'rare' ? '#0088ff' : 
    props.rarity === 'epic' ? '#9933ff' : 
    props.rarity === 'legendary' ? '#ff8800' : 
    props.rarity === 'mythic' ? '#ff0088' : 
    '#ffffff'
  };
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
`;

const SearchInput = styled.input`
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: #ffffff;
  font-size: 14px;
  width: 300px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled(motion.button)`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #ff6b6b, #ff8e53);
    color: #ffffff;
    border-color: transparent;
  }
`;

const Marketplace = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('weapons');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [purchasing, setPurchasing] = useState(null);

  const marketplaceTabs = [
    { id: 'weapons', label: 'Weapons', icon: '⚔️' },
    { id: 'items', label: 'Items', icon: '🎒' },
    { id: 'auctions', label: 'Auctions', icon: '🔨' },
    { id: 'trades', label: 'Trades', icon: '🤝' },
    { id: 'my-listings', label: 'My Listings', icon: '📋' }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '⚔️' },
    { id: 'weapons', name: 'Weapons', icon: '⚔️' },
    { id: 'armor', name: 'Armor', icon: '🛡️' },
    { id: 'consumables', name: 'Consumables', icon: '💊' },
    { id: 'materials', name: 'Materials', icon: '🔧' }
  ];

  // WebSocket for real-time marketplace updates
  useWebSocketBattle({
    onMarketplaceUpdate: (data) => {
      if (data.type === 'ITEM_UPDATE') {
        setItems(prev => 
          prev.map(item => 
            item.id === data.itemId 
              ? { ...item, ...data.updates } 
              : item
          )
        );
      }
      if (data.type === 'AUCTION_UPDATE') {
        setAuctions(prev => 
          prev.map(auction => 
            auction.id === data.auctionId 
              ? { ...auction, ...data.updates } 
              : auction
          )
        );
      }
      if (data.type === 'TRADE_UPDATE') {
        setTrades(prev => 
          prev.map(trade => 
            trade.id === data.tradeId 
              ? { ...trade, ...data.updates } 
              : trade
          )
        );
      }
    }
  });

  // Load marketplace data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/marketplace`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
          setAuctions(data.auctions || []);
          setTrades(data.trades || []);
        } else {
          // Fallback data
          setItems([
            {
              id: 1,
              name: 'Enhanced Battle Rifle',
              category: 'weapons',
              rarity: 'epic',
              price: 8500,
              seller: 'EliteWarrior123',
              level: 15,
              description: 'Upgraded assault rifle with enhanced accuracy',
              stats: { damage: 85, defense: 20, range: 95, accuracy: 92 },
              avatar: '🔫'
            },
            {
              id: 2,
              name: 'Legendary Sword',
              category: 'weapons',
              rarity: 'legendary',
              price: 15000,
              seller: 'PhoenixMaster',
              level: 20,
              description: 'Ancient sword with mystical powers',
              stats: { damage: 95, defense: 30, range: 80, accuracy: 88 },
              avatar: '⚔️'
            },
            {
              id: 3,
              name: 'Shield of Valor',
              category: 'armor',
              rarity: 'epic',
              price: 6000,
              seller: 'Defender456',
              level: 12,
              description: 'Magical shield with protective enchantments',
              stats: { defense: 45, damage: 0, range: 0, accuracy: 0 },
              avatar: '🛡️'
            },
            {
              id: 4,
              name: 'Health Potion',
              category: 'consumables',
              rarity: 'common',
              price: 500,
              seller: 'PotionMaster',
              level: 5,
              description: 'Restores 50 HP instantly',
              stats: { healing: 50, duration: 0 },
              avatar: '💊'
            }
          ]);
          
          setAuctions([
            {
              id: 1,
              itemName: 'Rare Weapon Bundle',
              category: 'weapons',
              rarity: 'rare',
              currentBid: 2500,
              buyoutPrice: 3000,
              endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
              seller: 'Collector789',
              bids: 5,
              avatar: '🔨'
            },
            {
              id: 2,
              itemName: 'Armor Set',
              category: 'armor',
              rarity: 'epic',
              currentBid: 4500,
              buyoutPrice: 5500,
              endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
              seller: 'ArmorSmith',
              bids: 3,
              avatar: '🛡️'
            }
          ]);
          
          setTrades([
            {
              id: 1,
              offeredItem: 'Epic Sword',
              offeredBy: 'Trader123',
              offeredLevel: 18,
              offeredPrice: 8000,
              wantedItem: 'Legendary Shield',
              wantedBy: 'Trader456',
              wantedLevel: 20,
              wantedPrice: 9000,
              status: 'active',
              avatar: '🤝'
            },
            {
              id: 2,
              offeredItem: 'Rare Armor',
              offeredBy: 'Defender789',
              offeredLevel: 12,
              offeredPrice: 3500,
              wantedItem: 'Epic Weapon',
              wantedBy: 'Collector123',
              wantedLevel: 15,
              wantedPrice: 7000,
              status: 'pending',
              avatar: '🤝'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
        toast.error('Failed to load marketplace');
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceData();
  }, [user?.id]);

  // Load my listings
  useEffect(() => {
    const loadMyListings = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/marketplace/my-listings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMyListings(data.listings || []);
        } else {
          // Fallback data
          setMyListings([
            {
              id: 1,
              itemName: 'Basic Sword',
              category: 'weapons',
              rarity: 'common',
              price: 1000,
              listedPrice: 1200,
              status: 'active',
              offers: 2,
              views: 45,
              avatar: '⚔️'
            },
            {
              id: 2,
              itemName: 'Health Pack',
              category: 'consumables',
              rarity: 'common',
              price: 300,
              listedPrice: 350,
              status: 'active',
              offers: 1,
              views: 23,
              avatar: '💊'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load my listings:', error);
      }
    };

    if (activeTab === 'my-listings') {
      loadMyListings();
    }
  }, [activeTab, user?.id]);

  const purchaseItem = async (itemId, price) => {
    if (!user) {
      toast.error('Please login to purchase items');
      return;
    }

    if (user.stg_balance < price) {
      toast.error('Insufficient STG balance');
      return;
    }

    setPurchasing(itemId);
    hapticFeedback('impact');

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/marketplace/purchase/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          userId: user?.id,
          itemId: itemId,
          price: price
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`🎉 Purchase successful!`);
        hapticFeedback('success');
        
        // Update UI
        setItems(prev => 
          prev.filter(item => item.id !== itemId)
        );
      } else {
        toast.error(data.message || 'Failed to purchase item');
      }
    } catch (error) {
      console.error('Marketplace purchase error:', error);
      toast.error('Failed to purchase item');
    } finally {
      setPurchasing(null);
    }
  };

  const WeaponsCards = () => [
    {
      id: 'featured-weapons',
      title: 'Featured Weapons',
      icon: '⭐',
      content: (
        <CardContent>
          <ItemList>
            {items.filter(item => item.category === 'weapons' && item.featured).map(item => (
              <MarketItem
                key={item.id}
                onClick={() => {
                  hapticFeedback('impact');
                  toast.info(`Viewing ${item.name}`);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ItemInfo>
                  <ItemName>{item.name}</ItemName>
                  <ItemDetails>
                    {item.seller} • Level {item.level} • {item.description}
                  </ItemDetails>
                </ItemInfo>
                <ItemStats>
                  <ItemPrice>{item.price.toLocaleString()} STG</ItemPrice>
                  <ItemLevel>Lv.{item.level}</ItemLevel>
                  <RarityBadge rarity={item.rarity}>
                    {item.rarity.toUpperCase()}
                  </RarityBadge>
                </ItemStats>
              </MarketItem>
            ))}
          </ItemList>
        </CardContent>
      )
    },
    {
      id: 'all-weapons',
      title: 'All Weapons',
      icon: '⚔️',
      content: (
        <CardContent>
          <SearchContainer>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weapons..."
            />
          </SearchContainer>
          <FilterContainer>
            {categories.map(category => (
              <FilterButton
                key={category.id}
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.icon} {category.name}
              </FilterButton>
            ))}
          </FilterContainer>
          <ItemList>
            {items
              .filter(item => item.category === 'weapons')
              .filter(item => searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map(item => (
                <MarketItem
                  key={item.id}
                  onClick={() => {
                    hapticFeedback('impact');
                    toast.info(`Viewing ${item.name}`);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ItemInfo>
                    <ItemName>{item.name}</ItemName>
                    <ItemDetails>
                      {item.seller} • Level {item.level} • {item.description}
                    </ItemDetails>
                  </ItemInfo>
                  <ItemStats>
                    <ItemPrice>{item.price.toLocaleString()} STG</ItemPrice>
                    <ItemLevel>Lv.{item.level}</ItemLevel>
                    <RarityBadge rarity={item.rarity}>
                      {item.rarity.toUpperCase()}
                    </RarityBadge>
                  </ItemStats>
                </MarketItem>
              ))}
            )}
          </ItemList>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'weapons': return WeaponsCards();
      case 'items': return WeaponsCards();
      case 'auctions': return WeaponsCards();
      case 'trades': return WeaponsCards();
      case 'my-listings': return WeaponsCards();
      default: return WeaponsCards();
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛒</div>
          <div style={{ color: '#ffffff' }}>Loading marketplace...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🛒 Marketplace</Title>
      
      <TabContainer>
        {marketplaceTabs.map(tab => (
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

export default Marketplace;
