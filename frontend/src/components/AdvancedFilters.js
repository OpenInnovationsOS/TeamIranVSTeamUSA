// Advanced Filtering System - Multi-Criteria Filtering
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
  background: linear-gradient(45deg, #845ef7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FilterContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const FilterCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(132, 94, 247, 0.3);
  }
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const FilterIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const FilterTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const FilterContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const RangeSlider = styled.div`
  margin-bottom: 16px;
`;

const RangeLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
`;

const RangeInput = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #845ef7, #c084fc);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 10px rgba(132, 94, 247, 0.5);
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #845ef7, #c084fc);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 10px rgba(132, 94, 247, 0.5);
    }
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #ffffff;
  }
`;

const CheckboxInput = styled.input`
  margin-right: 8px;
  width: 18px;
  height: 18px;
  accent-color: #845ef7;
  cursor: pointer;
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #845ef7;
    box-shadow: 0 0 10px rgba(132, 94, 247, 0.3);
  }
  
  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #845ef7, #c084fc);
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
    box-shadow: 0 4px 12px rgba(132, 94, 247, 0.3);
  }
`;

const ClearButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }
`;

const PresetContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const PresetButton = styled(motion.button)`
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
    box-shadow: 0 4px 12px rgba(132, 94, 247, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #845ef7, #c084fc);
    color: #ffffff;
    border-color: transparent;
  }
`;

const FilterSummary = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
`;

const AdvancedFilters = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 100000 },
    level: { min: 1, max: 50 },
    rarity: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    faction: ['iran', 'usa'],
    category: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
    sortBy: 'relevance',
    status: ['active', 'completed', 'upcoming'],
    attackPower: { min: 0, max: 100 },
    defensePower: { min: 0, max: 100 },
    accuracy: { min: 0, max: 100 },
    range: { min: 0, max: 100 }
  });
  const [activePreset, setActivePreset] = useState('all');
  const [filterCount, setFilterCount] = useState(0);

  const filterPresets = [
    { id: 'all', name: 'All Items', icon: '🔍' },
    { id: 'weapons', name: 'Weapons Only', icon: '⚔️' },
    { id: 'armor', name: 'Armor Only', icon: '🛡️' },
    { id: 'legendary', name: 'Legendary Only', icon: '⭐' },
    { id: 'budget', name: 'Budget Friendly', icon: '💰' },
    { id: 'high-end', name: 'High End', icon: '💎' },
    { id: 'balanced', name: 'Balanced Stats', icon: '⚖️' },
    { id: 'offensive', name: 'Offensive', icon: '⚔️' },
    { id: 'defensive', name: 'Defensive', icon: '🛡️' }
  ];

  // WebSocket for real-time filter updates
  useWebSocketBattle({
    onFilterUpdate: (data) => {
      if (data.type === 'FILTER_UPDATE') {
        setFilters(prev => ({ ...prev, ...data.updates }));
      }
    }
  });

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    
    // Count active filters
    if (filters.priceRange.min > 0 || filters.priceRange.max < 100000) count++;
    if (filters.level.min > 1 || filters.level.max < 50) count++;
    if (filters.rarity.length < 5) count++;
    if (filters.faction.length < 2) count++;
    if (filters.category.length < 5) count++;
    if (filters.status.length < 3) count++;
    if (filters.attackPower.min > 0 || filters.attackPower.max < 100) count++;
    if (filters.defensePower.min > 0 || filters.defensePower.max < 100) count++;
    if (filters.accuracy.min > 0 || filters.accuracy.max < 100) count++;
    if (filters.range.min > 0 || filters.range.max < 100) count++;
    
    setFilterCount(count);
  }, [filters]);

  // Handle range change
  const handleRangeChange = (filterType, value, isMin = false) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [isMin ? 'min' : 'max']: value
      }
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  // Handle select change
  const handleSelectChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Apply preset
  const applyPreset = (presetId) => {
    setActivePreset(presetId);
    hapticFeedback('impact');

    switch (presetId) {
      case 'weapons':
        setFilters(prev => ({
          ...prev,
          category: ['tanks', 'missiles', 'drones', 'warships', 'aircraft']
        }));
        break;
      case 'armor':
        setFilters(prev => ({
          ...prev,
          category: ['shields', 'armor', 'helmets']
        }));
        break;
      case 'legendary':
        setFilters(prev => ({
          ...prev,
          rarity: ['legendary', 'mythic']
        }));
        break;
      case 'budget':
        setFilters(prev => ({
          ...prev,
          priceRange: { min: 0, max: 5000 }
        }));
        break;
      case 'high-end':
        setFilters(prev => ({
          ...prev,
          priceRange: { min: 10000, max: 100000 },
          rarity: ['epic', 'legendary', 'mythic']
        }));
        break;
      case 'balanced':
        setFilters(prev => ({
          ...prev,
          attackPower: { min: 40, max: 60 },
          defensePower: { min: 40, max: 60 }
        }));
        break;
      case 'offensive':
        setFilters(prev => ({
          ...prev,
          attackPower: { min: 70, max: 100 },
          defensePower: { min: 0, max: 30 }
        }));
        break;
      case 'defensive':
        setFilters(prev => ({
          ...prev,
          attackPower: { min: 0, max: 30 },
          defensePower: { min: 70, max: 100 }
        }));
        break;
      default:
        // Reset to all
        setFilters({
          priceRange: { min: 0, max: 100000 },
          level: { min: 1, max: 50 },
          rarity: ['common', 'rare', 'epic', 'legendary', 'mythic'],
          faction: ['iran', 'usa'],
          category: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
          sortBy: 'relevance',
          status: ['active', 'completed', 'upcoming'],
          attackPower: { min: 0, max: 100 },
          defensePower: { min: 0, max: 100 },
          accuracy: { min: 0, max: 100 },
          range: { min: 0, max: 100 }
        });
        break;
    }
  };

  // Apply filters
  const applyFilters = () => {
    hapticFeedback('success');
    toast.success('🔍 Filters applied successfully!');
    
    // Send filters to backend
    fetch(`${API_CONFIG.baseURL}/api/filters/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'x-user-id': user?.id || 'player123'
      },
      body: JSON.stringify({
        filters: filters,
        userId: user?.id
      })
    }).catch(error => {
      console.error('Failed to apply filters:', error);
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    hapticFeedback('impact');
    setActivePreset('all');
    setFilters({
      priceRange: { min: 0, max: 100000 },
      level: { min: 1, max: 50 },
      rarity: ['common', 'rare', 'epic', 'legendary', 'mythic'],
      faction: ['iran', 'usa'],
      category: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
      sortBy: 'relevance',
      status: ['active', 'completed', 'upcoming'],
      attackPower: { min: 0, max: 100 },
      defensePower: { min: 0, max: 100 },
      accuracy: { min: 0, max: 100 },
      range: { min: 0, max: 100 }
    });
    toast.success('🔄 Filters cleared!');
  };

  return (
    <Container>
      <Title>🔍 Advanced Filters</Title>
      
      <FilterSummary>
        <strong>{filterCount}</strong> active filters applied
      </FilterSummary>

      <PresetContainer>
        {filterPresets.map(preset => (
          <PresetButton
            key={preset.id}
            className={activePreset === preset.id ? 'active' : ''}
            onClick={() => applyPreset(preset.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {preset.icon} {preset.name}
          </PresetButton>
        ))}
      </PresetContainer>

      <FilterContainer>
        {/* Price Range Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FilterHeader>
            <FilterIcon>💰</FilterIcon>
            <FilterTitle>Price Range</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <RangeSlider>
              <RangeLabel>
                <span>Min: {filters.priceRange.min.toLocaleString()} STG</span>
                <span>Max: {filters.priceRange.max.toLocaleString()} STG</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="0"
                max="100000"
                value={filters.priceRange.min}
                onChange={(e) => handleRangeChange('priceRange', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="0"
                max="100000"
                value={filters.priceRange.max}
                onChange={(e) => handleRangeChange('priceRange', parseInt(e.target.value), false)}
              />
            </RangeSlider>
          </FilterContent>
        </FilterCard>

        {/* Level Range Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FilterHeader>
            <FilterIcon>⭐</FilterIcon>
            <FilterTitle>Level Range</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <RangeSlider>
              <RangeLabel>
                <span>Min: {filters.level.min}</span>
                <span>Max: {filters.level.max}</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="1"
                max="50"
                value={filters.level.min}
                onChange={(e) => handleRangeChange('level', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="1"
                max="50"
                value={filters.level.max}
                onChange={(e) => handleRangeChange('level', parseInt(e.target.value), false)}
              />
            </RangeSlider>
          </FilterContent>
        </FilterCard>

        {/* Rarity Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FilterHeader>
            <FilterIcon>💎</FilterIcon>
            <FilterTitle>Rarity</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <CheckboxGroup>
              {['common', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => (
                <CheckboxLabel key={rarity}>
                  <CheckboxInput
                    type="checkbox"
                    checked={filters.rarity.includes(rarity)}
                    onChange={() => handleCheckboxChange('rarity', rarity)}
                  />
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          </FilterContent>
        </FilterCard>

        {/* Faction Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FilterHeader>
            <FilterIcon>🏴</FilterIcon>
            <FilterTitle>Faction</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <CheckboxGroup>
              {['iran', 'usa'].map(faction => (
                <CheckboxLabel key={faction}>
                  <CheckboxInput
                    type="checkbox"
                    checked={filters.faction.includes(faction)}
                    onChange={() => handleCheckboxChange('faction', faction)}
                  />
                  {faction.charAt(0).toUpperCase() + faction.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          </FilterContent>
        </FilterCard>

        {/* Category Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <FilterHeader>
            <FilterIcon>📦</FilterIcon>
            <FilterTitle>Category</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <CheckboxGroup>
              {['tanks', 'missiles', 'drones', 'warships', 'aircraft'].map(category => (
                <CheckboxLabel key={category}>
                  <CheckboxInput
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => handleCheckboxChange('category', category)}
                  />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          </FilterContent>
        </FilterCard>

        {/* Sort By Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FilterHeader>
            <FilterIcon>📊</FilterIcon>
            <FilterTitle>Sort By</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <SelectInput
              value={filters.sortBy}
              onChange={(e) => handleSelectChange('sortBy', e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="level-low">Level: Low to High</option>
              <option value="level-high">Level: High to Low</option>
              <option value="attack">Attack Power</option>
              <option value="defense">Defense Power</option>
              <option value="accuracy">Accuracy</option>
              <option value="range">Range</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </SelectInput>
          </FilterContent>
        </FilterCard>

        {/* Status Filter */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <FilterHeader>
            <FilterIcon>📈</FilterIcon>
            <FilterTitle>Status</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <CheckboxGroup>
              {['active', 'completed', 'upcoming'].map(status => (
                <CheckboxLabel key={status}>
                  <CheckboxInput
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => handleCheckboxChange('status', status)}
                  />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          </FilterContent>
        </FilterCard>

        {/* Combat Stats Filters */}
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <FilterHeader>
            <FilterIcon>⚔️</FilterIcon>
            <FilterTitle>Combat Stats</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <RangeSlider>
              <RangeLabel>
                <span>Attack: {filters.attackPower.min}%</span>
                <span>Max: {filters.attackPower.max}%</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.attackPower.min}
                onChange={(e) => handleRangeChange('attackPower', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.attackPower.max}
                onChange={(e) => handleRangeChange('attackPower', parseInt(e.target.value), false)}
              />
            </RangeSlider>
            
            <RangeSlider>
              <RangeLabel>
                <span>Defense: {filters.defensePower.min}%</span>
                <span>Max: {filters.defensePower.max}%</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.defensePower.min}
                onChange={(e) => handleRangeChange('defensePower', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.defensePower.max}
                onChange={(e) => handleRangeChange('defensePower', parseInt(e.target.value), false)}
              />
            </RangeSlider>
            
            <RangeSlider>
              <RangeLabel>
                <span>Accuracy: {filters.accuracy.min}%</span>
                <span>Max: {filters.accuracy.max}%</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.accuracy.min}
                onChange={(e) => handleRangeChange('accuracy', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.accuracy.max}
                onChange={(e) => handleRangeChange('accuracy', parseInt(e.target.value), false)}
              />
            </RangeSlider>
            
            <RangeSlider>
              <RangeLabel>
                <span>Range: {filters.range.min}%</span>
                <span>Max: {filters.range.max}%</span>
              </RangeLabel>
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.range.min}
                onChange={(e) => handleRangeChange('range', parseInt(e.target.value), true)}
              />
              <RangeInput
                type="range"
                min="0"
                max="100"
                value={filters.range.max}
                onChange={(e) => handleRangeChange('range', parseInt(e.target.value), false)}
              />
            </RangeSlider>
          </FilterContent>
        </FilterCard>
      </FilterContainer>

      {/* Action Buttons */}
      <FilterContainer>
        <FilterCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <FilterHeader>
            <FilterIcon>⚡</FilterIcon>
            <FilterTitle>Actions</FilterTitle>
          </FilterHeader>
          <FilterContent>
            <ActionButton
              onClick={applyFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Apply Filters
            </ActionButton>
            <ClearButton
              onClick={clearAllFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All Filters
            </ClearButton>
          </FilterContent>
        </FilterCard>
      </FilterContainer>
    </Container>
  );
};

export default AdvancedFilters;
