/**
 * Enhanced Battle Calculation System
 * Implements strategic depth with faction bonuses, terrain advantages, and weapon synergy
 */

// Faction-specific bonuses
const FACTION_BONUSES = {
  iran: {
    attackBonus: 0, // Iran focuses on defense
    defenseBonus: 0.2, // +20% defense
    specialAbility: 'desert_storm',
    territories: ['tehran', 'isfahan', 'mashhad']
  },
  usa: {
    attackBonus: 0.2, // +20% attack
    defenseBonus: 0, // USA focuses on offense
    specialAbility: 'air_strike',
    territories: ['new_york', 'los_angeles', 'chicago']
  }
};

// Terrain-specific bonuses
const TERRAIN_BONUSES = {
  tehran: { attack: 5, defense: 10, experience: 1.2, terrain: 'urban' },
  new_york: { attack: 10, defense: 5, experience: 1.2, terrain: 'urban' },
  los_angeles: { attack: 8, defense: 7, experience: 1.1, terrain: 'coastal' },
  isfahan: { attack: 3, defense: 12, experience: 1.3, terrain: 'desert' },
  chicago: { attack: 12, defense: 4, experience: 1.1, terrain: 'industrial' },
  mashhad: { attack: 4, defense: 11, experience: 1.2, terrain: 'mountain' }
};

// Weapon type effectiveness against terrain
const WEAPON_TERRAIN_EFFECTIVENESS = {
  desert: {
    tanks: 0.9, // Tanks struggle in sand
    aircraft: 1.2, // Air superiority in desert
    drones: 1.1, // Good visibility
    missiles: 1.0, // Normal effectiveness
    warships: 0.5 // No naval in desert
  },
  urban: {
    tanks: 1.1, // Good in cities
    aircraft: 0.8, // Hard to target
    drones: 1.2, // Urban warfare
    missiles: 0.7, // Risk of collateral
    warships: 0.3 // Limited naval
  },
  mountain: {
    tanks: 0.6, // Difficult terrain
    aircraft: 1.1, // Air control
    drones: 0.9, // Windy conditions
    missiles: 1.2, // Mountain targeting
    warships: 0.2 // No naval
  },
  coastal: {
    tanks: 0.8, // Beach landings
    aircraft: 1.0, // Normal
    drones: 1.0, // Normal
    missiles: 1.1, // Coastal defense
    warships: 1.3 // Naval superiority
  },
  industrial: {
    tanks: 1.0, // Normal
    aircraft: 0.9, // Smoke/cover
    drones: 1.1, // Surveillance
    missiles: 1.2, // Strategic targets
    warships: 0.4 // Limited naval
  }
};

/**
 * Calculate comprehensive battle damage with all modifiers
 */
export const calculateBattleDamage = (attacker, defender, weapon, territory, isDefending = false) => {
  // Base damage calculation
  const baseDamage = (attacker.level * 10) + Math.random() * 20;
  
  // Weapon stats
  const weaponDamage = weapon.attack || 10;
  const weaponDefense = weapon.defense || 5;
  const criticalChance = weapon.critical || 0.05;
  
  // Faction bonuses
  const attackerFactionBonus = getFactionBonus(attacker.faction);
  const defenderFactionBonus = getFactionBonus(defender.faction);
  
  // Territory bonuses
  const territoryBonus = getTerrainBonus(territory);
  const terrain = TERRAIN_BONUSES[territory]?.terrain || 'urban';
  
  // Weapon-terrain effectiveness
  const weaponType = weapon.type || 'tanks';
  const terrainEffectiveness = WEAPON_TERRAIN_EFFECTIVENESS[terrain]?.[weaponType] || 1.0;
  
  // Faction territory control bonus (50% bonus when controlling faction territory)
  const factionControlBonus = FACTION_BONUSES[attacker.faction]?.territories.includes(territory) ? 1.5 : 1.0;
  
  // Defense bonus if defending
  const defenseBonus = isDefending ? 1.2 : 1.0;
  
  // Critical hit calculation
  const isCritical = Math.random() < criticalChance;
  const criticalMultiplier = isCritical ? 1.5 : 1.0;
  
  // Final damage calculation
  const attackPower = baseDamage + weaponDamage;
  const defensePower = (defender.level * 5) + weaponDefense;
  
  let finalDamage = (attackPower - defensePower) * 
    (1 + attackerFactionBonus.attackBonus) * 
    (1 + territoryBonus.attack / 100) * 
    terrainEffectiveness * 
    factionControlBonus * 
    defenseBonus * 
    criticalMultiplier;
  
  // Ensure minimum damage
  finalDamage = Math.max(1, finalDamage);
  
  return {
    damage: Math.round(finalDamage),
    isCritical,
    terrainEffectiveness,
    factionControlBonus,
    territoryBonus: territoryBonus.attack,
    breakdown: {
      baseDamage: Math.round(baseDamage),
      weaponDamage,
      defensePower: Math.round(defensePower),
      factionBonus: attackerFactionBonus.attackBonus,
      terrainBonus: territoryBonus.attack,
      terrainEffectiveness: Math.round(terrainEffectiveness * 100) / 100,
      factionControlBonus: Math.round(factionControlBonus * 100) / 100,
      defenseBonus: Math.round(defenseBonus * 100) / 100,
      criticalMultiplier: Math.round(criticalMultiplier * 100) / 100
    }
  };
};

/**
 * Get faction-specific bonuses
 */
export const getFactionBonus = (faction) => {
  return FACTION_BONUSES[faction] || { attackBonus: 0, defenseBonus: 0 };
};

/**
 * Get territory-specific bonuses
 */
export const getTerrainBonus = (territory) => {
  return TERRAIN_BONUSES[territory] || { attack: 0, defense: 0, experience: 1.0 };
};

/**
 * Calculate battle rewards based on performance
 */
export const calculateBattleRewards = (winner, loser, wager, battleDuration, territory) => {
  const territoryBonus = getTerrainBonus(territory);
  const baseReward = wager * 2; // Winner gets double the wager
  
  // Time bonus (faster battles = better rewards)
  const timeBonus = battleDuration < 60000 ? 1.2 : 1.0; // 20% bonus for battles under 1 minute
  
  // Territory control bonus
  const territoryMultiplier = territoryBonus.experience;
  
  // Battle quality multiplier
  let qualityMultiplier = 1.0;
  const rewardRatio = baseReward / wager;
  if (rewardRatio >= 3) qualityMultiplier = 1.5; // Domination
  else if (rewardRatio >= 2.5) qualityMultiplier = 1.2; // Victory
  else if (rewardRatio >= 2) qualityMultiplier = 1.0; // Win
  else qualityMultiplier = 1.0; // Struggle
  
  const finalReward = Math.round(baseReward * timeBonus * territoryMultiplier * qualityMultiplier);
  const loserReward = Math.round(finalReward * 0.3); // Loser gets 30%
  
  return {
    winner: {
      stg: finalReward,
      xp: winner.level * 50 * territoryMultiplier,
      quality: getBattleQuality(rewardRatio)
    },
    loser: {
      stg: loserReward,
      xp: loser.level * 10 * territoryMultiplier
    },
    breakdown: {
      baseReward,
      timeBonus: Math.round(timeBonus * 100) / 100,
      territoryMultiplier: Math.round(territoryMultiplier * 100) / 100,
      qualityMultiplier: Math.round(qualityMultiplier * 100) / 100
    }
  };
};

/**
 * Get battle quality rating
 */
const getBattleQuality = (rewardRatio) => {
  if (rewardRatio >= 3) return 'Domination';
  if (rewardRatio >= 2.5) return 'Victory';
  if (rewardRatio >= 2) return 'Win';
  return 'Struggle';
};

/**
 * Calculate special ability effects
 */
export const calculateSpecialAbility = (faction, target) => {
  const factionBonus = FACTION_BONUSES[faction];
  
  switch (factionBonus?.specialAbility) {
    case 'desert_storm':
      return {
        name: 'Desert Storm',
        description: 'Reduces opponent accuracy by 30%',
        effect: { accuracyReduction: 0.3 },
        duration: 30000, // 30 seconds
        icon: '🌪️'
      };
      
    case 'air_strike':
      return {
        name: 'Air Strike',
        description: 'Guaranteed critical hit',
        effect: { guaranteedCritical: true },
        duration: 0, // Instant effect
        icon: '✈️'
      };
      
    default:
      return null;
  }
};

/**
 * Validate battle setup
 */
export const validateBattleSetup = (player, opponent, weapon, territory, wager) => {
  const errors = [];
  
  // Level difference validation
  if (Math.abs(player.level - opponent.level) > 5) {
    errors.push('Level difference too high (max 5 levels)');
  }
  
  // Weapon validation
  if (!weapon || player.level < weapon.levelRequirement) {
    errors.push('Weapon not available for your level');
  }
  
  // Wager validation
  if (wager < 100) {
    errors.push('Minimum wager is 100 STG');
  }
  if (wager > player.stg_balance) {
    errors.push('Insufficient STG balance');
  }
  
  // Territory validation
  if (!TERRAIN_BONUSES[territory]) {
    errors.push('Invalid territory selection');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Simulate battle outcome for preview
 */
export const simulateBattle = (attacker, defender, attackerWeapon, defenderWeapon, territory) => {
  const rounds = [];
  let attackerHealth = 100;
  let defenderHealth = 100;
  let currentRound = 1;
  
  while (attackerHealth > 0 && defenderHealth > 0 && currentRound <= 20) {
    // Attacker turn
    const attackerDamage = calculateBattleDamage(attacker, defender, attackerWeapon, territory, false);
    defenderHealth = Math.max(0, defenderHealth - attackerDamage.damage);
    
    rounds.push({
      round: currentRound,
      turn: 'attacker',
      damage: attackerDamage.damage,
      isCritical: attackerDamage.isCritical,
      remainingHealth: { attacker: attackerHealth, defender: defenderHealth }
    });
    
    if (defenderHealth <= 0) break;
    
    // Defender turn
    const defenderDamage = calculateBattleDamage(defender, attacker, defenderWeapon, territory, false);
    attackerHealth = Math.max(0, attackerHealth - defenderDamage.damage);
    
    rounds.push({
      round: currentRound,
      turn: 'defender',
      damage: defenderDamage.damage,
      isCritical: defenderDamage.isCritical,
      remainingHealth: { attacker: attackerHealth, defender: defenderHealth }
    });
    
    currentRound++;
  }
  
  return {
    winner: attackerHealth > 0 ? 'attacker' : 'defender',
    rounds,
    finalHealth: { attacker: attackerHealth, defender: defenderHealth },
    totalRounds: currentRound - 1
  };
};
