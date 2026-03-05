const mongoose = require('mongoose');
const Weapon = require('../src/models/Weapon');
require('dotenv').config({ path: '.env.dev' });

const weaponExamples = [
  // IRAN PISTOLS
  {
    weapon_id: 'ir_pistol_01',
    name: 'Zulfikar',
    description: 'Standard Iranian sidearm with reliable performance',
    category: 'pistol',
    faction: 'iran',
    rarity: 'common',
    base_stats: {
      damage: 25,
      accuracy: 85,
      fire_rate: 180,
      range: 50,
      reload_speed: 2.0,
      magazine_size: 12
    },
    unlock_requirements: {
      level: 1,
      experience: 0,
      stg_tokens: 0,
      achievements: []
    },
    visual_effects: {
      animation_type: 'slide_up',
      animation_duration: 0.5,
      color_scheme: 'bronze',
      particle_effects: [
        { type: 'flash', intensity: 3 },
        { type: 'smoke', intensity: 2 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 5,
      boost_multipliers: {
        damage: 1.2,
        accuracy: 1.1,
        fire_rate: 1.15
      }
    },
    pricing: {
      base_price: 100,
      currency: 'STG',
      discount_tiers: [
        { quantity: 5, discount_percent: 10 },
        { quantity: 10, discount_percent: 20 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['pistol', 'sidearm', 'reliable'],
      popularity_score: 75
    }
  },
  {
    weapon_id: 'ir_pistol_02',
    name: 'Fateh',
    description: 'High-capacity Iranian pistol with improved accuracy',
    category: 'pistol',
    faction: 'iran',
    rarity: 'uncommon',
    base_stats: {
      damage: 30,
      accuracy: 88,
      fire_rate: 200,
      range: 55,
      reload_speed: 1.8,
      magazine_size: 15
    },
    unlock_requirements: {
      level: 5,
      experience: 500,
      stg_tokens: 50,
      achievements: ['first_kill']
    },
    visual_effects: {
      animation_type: 'fade_in',
      animation_duration: 0.6,
      color_scheme: 'silver',
      particle_effects: [
        { type: 'glow', intensity: 4 },
        { type: 'flash', intensity: 4 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 6,
      boost_multipliers: {
        damage: 1.25,
        accuracy: 1.12,
        fire_rate: 1.18
      }
    },
    pricing: {
      base_price: 250,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 15 },
        { quantity: 7, discount_percent: 25 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['pistol', 'high_capacity', 'accurate'],
      popularity_score: 82
    }
  },

  // USA PISTOLS
  {
    weapon_id: 'us_pistol_01',
    name: 'M1911',
    description: 'Classic American sidearm with heavy stopping power',
    category: 'pistol',
    faction: 'usa',
    rarity: 'common',
    base_stats: {
      damage: 35,
      accuracy: 82,
      fire_rate: 150,
      range: 60,
      reload_speed: 2.5,
      magazine_size: 7
    },
    unlock_requirements: {
      level: 1,
      experience: 0,
      stg_tokens: 0,
      achievements: []
    },
    visual_effects: {
      animation_type: 'bounce',
      animation_duration: 0.4,
      color_scheme: 'silver',
      particle_effects: [
        { type: 'flash', intensity: 5 },
        { type: 'smoke', intensity: 3 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 5,
      boost_multipliers: {
        damage: 1.3,
        accuracy: 1.08,
        fire_rate: 1.12
      }
    },
    pricing: {
      base_price: 120,
      currency: 'STG',
      discount_tiers: [
        { quantity: 5, discount_percent: 12 },
        { quantity: 10, discount_percent: 22 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['pistol', 'heavy', 'classic'],
      popularity_score: 78
    }
  },
  {
    weapon_id: 'us_pistol_02',
    name: 'Glock 19',
    description: 'Modern American pistol with excellent reliability',
    category: 'pistol',
    faction: 'usa',
    rarity: 'uncommon',
    base_stats: {
      damage: 28,
      accuracy: 90,
      fire_rate: 220,
      range: 52,
      reload_speed: 1.6,
      magazine_size: 17
    },
    unlock_requirements: {
      level: 4,
      experience: 400,
      stg_tokens: 40,
      achievements: ['accuracy_expert']
    },
    visual_effects: {
      animation_type: 'rotate_360',
      animation_duration: 0.7,
      color_scheme: 'blue',
      particle_effects: [
        { type: 'glow', intensity: 3 },
        { type: 'trail', intensity: 2 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 6,
      boost_multipliers: {
        damage: 1.22,
        accuracy: 1.15,
        fire_rate: 1.2
      }
    },
    pricing: {
      base_price: 280,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 18 },
        { quantity: 8, discount_percent: 28 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['pistol', 'modern', 'high_capacity'],
      popularity_score: 85
    }
  },

  // IRAN RIFLES
  {
    weapon_id: 'ir_rifle_01',
    name: 'KH-2002',
    description: 'Iranian assault rifle with balanced performance',
    category: 'rifle',
    faction: 'iran',
    rarity: 'common',
    base_stats: {
      damage: 45,
      accuracy: 75,
      fire_rate: 650,
      range: 300,
      reload_speed: 2.8,
      magazine_size: 30
    },
    unlock_requirements: {
      level: 2,
      experience: 100,
      stg_tokens: 20,
      achievements: []
    },
    visual_effects: {
      animation_type: 'slide_up',
      animation_duration: 0.8,
      color_scheme: 'green',
      particle_effects: [
        { type: 'flash', intensity: 6 },
        { type: 'smoke', intensity: 4 },
        { type: 'spark', intensity: 3 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 7,
      boost_multipliers: {
        damage: 1.2,
        accuracy: 1.1,
        fire_rate: 1.15
      }
    },
    pricing: {
      base_price: 300,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 15 },
        { quantity: 5, discount_percent: 25 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['rifle', 'assault', 'balanced'],
      popularity_score: 80
    }
  },
  {
    weapon_id: 'ir_rifle_02',
    name: 'Sayyad',
    description: 'Premium Iranian rifle with enhanced accuracy',
    category: 'rifle',
    faction: 'iran',
    rarity: 'rare',
    base_stats: {
      damage: 52,
      accuracy: 85,
      fire_rate: 700,
      range: 350,
      reload_speed: 2.2,
      magazine_size: 25
    },
    unlock_requirements: {
      level: 8,
      experience: 1200,
      stg_tokens: 150,
      achievements: ['rifle_expert', 'sharpshooter']
    },
    visual_effects: {
      animation_type: 'glow',
      animation_duration: 1.0,
      color_scheme: 'gold',
      particle_effects: [
        { type: 'glow', intensity: 7 },
        { type: 'trail', intensity: 4 },
        { type: 'particle_burst', intensity: 5 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 8,
      boost_multipliers: {
        damage: 1.25,
        accuracy: 1.15,
        fire_rate: 1.2
      }
    },
    pricing: {
      base_price: 800,
      currency: 'STG',
      discount_tiers: [
        { quantity: 2, discount_percent: 20 },
        { quantity: 4, discount_percent: 35 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['rifle', 'premium', 'accurate'],
      popularity_score: 90
    }
  },

  // USA RIFLES
  {
    weapon_id: 'us_rifle_01',
    name: 'M4A1',
    description: 'Standard American assault rifle',
    category: 'rifle',
    faction: 'usa',
    rarity: 'common',
    base_stats: {
      damage: 42,
      accuracy: 78,
      fire_rate: 700,
      range: 320,
      reload_speed: 2.5,
      magazine_size: 30
    },
    unlock_requirements: {
      level: 2,
      experience: 100,
      stg_tokens: 25,
      achievements: []
    },
    visual_effects: {
      animation_type: 'fade_in',
      animation_duration: 0.7,
      color_scheme: 'silver',
      particle_effects: [
        { type: 'flash', intensity: 5 },
        { type: 'smoke', intensity: 3 },
        { type: 'spark', intensity: 2 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 7,
      boost_multipliers: {
        damage: 1.18,
        accuracy: 1.12,
        fire_rate: 1.16
      }
    },
    pricing: {
      base_price: 320,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 16 },
        { quantity: 6, discount_percent: 30 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['rifle', 'assault', 'standard'],
      popularity_score: 82
    }
  },
  {
    weapon_id: 'us_rifle_02',
    name: 'SCAR-H',
    description: 'Advanced American battle rifle',
    category: 'rifle',
    faction: 'usa',
    rarity: 'epic',
    base_stats: {
      damage: 58,
      accuracy: 88,
      fire_rate: 620,
      range: 400,
      reload_speed: 2.0,
      magazine_size: 20
    },
    unlock_requirements: {
      level: 12,
      experience: 2500,
      stg_tokens: 400,
      achievements: ['veteran', 'weapon_collector']
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 1.2,
      color_scheme: 'purple',
      particle_effects: [
        { type: 'glow', intensity: 8 },
        { type: 'trail', intensity: 6 },
        { type: 'particle_burst', intensity: 7 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 9,
      boost_multipliers: {
        damage: 1.3,
        accuracy: 1.18,
        fire_rate: 1.22
      }
    },
    pricing: {
      base_price: 1500,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 },
        { quantity: 2, discount_percent: 25 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 100
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['rifle', 'epic', 'advanced'],
      popularity_score: 95
    }
  },

  // IRAN SNIPERS
  {
    weapon_id: 'ir_sniper_01',
    name: 'Taj',
    description: 'Iranian sniper rifle with excellent range',
    category: 'sniper',
    faction: 'iran',
    rarity: 'rare',
    base_stats: {
      damage: 85,
      accuracy: 95,
      fire_rate: 120,
      range: 800,
      reload_speed: 3.5,
      magazine_size: 5
    },
    unlock_requirements: {
      level: 10,
      experience: 1800,
      stg_tokens: 300,
      achievements: ['long_range_killer', 'precision_expert']
    },
    visual_effects: {
      animation_type: 'glow',
      animation_duration: 1.5,
      color_scheme: 'gold',
      particle_effects: [
        { type: 'glow', intensity: 9 },
        { type: 'trail', intensity: 5 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 8,
      boost_multipliers: {
        damage: 1.35,
        accuracy: 1.2,
        fire_rate: 1.1
      }
    },
    pricing: {
      base_price: 1200,
      currency: 'STG',
      discount_tiers: [
        { quantity: 2, discount_percent: 22 },
        { quantity: 3, discount_percent: 33 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['sniper', 'long_range', 'precision'],
      popularity_score: 88
    }
  },

  // USA SNIPERS
  {
    weapon_id: 'us_sniper_01',
    name: 'Barrett M82',
    description: 'American anti-materiel sniper rifle',
    category: 'sniper',
    faction: 'usa',
    rarity: 'legendary',
    base_stats: {
      damage: 120,
      accuracy: 92,
      fire_rate: 80,
      range: 1000,
      reload_speed: 4.0,
      magazine_size: 10
    },
    unlock_requirements: {
      level: 15,
      experience: 4000,
      stg_tokens: 800,
      achievements: ['elite_sniper', 'weapon_master']
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 2.0,
      color_scheme: 'rainbow',
      particle_effects: [
        { type: 'glow', intensity: 10 },
        { type: 'trail', intensity: 8 },
        { type: 'particle_burst', intensity: 9 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 10,
      boost_multipliers: {
        damage: 1.5,
        accuracy: 1.25,
        fire_rate: 1.15
      }
    },
    pricing: {
      base_price: 3000,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 50
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['sniper', 'legendary', 'anti_materiel'],
      popularity_score: 98
    }
  },

  // IRAN SHOTGUNS
  {
    weapon_id: 'ir_shotgun_01',
    name: 'Mojtama',
    description: 'Iranian combat shotgun',
    category: 'shotgun',
    faction: 'iran',
    rarity: 'uncommon',
    base_stats: {
      damage: 35,
      accuracy: 60,
      fire_rate: 180,
      range: 80,
      reload_speed: 3.0,
      magazine_size: 8
    },
    unlock_requirements: {
      level: 6,
      experience: 800,
      stg_tokens: 120,
      achievements: ['close_combat_expert']
    },
    visual_effects: {
      animation_type: 'bounce',
      animation_duration: 0.9,
      color_scheme: 'red',
      particle_effects: [
        { type: 'flash', intensity: 8 },
        { type: 'smoke', intensity: 6 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 6,
      boost_multipliers: {
        damage: 1.3,
        accuracy: 1.15,
        fire_rate: 1.2
      }
    },
    pricing: {
      base_price: 450,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 18 },
        { quantity: 5, discount_percent: 30 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['shotgun', 'close_combat', 'powerful'],
      popularity_score: 76
    }
  },

  // USA SHOTGUNS
  {
    weapon_id: 'us_shotgun_01',
    name: 'Benelli M4',
    description: 'Italian-American tactical shotgun',
    category: 'shotgun',
    faction: 'usa',
    rarity: 'rare',
    base_stats: {
      damage: 40,
      accuracy: 65,
      fire_rate: 200,
      range: 90,
      reload_speed: 2.2,
      magazine_size: 7
    },
    unlock_requirements: {
      level: 9,
      experience: 1500,
      stg_tokens: 280,
      achievements: ['tactical_expert']
    },
    visual_effects: {
      animation_type: 'rotate_360',
      animation_duration: 1.1,
      color_scheme: 'blue',
      particle_effects: [
        { type: 'glow', intensity: 7 },
        { type: 'flash', intensity: 9 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 7,
      boost_multipliers: {
        damage: 1.35,
        accuracy: 1.18,
        fire_rate: 1.25
      }
    },
    pricing: {
      base_price: 900,
      currency: 'STG',
      discount_tiers: [
        { quantity: 2, discount_percent: 20 },
        { quantity: 4, discount_percent: 35 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['shotgun', 'tactical', 'reliable'],
      popularity_score: 84
    }
  },

  // IRAN SMG
  {
    weapon_id: 'ir_smg_01',
    name: 'Kolt',
    description: 'Compact Iranian submachine gun',
    category: 'smg',
    faction: 'iran',
    rarity: 'uncommon',
    base_stats: {
      damage: 22,
      accuracy: 70,
      fire_rate: 900,
      range: 120,
      reload_speed: 1.8,
      magazine_size: 25
    },
    unlock_requirements: {
      level: 5,
      experience: 600,
      stg_tokens: 80,
      achievements: ['rapid_fire_expert']
    },
    visual_effects: {
      animation_type: 'slide_up',
      animation_duration: 0.6,
      color_scheme: 'silver',
      particle_effects: [
        { type: 'trail', intensity: 4 },
        { type: 'spark', intensity: 3 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 6,
      boost_multipliers: {
        damage: 1.25,
        accuracy: 1.12,
        fire_rate: 1.3
      }
    },
    pricing: {
      base_price: 380,
      currency: 'STG',
      discount_tiers: [
        { quantity: 4, discount_percent: 22 },
        { quantity: 8, discount_percent: 35 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['smg', 'compact', 'rapid_fire'],
      popularity_score: 79
    }
  },

  // USA SMG
  {
    weapon_id: 'us_smg_01',
    name: 'MP5',
    description: 'German-American submachine gun',
    category: 'smg',
    faction: 'usa',
    rarity: 'rare',
    base_stats: {
      damage: 25,
      accuracy: 75,
      fire_rate: 800,
      range: 150,
      reload_speed: 1.5,
      magazine_size: 30
    },
    unlock_requirements: {
      level: 8,
      experience: 1400,
      stg_tokens: 250,
      achievements: ['cqb_expert', 'weapon_specialist']
    },
    visual_effects: {
      animation_type: 'fade_in',
      animation_duration: 0.7,
      color_scheme: 'purple',
      particle_effects: [
        { type: 'glow', intensity: 6 },
        { type: 'trail', intensity: 5 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 7,
      boost_multipliers: {
        damage: 1.3,
        accuracy: 1.15,
        fire_rate: 1.25
      }
    },
    pricing: {
      base_price: 850,
      currency: 'STG',
      discount_tiers: [
        { quantity: 2, discount_percent: 18 },
        { quantity: 5, discount_percent: 32 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['smg', 'premium', 'accurate'],
      popularity_score: 86
    }
  },

  // IRAN LMG
  {
    weapon_id: 'ir_lmg_01',
    name: 'PKM',
    description: 'Russian-Iranian general purpose machine gun',
    category: 'lmg',
    faction: 'iran',
    rarity: 'epic',
    base_stats: {
      damage: 38,
      accuracy: 68,
      fire_rate: 650,
      range: 600,
      reload_speed: 4.0,
      magazine_size: 100
    },
    unlock_requirements: {
      level: 11,
      experience: 2200,
      stg_tokens: 450,
      achievements: ['heavy_weapons_expert', 'suppression_master']
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 1.3,
      color_scheme: 'gold',
      particle_effects: [
        { type: 'glow', intensity: 8 },
        { type: 'trail', intensity: 6 },
        { type: 'smoke', intensity: 7 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 8,
      boost_multipliers: {
        damage: 1.2,
        accuracy: 1.1,
        fire_rate: 1.35
      }
    },
    pricing: {
      base_price: 1800,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 },
        { quantity: 2, discount_percent: 25 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 75
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['lmg', 'suppression', 'heavy'],
      popularity_score: 91
    }
  },

  // USA LMG
  {
    weapon_id: 'us_lmg_01',
    name: 'M240',
    description: 'American general purpose machine gun',
    category: 'lmg',
    faction: 'usa',
    rarity: 'epic',
    base_stats: {
      damage: 42,
      accuracy: 72,
      fire_rate: 600,
      range: 800,
      reload_speed: 3.8,
      magazine_size: 100
    },
    unlock_requirements: {
      level: 12,
      experience: 2800,
      stg_tokens: 500,
      achievements: ['machine_gunner', 'fire_support_expert']
    },
    visual_effects: {
      animation_type: 'glow',
      animation_duration: 1.4,
      color_scheme: 'red',
      particle_effects: [
        { type: 'glow', intensity: 9 },
        { type: 'trail', intensity: 7 },
        { type: 'smoke', intensity: 8 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 8,
      boost_multipliers: {
        damage: 1.25,
        accuracy: 1.12,
        fire_rate: 1.3
      }
    },
    pricing: {
      base_price: 2000,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 },
        { quantity: 2, discount_percent: 22 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 60
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['lmg', 'reliable', 'heavy_support'],
      popularity_score: 93
    }
  },

  // EXPLOSIVES
  {
    weapon_id: 'ir_explosive_01',
    name: 'RGD-5',
    description: 'Iranian fragmentation grenade',
    category: 'explosive',
    faction: 'iran',
    rarity: 'common',
    base_stats: {
      damage: 80,
      accuracy: 50,
      fire_rate: 30,
      range: 40,
      reload_speed: 1.0,
      magazine_size: 1
    },
    unlock_requirements: {
      level: 3,
      experience: 200,
      stg_tokens: 60,
      achievements: []
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 0.8,
      color_scheme: 'red',
      particle_effects: [
        { type: 'particle_burst', intensity: 10 },
        { type: 'flash', intensity: 8 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 5,
      boost_multipliers: {
        damage: 1.4,
        accuracy: 1.0,
        fire_rate: 1.0
      }
    },
    pricing: {
      base_price: 150,
      currency: 'STG',
      discount_tiers: [
        { quantity: 5, discount_percent: 20 },
        { quantity: 10, discount_percent: 35 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['explosive', 'grenade', 'area_damage'],
      popularity_score: 72
    }
  },
  {
    weapon_id: 'us_explosive_01',
    name: 'M67',
    description: 'American fragmentation grenade',
    category: 'explosive',
    faction: 'usa',
    rarity: 'common',
    base_stats: {
      damage: 75,
      accuracy: 55,
      fire_rate: 25,
      range: 35,
      reload_speed: 1.2,
      magazine_size: 1
    },
    unlock_requirements: {
      level: 3,
      experience: 180,
      stg_tokens: 55,
      achievements: []
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 0.9,
      color_scheme: 'blue',
      particle_effects: [
        { type: 'particle_burst', intensity: 9 },
        { type: 'flash', intensity: 7 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 5,
      boost_multipliers: {
        damage: 1.35,
        accuracy: 1.0,
        fire_rate: 1.0
      }
    },
    pricing: {
      base_price: 140,
      currency: 'STG',
      discount_tiers: [
        { quantity: 6, discount_percent: 22 },
        { quantity: 12, discount_percent: 38 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['explosive', 'grenade', 'standard'],
      popularity_score: 70
    }
  },

  // MELEE WEAPONS
  {
    weapon_id: 'ir_melee_01',
    name: 'Khanjar',
    description: 'Traditional Iranian combat knife',
    category: 'melee',
    faction: 'iran',
    rarity: 'uncommon',
    base_stats: {
      damage: 45,
      accuracy: 90,
      fire_rate: 120,
      range: 5,
      reload_speed: 0.5,
      magazine_size: 1
    },
    unlock_requirements: {
      level: 4,
      experience: 300,
      stg_tokens: 70,
      achievements: ['close_combat_expert']
    },
    visual_effects: {
      animation_type: 'rotate_360',
      animation_duration: 0.4,
      color_scheme: 'silver',
      particle_effects: [
        { type: 'glow', intensity: 4 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 4,
      boost_multipliers: {
        damage: 1.5,
        accuracy: 1.1,
        fire_rate: 1.2
      }
    },
    pricing: {
      base_price: 200,
      currency: 'STG',
      discount_tiers: [
        { quantity: 3, discount_percent: 15 },
        { quantity: 7, discount_percent: 30 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['melee', 'knife', 'traditional'],
      popularity_score: 74
    }
  },
  {
    weapon_id: 'us_melee_01',
    name: 'Ka-Bar',
    description: 'American combat knife',
    category: 'melee',
    faction: 'usa',
    rarity: 'uncommon',
    base_stats: {
      damage: 42,
      accuracy: 88,
      fire_rate: 100,
      range: 4,
      reload_speed: 0.4,
      magazine_size: 1
    },
    unlock_requirements: {
      level: 4,
      experience: 280,
      stg_tokens: 65,
      achievements: ['melee_expert']
    },
    visual_effects: {
      animation_type: 'bounce',
      animation_duration: 0.3,
      color_scheme: 'bronze',
      particle_effects: [
        { type: 'glow', intensity: 3 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 4,
      boost_multipliers: {
        damage: 1.45,
        accuracy: 1.08,
        fire_rate: 1.15
      }
    },
    pricing: {
      base_price: 180,
      currency: 'STG',
      discount_tiers: [
        { quantity: 4, discount_percent: 18 },
        { quantity: 8, discount_percent: 32 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: false
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['melee', 'knife', 'reliable'],
      popularity_score: 71
    }
  },

  // SPECIAL WEAPONS
  {
    weapon_id: 'ir_special_01',
    name: 'Zulfiqar',
    description: 'Experimental Iranian energy weapon',
    category: 'special',
    faction: 'iran',
    rarity: 'legendary',
    base_stats: {
      damage: 60,
      accuracy: 85,
      fire_rate: 300,
      range: 200,
      reload_speed: 2.5,
      magazine_size: 20
    },
    unlock_requirements: {
      level: 18,
      experience: 5000,
      stg_tokens: 1200,
      achievements: ['experimental_weapons', 'tech_pioneer']
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 2.0,
      color_scheme: 'rainbow',
      particle_effects: [
        { type: 'glow', intensity: 10 },
        { type: 'trail', intensity: 8 },
        { type: 'particle_burst', intensity: 9 },
        { type: 'lightning', intensity: 6 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 10,
      boost_multipliers: {
        damage: 1.6,
        accuracy: 1.2,
        fire_rate: 1.4
      }
    },
    pricing: {
      base_price: 5000,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 25,
      start_date: new Date('2026-03-05'),
      end_date: new Date('2026-04-05')
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['special', 'energy', 'experimental', 'limited'],
      popularity_score: 99
    }
  },
  {
    weapon_id: 'us_special_01',
    name: 'ADS',
    description: 'American directed energy weapon',
    category: 'special',
    faction: 'usa',
    rarity: 'legendary',
    base_stats: {
      damage: 65,
      accuracy: 90,
      fire_rate: 250,
      range: 250,
      reload_speed: 2.0,
      magazine_size: 15
    },
    unlock_requirements: {
      level: 20,
      experience: 6000,
      stg_tokens: 1500,
      achievements: ['energy_weapons', 'future_warrior']
    },
    visual_effects: {
      animation_type: 'particle_burst',
      animation_duration: 2.2,
      color_scheme: 'rainbow',
      particle_effects: [
        { type: 'glow', intensity: 10 },
        { type: 'trail', intensity: 9 },
        { type: 'particle_burst', intensity: 10 },
        { type: 'lightning', intensity: 7 }
      ]
    },
    boost_info: {
      can_be_boosted: true,
      max_boost_level: 10,
      boost_multipliers: {
        damage: 1.7,
        accuracy: 1.25,
        fire_rate: 1.5
      }
    },
    pricing: {
      base_price: 6000,
      currency: 'STG',
      discount_tiers: [
        { quantity: 1, discount_percent: 0 }
      ]
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 20,
      start_date: new Date('2026-03-05'),
      end_date: new Date('2026-04-05')
    },
    metadata: {
      created_by: 'system',
      version: '1.0',
      tags: ['special', 'energy', 'advanced', 'limited'],
      popularity_score: 100
    }
  }
];

// Connect to MongoDB and seed weapons
const seedWeapons = async () => {
  try {
    console.log('🔫 Seeding weapons...');
    
    // Clear existing weapons
    await Weapon.deleteMany({});
    console.log('🗑️ Cleared existing weapons');

    // Insert weapons
    const insertedWeapons = await Weapon.insertMany(weaponExamples);
    console.log(`✅ Inserted ${insertedWeapons.length} weapons`);

    // Log statistics
    const stats = {
      total: insertedWeapons.length,
      by_faction: {},
      by_category: {},
      by_rarity: {}
    };

    insertedWeapons.forEach(weapon => {
      stats.by_faction[weapon.faction] = (stats.by_faction[weapon.faction] || 0) + 1;
      stats.by_category[weapon.category] = (stats.by_category[weapon.category] || 0) + 1;
      stats.by_rarity[weapon.rarity] = (stats.by_rarity[weapon.rarity] || 0) + 1;
    });

    console.log('📊 Weapon Statistics:');
    console.log(`   By Faction: Iran=${stats.by_faction.iran || 0}, USA=${stats.by_faction.usa || 0}, Neutral=${stats.by_faction.neutral || 0}`);
    console.log(`   By Category:`, stats.by_category);
    console.log(`   By Rarity:`, stats.by_rarity);

    console.log('🎉 Weapons seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding weapons:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedWeapons().then(() => {
    console.log('🎉 Weapons seeding completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedWeapons;
