/**
 * Comprehensive Military Weapons Database
 * 18 weapons across 5 categories with detailed stats and faction bonuses
 */

export const WEAPONS = {
  // TANKS
  abrams_m1a2: {
    id: 'abrams_m1a2',
    name: 'Abrams M1A2',
    category: 'tanks',
    faction: 'usa',
    attack: 25,
    defense: 20,
    critical: 0.08,
    levelRequirement: 10,
    price: 25000,
    description: 'Advanced American main battle tank with superior firepower',
    icon: '🚗',
    rarity: 'legendary',
    bonuses: {
      usa: 1.4,
      iran: 0.9
    },
    specialAbility: 'armor_piercing',
    terrainEffectiveness: {
      urban: 1.1,
      desert: 0.9,
      mountain: 0.6,
      coastal: 0.8,
      industrial: 1.0
    }
  },
  
  t90m: {
    id: 't90m',
    name: 'T-90M',
    category: 'tanks',
    faction: 'iran',
    attack: 22,
    defense: 25,
    critical: 0.06,
    levelRequirement: 10,
    price: 22000,
    description: 'Modern Russian main battle tank with excellent armor',
    icon: '🚙',
    rarity: 'legendary',
    bonuses: {
      iran: 1.4,
      usa: 0.9
    },
    specialAbility: 'reactive_armor',
    terrainEffectiveness: {
      urban: 1.1,
      desert: 0.9,
      mountain: 0.6,
      coastal: 0.8,
      industrial: 1.0
    }
  },
  
  merkava_mk4: {
    id: 'merkava_mk4',
    name: 'Merkava Mk.4',
    category: 'tanks',
    faction: 'neutral',
    attack: 23,
    defense: 23,
    critical: 0.07,
    levelRequirement: 10,
    price: 24000,
    description: 'Israeli main battle tank with balanced capabilities',
    icon: '🚕',
    rarity: 'legendary',
    bonuses: {
      iran: 1.2,
      usa: 1.2
    },
    specialAbility: 'troop_transport',
    terrainEffectiveness: {
      urban: 1.1,
      desert: 0.9,
      mountain: 0.6,
      coastal: 0.8,
      industrial: 1.0
    }
  },
  
  // MISSILES
  patriot_pac3: {
    id: 'patriot_pac3',
    name: 'Patriot PAC-3',
    category: 'missiles',
    faction: 'usa',
    attack: 35,
    defense: 5,
    critical: 0.15,
    levelRequirement: 12,
    price: 35000,
    description: 'Advanced American air defense missile system',
    icon: '🚀',
    rarity: 'epic',
    bonuses: {
      usa: 1.4,
      iran: 0.8
    },
    specialAbility: 'interception',
    terrainEffectiveness: {
      urban: 0.7,
      desert: 1.0,
      mountain: 1.2,
      coastal: 1.1,
      industrial: 1.2
    }
  },
  
  s400_triumf: {
    id: 's400_triumf',
    name: 'S-400 Triumf',
    category: 'missiles',
    faction: 'iran',
    attack: 32,
    defense: 8,
    critical: 0.12,
    levelRequirement: 12,
    price: 32000,
    description: 'Russian long-range surface-to-air missile system',
    icon: '🛸',
    rarity: 'epic',
    bonuses: {
      iran: 1.4,
      usa: 0.8
    },
    specialAbility: 'long_range',
    terrainEffectiveness: {
      urban: 0.7,
      desert: 1.0,
      mountain: 1.2,
      coastal: 1.1,
      industrial: 1.2
    }
  },
  
  tomahawk: {
    id: 'tomahawk',
    name: 'Tomahawk',
    category: 'missiles',
    faction: 'usa',
    attack: 30,
    defense: 3,
    critical: 0.18,
    levelRequirement: 12,
    price: 30000,
    description: 'American cruise missile with precision strike capability',
    icon: '💣',
    rarity: 'epic',
    bonuses: {
      usa: 1.3,
      iran: 0.8
    },
    specialAbility: 'precision_strike',
    terrainEffectiveness: {
      urban: 0.7,
      desert: 1.0,
      mountain: 1.2,
      coastal: 1.1,
      industrial: 1.2
    }
  },
  
  // DRONES
  mq9_reaper: {
    id: 'mq9_reaper',
    name: 'MQ-9 Reaper',
    category: 'drones',
    faction: 'usa',
    attack: 18,
    defense: 8,
    critical: 0.10,
    levelRequirement: 8,
    price: 15000,
    description: 'American unmanned combat aerial vehicle',
    icon: '🛩️',
    rarity: 'rare',
    bonuses: {
      usa: 1.3,
      iran: 0.9
    },
    specialAbility: 'surveillance',
    terrainEffectiveness: {
      urban: 1.2,
      desert: 1.1,
      mountain: 0.9,
      coastal: 1.0,
      industrial: 1.1
    }
  },
  
  shahed_136: {
    id: 'shahed_136',
    name: 'Shahed-136',
    category: 'drones',
    faction: 'iran',
    attack: 15,
    defense: 12,
    critical: 0.08,
    levelRequirement: 8,
    price: 12000,
    description: 'Iranian loitering munition drone',
    icon: '🦅',
    rarity: 'rare',
    bonuses: {
      iran: 1.3,
      usa: 0.9
    },
    specialAbility: 'kamikaze',
    terrainEffectiveness: {
      urban: 1.2,
      desert: 1.1,
      mountain: 0.9,
      coastal: 1.0,
      industrial: 1.1
    }
  },
  
  bayraktar_tb2: {
    id: 'bayraktar_tb2',
    name: 'Bayraktar TB2',
    category: 'drones',
    faction: 'neutral',
    attack: 16,
    defense: 10,
    critical: 0.09,
    levelRequirement: 8,
    price: 13000,
    description: 'Turkish armed unmanned aerial vehicle',
    icon: '🪂',
    rarity: 'rare',
    bonuses: {
      iran: 1.2,
      usa: 1.2
    },
    specialAbility: 'tactical_strike',
    terrainEffectiveness: {
      urban: 1.2,
      desert: 1.1,
      mountain: 0.9,
      coastal: 1.0,
      industrial: 1.1
    }
  },
  
  // WARSHIPS
  uss_ford: {
    id: 'uss_ford',
    name: 'USS Ford',
    category: 'warships',
    faction: 'usa',
    attack: 28,
    defense: 22,
    critical: 0.05,
    levelRequirement: 15,
    price: 45000,
    description: 'American nuclear-powered aircraft carrier',
    icon: '⚓',
    rarity: 'legendary',
    bonuses: {
      usa: 1.4,
      iran: 0.7
    },
    specialAbility: 'air_wing',
    terrainEffectiveness: {
      urban: 0.3,
      desert: 0.2,
      mountain: 0.2,
      coastal: 1.3,
      industrial: 0.4
    }
  },
  
  uss_burke: {
    id: 'uss_burke',
    name: 'USS Burke',
    category: 'warships',
    faction: 'usa',
    attack: 25,
    defense: 20,
    critical: 0.06,
    levelRequirement: 15,
    price: 40000,
    description: 'American guided-missile destroyer',
    icon: '🚢',
    rarity: 'epic',
    bonuses: {
      usa: 1.3,
      iran: 0.7
    },
    specialAbility: 'aegis',
    terrainEffectiveness: {
      urban: 0.3,
      desert: 0.2,
      mountain: 0.2,
      coastal: 1.3,
      industrial: 0.4
    }
  },
  
  sahand: {
    id: 'sahand',
    name: 'Sahand',
    category: 'warships',
    faction: 'iran',
    attack: 22,
    defense: 25,
    critical: 0.04,
    levelRequirement: 15,
    price: 38000,
    description: 'Iranian guided-missile destroyer',
    icon: '🛥️',
    rarity: 'epic',
    bonuses: {
      iran: 1.3,
      usa: 0.7
    },
    specialAbility: 'stealth',
    terrainEffectiveness: {
      urban: 0.3,
      desert: 0.2,
      mountain: 0.2,
      coastal: 1.3,
      industrial: 0.4
    }
  },
  
  // AIRCRAFT
  f35_lightning: {
    id: 'f35_lightning',
    name: 'F-35 Lightning II',
    category: 'aircraft',
    faction: 'usa',
    attack: 40,
    defense: 15,
    critical: 0.20,
    levelRequirement: 15,
    price: 60000,
    description: 'American 5th generation stealth fighter',
    icon: '✈️',
    rarity: 'legendary',
    bonuses: {
      usa: 1.4,
      iran: 0.8
    },
    specialAbility: 'stealth_mode',
    terrainEffectiveness: {
      urban: 0.8,
      desert: 1.2,
      mountain: 1.1,
      coastal: 1.0,
      industrial: 0.9
    }
  },
  
  su57_felon: {
    id: 'su57_felon',
    name: 'Su-57 Felon',
    category: 'aircraft',
    faction: 'iran',
    attack: 38,
    defense: 18,
    critical: 0.18,
    levelRequirement: 15,
    price: 58000,
    description: 'Russian 5th generation stealth fighter',
    icon: '🛫',
    rarity: 'legendary',
    bonuses: {
      iran: 1.4,
      usa: 0.8
    },
    specialAbility: 'supermaneuverability',
    terrainEffectiveness: {
      urban: 0.8,
      desert: 1.2,
      mountain: 1.1,
      coastal: 1.0,
      industrial: 0.9
    }
  },
  
  f22_raptor: {
    id: 'f22_raptor',
    name: 'F-22 Raptor',
    category: 'aircraft',
    faction: 'usa',
    attack: 42,
    defense: 12,
    critical: 0.22,
    levelRequirement: 15,
    price: 65000,
    description: 'American air superiority stealth fighter',
    icon: '🛬',
    rarity: 'legendary',
    bonuses: {
      usa: 1.4,
      iran: 0.8
    },
    specialAbility: 'air_dominance',
    terrainEffectiveness: {
      urban: 0.8,
      desert: 1.2,
      mountain: 1.1,
      coastal: 1.0,
      industrial: 0.9
    }
  },
  
  mig35: {
    id: 'mig35',
    name: 'MiG-35',
    category: 'aircraft',
    faction: 'iran',
    attack: 35,
    defense: 20,
    critical: 0.15,
    levelRequirement: 15,
    price: 55000,
    description: 'Russian multirole fighter aircraft',
    icon: '🛩',
    rarity: 'epic',
    bonuses: {
      iran: 1.3,
      usa: 0.8
    },
    specialAbility: 'vector_thrust',
    terrainEffectiveness: {
      urban: 0.8,
      desert: 1.2,
      mountain: 1.1,
      coastal: 1.0,
      industrial: 0.9
    }
  },
  
  ah64_apache: {
    id: 'ah64_apache',
    name: 'AH-64 Apache',
    category: 'aircraft',
    faction: 'usa',
    attack: 20,
    defense: 15,
    critical: 0.12,
    levelRequirement: 6,
    price: 8500,
    description: 'American attack helicopter',
    icon: '🚁',
    rarity: 'common',
    bonuses: {
      usa: 1.3,
      iran: 0.9
    },
    specialAbility: 'tank_destroyer',
    terrainEffectiveness: {
      urban: 1.0,
      desert: 1.2,
      mountain: 0.9,
      coastal: 1.0,
      industrial: 1.0
    }
  },
  
  mi28_havoc: {
    id: 'mi28_havoc',
    name: 'Mi-28 Havoc',
    category: 'aircraft',
    faction: 'iran',
    attack: 18,
    defense: 18,
    critical: 0.10,
    levelRequirement: 6,
    price: 8000,
    description: 'Russian attack helicopter',
    icon: '🐉',
    rarity: 'common',
    bonuses: {
      iran: 1.3,
      usa: 0.9
    },
    specialAbility: 'night_hunter',
    terrainEffectiveness: {
      urban: 1.0,
      desert: 1.2,
      mountain: 0.9,
      coastal: 1.0,
      industrial: 1.0
    }
  }
};

// Weapon categories for filtering
export const WEAPON_CATEGORIES = {
  tanks: {
    name: 'Tanks',
    icon: '🚗',
    description: 'Heavy armored vehicles with high defense'
  },
  missiles: {
    name: 'Missiles',
    icon: '🚀',
    description: 'Long-range precision weapons'
  },
  drones: {
    name: 'Drones',
    icon: '🛩️',
    description: 'Unmanned aerial vehicles'
  },
  warships: {
    name: 'Warships',
    icon: '⚓',
    description: 'Naval vessels with coastal superiority'
  },
  aircraft: {
    name: 'Aircraft',
    icon: '✈️',
    description: 'Fixed-wing aircraft and helicopters'
  }
};

// Rarity levels
export const RARITY_LEVELS = {
  common: { color: '#808080', name: 'Common' },
  rare: { color: '#0080ff', name: 'Rare' },
  epic: { color: '#800080', name: 'Epic' },
  legendary: { color: '#ff8000', name: 'Legendary' }
};

// Helper functions
export const getWeaponsByCategory = (category) => {
  return Object.values(WEAPONS).filter(weapon => weapon.category === category);
};

export const getWeaponsByLevel = (level) => {
  return Object.values(WEAPONS).filter(weapon => weapon.levelRequirement <= level);
};

export const getWeaponsByFaction = (faction) => {
  return Object.values(WEAPONS).filter(weapon => 
    weapon.faction === faction || weapon.faction === 'neutral'
  );
};

export const getWeaponById = (id) => {
  return WEAPONS[id];
};

export const getAffordableWeapons = (balance, level) => {
  return Object.values(WEAPONS).filter(weapon => 
    weapon.price <= balance && weapon.levelRequirement <= level
  );
};
