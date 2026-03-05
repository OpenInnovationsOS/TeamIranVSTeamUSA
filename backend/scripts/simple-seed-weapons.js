const mongoose = require('mongoose');
const Weapon = require('../src/models/Weapon');

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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: false
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
      currency: 'STG'
    },
    availability: {
      is_active: true,
      is_limited: true,
      limited_quantity: 100
    }
  }
];

// Connect to MongoDB and seed weapons
const seedWeapons = async () => {
  try {
    console.log('🔫 Seeding weapons...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/team-iran-vs-usa');
    
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
    console.log(`   By Faction: Iran=${stats.by_faction.iran || 0}, USA=${stats.by_faction.usa || 0}`);
    console.log(`   By Category:`, stats.by_category);
    console.log(`   By Rarity:`, stats.by_rarity);

    console.log('🎉 Weapons seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding weapons:', error);
    process.exit(1);
  }
};

seedWeapons();
