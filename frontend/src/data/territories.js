/**
 * Strategic Territories Database
 * 6 key locations with dynamic control and economic bonuses
 */

export const TERRITORIES = {
  tehran: {
    id: 'tehran',
    name: 'Tehran',
    faction: 'iran',
    terrain: 'urban',
    strategicValue: 10,
    attackBonus: 5,
    defenseBonus: 10,
    experienceMultiplier: 1.2,
    description: 'Capital of Iran with strong defensive positions',
    icon: '🏛️',
    flag: '🇮🇷',
    coordinates: { x: 300, y: 200 },
    adjacent: ['isfahan', 'mashhad'],
    economicBonus: {
      stgGeneration: 150,
      resourceMultiplier: 1.3
    },
    battleModifiers: {
      iran: { attack: 1.2, defense: 1.4 },
      usa: { attack: 0.8, defense: 0.9 }
    },
    weatherConditions: ['clear', 'sandstorm'],
    controlHistory: [
      { date: '2024-01-01', controller: 'iran', battleId: 'battle_001' }
    ]
  },
  
  new_york: {
    id: 'new_york',
    name: 'New York',
    faction: 'usa',
    terrain: 'urban',
    strategicValue: 10,
    attackBonus: 10,
    defenseBonus: 5,
    experienceMultiplier: 1.2,
    description: 'Major American economic and military center',
    icon: '🗽',
    flag: '🇺🇸',
    coordinates: { x: 100, y: 150 },
    adjacent: ['los_angeles', 'chicago'],
    economicBonus: {
      stgGeneration: 200,
      resourceMultiplier: 1.4
    },
    battleModifiers: {
      usa: { attack: 1.4, defense: 1.2 },
      iran: { attack: 0.9, defense: 0.8 }
    },
    weatherConditions: ['clear', 'fog', 'snow'],
    controlHistory: [
      { date: '2024-01-01', controller: 'usa', battleId: 'battle_002' }
    ]
  },
  
  los_angeles: {
    id: 'los_angeles',
    name: 'Los Angeles',
    faction: 'usa',
    terrain: 'coastal',
    strategicValue: 8,
    attackBonus: 8,
    defenseBonus: 7,
    experienceMultiplier: 1.1,
    description: 'Coastal American city with naval superiority',
    icon: '🌴',
    flag: '🇺🇸',
    coordinates: { x: 50, y: 200 },
    adjacent: ['new_york', 'chicago'],
    economicBonus: {
      stgGeneration: 120,
      resourceMultiplier: 1.2
    },
    battleModifiers: {
      usa: { attack: 1.3, defense: 1.3 },
      iran: { attack: 0.9, defense: 0.9 }
    },
    weatherConditions: ['clear', 'fog', 'rain'],
    controlHistory: [
      { date: '2024-01-01', controller: 'usa', battleId: 'battle_003' }
    ]
  },
  
  isfahan: {
    id: 'isfahan',
    name: 'Isfahan',
    faction: 'iran',
    terrain: 'desert',
    strategicValue: 7,
    attackBonus: 3,
    defenseBonus: 12,
    experienceMultiplier: 1.3,
    description: 'Desert city with exceptional defensive terrain',
    icon: '🏜️',
    flag: '🇮🇷',
    coordinates: { x: 320, y: 250 },
    adjacent: ['tehran', 'mashhad'],
    economicBonus: {
      stgGeneration: 100,
      resourceMultiplier: 1.5
    },
    battleModifiers: {
      iran: { attack: 1.1, defense: 1.5 },
      usa: { attack: 0.7, defense: 0.8 }
    },
    weatherConditions: ['clear', 'sandstorm', 'heatwave'],
    controlHistory: [
      { date: '2024-01-01', controller: 'iran', battleId: 'battle_004' }
    ]
  },
  
  chicago: {
    id: 'chicago',
    name: 'Chicago',
    faction: 'usa',
    terrain: 'industrial',
    strategicValue: 7,
    attackBonus: 12,
    defenseBonus: 4,
    experienceMultiplier: 1.1,
    description: 'Industrial heartland with production advantages',
    icon: '🏭',
    flag: '🇺🇸',
    coordinates: { x: 120, y: 170 },
    adjacent: ['new_york', 'los_angeles'],
    economicBonus: {
      stgGeneration: 110,
      resourceMultiplier: 1.3
    },
    battleModifiers: {
      usa: { attack: 1.5, defense: 1.1 },
      iran: { attack: 0.8, defense: 0.7 }
    },
    weatherConditions: ['clear', 'fog', 'snow'],
    controlHistory: [
      { date: '2024-01-01', controller: 'usa', battleId: 'battle_005' }
    ]
  },
  
  mashhad: {
    id: 'mashhad',
    name: 'Mashhad',
    faction: 'iran',
    terrain: 'mountain',
    strategicValue: 6,
    attackBonus: 4,
    defenseBonus: 11,
    experienceMultiplier: 1.2,
    description: 'Mountainous region with natural fortifications',
    icon: '⛰️',
    flag: '🇮🇷',
    coordinates: { x: 380, y: 180 },
    adjacent: ['tehran', 'isfahan'],
    economicBonus: {
      stgGeneration: 90,
      resourceMultiplier: 1.2
    },
    battleModifiers: {
      iran: { attack: 1.2, defense: 1.4 },
      usa: { attack: 0.8, defense: 0.8 }
    },
    weatherConditions: ['clear', 'snow', 'avalanche'],
    controlHistory: [
      { date: '2024-01-01', controller: 'iran', battleId: 'battle_006' }
    ]
  }
};

// Terrain types with their characteristics
export const TERRAIN_TYPES = {
  urban: {
    name: 'Urban',
    icon: '🏙️',
    description: 'City environments with cover and obstacles',
    weaponEffectiveness: {
      tanks: 1.1,
      aircraft: 0.8,
      drones: 1.2,
      missiles: 0.7,
      warships: 0.3
    },
    movementPenalty: 0.2,
    visibilityReduction: 0.3
  },
  
  desert: {
    name: 'Desert',
    icon: '🏜️',
    description: 'Open sandy terrain with limited cover',
    weaponEffectiveness: {
      tanks: 0.9,
      aircraft: 1.2,
      drones: 1.1,
      missiles: 1.0,
      warships: 0.5
    },
    movementPenalty: 0.3,
    visibilityReduction: 0.1
  },
  
  mountain: {
    name: 'Mountain',
    icon: '⛰️',
    description: 'High elevation with natural defenses',
    weaponEffectiveness: {
      tanks: 0.6,
      aircraft: 1.1,
      drones: 0.9,
      missiles: 1.2,
      warships: 0.2
    },
    movementPenalty: 0.5,
    visibilityReduction: 0.4
  },
  
  coastal: {
    name: 'Coastal',
    icon: '🌊',
    description: 'Shoreline environments with naval access',
    weaponEffectiveness: {
      tanks: 0.8,
      aircraft: 1.0,
      drones: 1.0,
      missiles: 1.1,
      warships: 1.3
    },
    movementPenalty: 0.1,
    visibilityReduction: 0.2
  },
  
  industrial: {
    name: 'Industrial',
    icon: '🏭',
    description: 'Manufacturing areas with strategic targets',
    weaponEffectiveness: {
      tanks: 1.0,
      aircraft: 0.9,
      drones: 1.1,
      missiles: 1.2,
      warships: 0.4
    },
    movementPenalty: 0.2,
    visibilityReduction: 0.3
  }
};

// Weather conditions
export const WEATHER_CONDITIONS = {
  clear: {
    name: 'Clear',
    icon: '☀️',
    effect: { visibility: 1.0, accuracy: 1.0 }
  },
  fog: {
    name: 'Fog',
    icon: '🌫️',
    effect: { visibility: 0.6, accuracy: 0.8 }
  },
  rain: {
    name: 'Rain',
    icon: '🌧️',
    effect: { visibility: 0.8, accuracy: 0.9 }
  },
  snow: {
    name: 'Snow',
    icon: '❄️',
    effect: { visibility: 0.7, accuracy: 0.8 }
  },
  sandstorm: {
    name: 'Sandstorm',
    icon: '🌪️',
    effect: { visibility: 0.4, accuracy: 0.6 }
  },
  heatwave: {
    name: 'Heatwave',
    icon: '🔥',
    effect: { visibility: 0.9, accuracy: 0.9 }
  },
  avalanche: {
    name: 'Avalanche',
    icon: '🏔️',
    effect: { visibility: 0.3, accuracy: 0.5 }
  }
};

// Helper functions
export const getTerritoryById = (id) => {
  return TERRITORIES[id];
};

export const getTerritoriesByFaction = (faction) => {
  return Object.values(TERRITORIES).filter(territory => territory.faction === faction);
};

export const getTerritoriesByTerrain = (terrain) => {
  return Object.values(TERRITORIES).filter(territory => territory.terrain === terrain);
};

export const getAdjacentTerritories = (territoryId) => {
  const territory = TERRITORIES[territoryId];
  return territory ? territory.adjacent.map(id => TERRITORIES[id]) : [];
};

export const calculateTerritoryControl = (faction) => {
  const factionTerritories = getTerritoriesByFaction(faction);
  const totalStrategicValue = factionTerritories.reduce((sum, territory) => 
    sum + territory.strategicValue, 0
  );
  const maxPossibleValue = Object.values(TERRITORIES).reduce((sum, territory) => 
    sum + territory.strategicValue, 0
  );
  
  return {
    territories: factionTerritories.length,
    totalStrategicValue,
    controlPercentage: Math.round((totalStrategicValue / maxPossibleValue) * 100),
    economicOutput: factionTerritories.reduce((sum, territory) => 
      sum + territory.economicBonus.stgGeneration, 0
    )
  };
};

export const getTerritoryBattlePreview = (territoryId, attackerFaction, defenderFaction) => {
  const territory = TERRITORIES[territoryId];
  if (!territory) return null;
  
  const attackerBonus = territory.battleModifiers[attackerFaction] || { attack: 1.0, defense: 1.0 };
  const defenderBonus = territory.battleModifiers[defenderFaction] || { attack: 1.0, defense: 1.0 };
  const terrain = TERRAIN_TYPES[territory.terrain];
  
  return {
    territory,
    attackerBonus,
    defenderBonus,
    terrain,
    homeAdvantage: territory.faction === attackerFaction ? 1.5 : 1.0,
    strategicImportance: territory.strategicValue
  };
};

export const simulateTerritoryBattle = (territoryId, attacker, defender, attackerWeapon, defenderWeapon) => {
  const preview = getTerritoryBattlePreview(territoryId, attacker.faction, defender.faction);
  if (!preview) return null;
  
  // Calculate battle outcome with territory bonuses
  const attackerPower = (attacker.level * 10 + attackerWeapon.attack) * 
    preview.attackerBonus.attack * preview.homeAdvantage;
  const defenderPower = (defender.level * 10 + defenderWeapon.defense) * 
    preview.defenderBonus.defense;
  
  const winProbability = attackerPower / (attackerPower + defenderPower);
  const attackerWins = Math.random() < winProbability;
  
  return {
    winner: attackerWins ? 'attacker' : 'defender',
    winProbability: Math.round(winProbability * 100),
    attackerPower: Math.round(attackerPower),
    defenderPower: Math.round(defenderPower),
    territoryControlChange: attackerWins && territory.faction !== attacker.faction,
    preview
  };
};
