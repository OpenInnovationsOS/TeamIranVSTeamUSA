// Global Search System - Advanced Search Functionality
import React, { useState, useEffect, useCallback } from 'react';
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
  background: linear-gradient(45deg, #00a6ff, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 600px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00a6ff;
    box-shadow: 0 0 20px rgba(0, 166, 255, 0.3);
  }
  
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
    box-shadow: 0 4px 12px rgba(0, 166, 255, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #00a6ff, #00d4ff);
    color: #000000;
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
    box-shadow: 0 10px 30px rgba(0, 166, 255, 0.3);
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

const SearchResults = styled.div`
  max-height: 600px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 166, 255, 0.5);
    border-radius: 3px;
  }
`;

const SearchItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(8px);
  }
`;

const ItemIcon = styled.div`
  font-size: 32px;
  margin-right: 16px;
  min-width: 40px;
  text-align: center;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemTitle = styled.div`
  font-weight: bold;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 4px;
`;

const ItemDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const ItemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemType = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  background: ${props => 
    props.type === 'weapon' ? 'rgba(255, 107, 107, 0.3)' : 
    props.type === 'player' ? 'rgba(0, 166, 255, 0.3)' : 
    props.type === 'guild' ? 'rgba(132, 94, 247, 0.3)' : 
    props.type === 'tournament' ? 'rgba(255, 215, 0, 0.3)' : 
    props.type === 'territory' ? 'rgba(0, 255, 0, 0.3)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  color: ${props => 
    props.type === 'weapon' ? '#ff6b6b' : 
    props.type === 'player' ? '#00a6ff' : 
    props.type === 'guild' ? '#845ef7' : 
    props.type === 'tournament' ? '#ffd700' : 
    props.type === 'territory' ? '#00ff00' : 
    '#ffffff'
  };
`;

const ItemStats = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 48px;
  color: #00a6ff;
`;

const GlobalSearch = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchCategory, setSearchCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const searchCategories = [
    { id: 'all', label: 'All', icon: '🔍' },
    { id: 'weapons', label: 'Weapons', icon: '⚔️' },
    { id: 'players', label: 'Players', icon: '👤' },
    { id: 'guilds', label: 'Guilds', icon: '👥' },
    { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
    { id: 'territories', label: 'Territories', icon: '🗺️' }
  ];

  // WebSocket for real-time search updates
  useWebSocketBattle({
    onSearchUpdate: (data) => {
      if (data.type === 'SEARCH_RESULT_UPDATE') {
        setSearchResults(prev => 
          prev.map(result => 
            result.id === data.resultId 
              ? { ...result, ...data.updates } 
              : result
          )
        );
      }
    }
  });

  // Load search history
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Save search history
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  // Perform search
  const performSearch = useCallback(async (query, category) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          query: query.trim(),
          category: category,
          filters: getActiveFilters(),
          sortBy: getSortOption(),
          limit: 20
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
        
        // Add to search history
        if (query.trim() && !searchHistory.includes(query.trim())) {
          setSearchHistory(prev => [query.trim(), ...prev.slice(0, 9)]);
        }
      } else {
        // Fallback data
        const fallbackResults = generateFallbackResults(query, category);
        setSearchResults(fallbackResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback data
      const fallbackResults = generateFallbackResults(query, category);
      setSearchResults(fallbackResults);
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchHistory]);

  // Generate suggestions
  const generateSuggestions = useCallback((query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const allSuggestions = [
      'DragonSlayer', 'PhoenixRising', 'EliteWarrior', 'ShadowHunter',
      'F-22 Raptor', 'Su-57 Felon', 'M1A2 Abrams', 'T-90M',
      'Elite Warriors', 'Phoenix Legion', 'Shadow Guild',
      'Spring Championship', 'Summer Showdown', 'Winter Warfare',
      'Tehran', 'New York', 'Los Angeles', 'Chicago'
    ];

    const filtered = allSuggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    setSuggestions(filtered);
  }, []);

  // Generate fallback results
  const generateFallbackResults = (query, category) => {
    const allResults = [
      {
        id: 1,
        title: 'DragonSlayer',
        description: 'Elite player with 125,000 points',
        type: 'player',
        category: 'players',
        stats: 'Level 45 • 2,340 battles • 78% win rate',
        icon: '👤'
      },
      {
        id: 2,
        title: 'F-22 Raptor',
        description: 'Legendary fighter jet with 92% accuracy',
        type: 'weapon',
        category: 'weapons',
        stats: 'Damage: 95 • Accuracy: 92% • Range: 95',
        icon: '✈️'
      },
      {
        id: 3,
        title: 'Elite Warriors',
        description: 'Top guild with 50 members',
        type: 'guild',
        category: 'guilds',
        stats: 'Level 25 • 125,000 power • 3 territories',
        icon: '👥'
      },
      {
        id: 4,
        title: 'Spring Championship 2026',
        description: 'Major tournament with 50,000 STG prize pool',
        type: 'tournament',
        category: 'tournaments',
        stats: '234 participants • 48 hours remaining',
        icon: '🏆'
      },
      {
        id: 5,
        title: 'Tehran',
        description: 'Capital territory with strong defenses',
        type: 'territory',
        category: 'territories',
        stats: 'Defense: 2,500 • Iran controlled',
        icon: '🕌'
      }
    ];

    return allResults.filter(result => {
      const matchesQuery = !query.trim() || 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = category === 'all' || result.category === category;
      
      return matchesQuery && matchesCategory;
    });
  };

  // Get active filters
  const getActiveFilters = () => {
    // Return active search filters
    return {
      level: { min: 1, max: 50 },
      rarity: ['common', 'rare', 'epic', 'legendary', 'mythic'],
      faction: ['iran', 'usa'],
      status: ['active', 'completed', 'upcoming']
    };
  };

  // Get sort option
  const getSortOption = () => {
    return 'relevance'; // Default sort by relevance
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    generateSuggestions(query);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      performSearch(query, searchCategory);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSearchCategory(category);
    performSearch(searchQuery, category);
  };

  // Handle search history click
  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    performSearch(query, searchCategory);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    performSearch(suggestion, searchCategory);
    setSuggestions([]);
  };

  // Handle result click
  const handleResultClick = (result) => {
    hapticFeedback('impact');
    toast.info(`Opening ${result.title}...`);
    
    // Navigate to appropriate page based on result type
    switch (result.type) {
      case 'player':
        // Navigate to player profile
        break;
      case 'weapon':
        // Navigate to weapon details
        break;
      case 'guild':
        // Navigate to guild page
        break;
      case 'tournament':
        // Navigate to tournament page
        break;
      case 'territory':
        // Navigate to territory page
        break;
      default:
        break;
    }
  };

  return (
    <Container>
      <Title>🔍 Global Search</Title>
      
      <SearchContainer>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search weapons, players, guilds, tournaments, territories..."
          autoFocus
        />
        
        <FilterContainer>
          {searchCategories.map(category => (
            <FilterButton
              key={category.id}
              className={searchCategory === category.id ? 'active' : ''}
              onClick={() => handleCategoryChange(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon} {category.label}
            </FilterButton>
          ))}
        </FilterContainer>
      </SearchContainer>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <CardContainer>
          <ModularCard>
            <CardHeader>
              <CardIcon>💡</CardIcon>
              <CardTitle>Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.map(suggestion => (
                <SearchItem
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ItemIcon>🔍</ItemIcon>
                  <ItemInfo>
                    <ItemTitle>{suggestion}</ItemTitle>
                    <ItemDescription>Click to search</ItemDescription>
                  </ItemInfo>
                </SearchItem>
              ))}
            </CardContent>
          </ModularCard>
        </CardContainer>
      )}

      {/* Search Results */}
      <CardContainer>
        <ModularCard>
          <CardHeader>
            <CardIcon>🔍</CardIcon>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner>⏳</LoadingSpinner>
            ) : searchResults.length > 0 ? (
              <SearchResults>
                {searchResults.map(result => (
                  <SearchItem
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ItemIcon>{result.icon}</ItemIcon>
                    <ItemInfo>
                      <ItemTitle>{result.title}</ItemTitle>
                      <ItemDescription>{result.description}</ItemDescription>
                      <ItemMeta>
                        <ItemType type={result.type}>
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </ItemType>
                        <ItemStats>{result.stats}</ItemStats>
                      </ItemMeta>
                    </ItemInfo>
                  </SearchItem>
                ))}
              </SearchResults>
            ) : searchQuery.trim() ? (
              <NoResults>
                No results found for "{searchQuery}"
              </NoResults>
            ) : (
              <NoResults>
                Enter a search query to find weapons, players, guilds, tournaments, or territories
              </NoResults>
            )}
          </CardContent>
        </ModularCard>
      </CardContainer>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <CardContainer>
          <ModularCard>
            <CardHeader>
              <CardIcon>📜</CardIcon>
              <CardTitle>Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              {searchHistory.map((query, index) => (
                <SearchItem
                  key={index}
                  onClick={() => handleHistoryClick(query)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ItemIcon>🔍</ItemIcon>
                  <ItemInfo>
                    <ItemTitle>{query}</ItemTitle>
                    <ItemDescription>Click to search again</ItemDescription>
                  </ItemInfo>
                </SearchItem>
              ))}
            </CardContent>
          </ModularCard>
        </CardContainer>
      )}
    </Container>
  );
};

export default GlobalSearch;
