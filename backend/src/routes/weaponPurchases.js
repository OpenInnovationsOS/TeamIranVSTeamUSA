const express = require('express');
const router = express.Router();
const WeaponPurchase = require('../models/WeaponPurchase');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { broadcastToUser } = require('../websocket/server');

// Define weapon catalog (would typically come from a database)
const WEAPON_CATALOG = {
  // Tanks
  'tank_abrams': {
    name: 'M1A2 Abrams',
    category: 'tanks',
    faction: 'usa',
    rarity: 'epic',
    price: 25000,
    currency: 'STG',
    level_requirement: 15,
    base_stats: {
      damage: 85,
      accuracy: 75,
      fire_rate: 60,
      range: 80,
      reload_speed: 45,
      magazine_size: 8
    },
    special_abilities: ['armor_piercing', 'smoke_screen'],
    faction_bonus: 1.2
  },
  'tank_t90m': {
    name: 'T-90M',
    category: 'tanks',
    faction: 'iran',
    rarity: 'epic',
    price: 24000,
    currency: 'STG',
    level_requirement: 15,
    base_stats: {
      damage: 80,
      accuracy: 80,
      fire_rate: 65,
      range: 75,
      reload_speed: 50,
      magazine_size: 10
    },
    special_abilities: ['reactive_armor', 'atgm_capability'],
    faction_bonus: 1.25
  },
  'tank_merkava': {
    name: 'Merkava IV',
    category: 'tanks',
    faction: 'neutral',
    rarity: 'rare',
    price: 18000,
    currency: 'STG',
    level_requirement: 12,
    base_stats: {
      damage: 75,
      accuracy: 70,
      fire_rate: 55,
      range: 70,
      reload_speed: 55,
      magazine_size: 12
    },
    special_abilities: ['troop_transport', 'active_protection'],
    faction_bonus: 1.0
  },
  
  // Missiles
  'missile_patriot': {
    name: 'Patriot PAC-3',
    category: 'missiles',
    faction: 'usa',
    rarity: 'legendary',
    price: 22000,
    currency: 'STG',
    level_requirement: 14,
    base_stats: {
      damage: 95,
      accuracy: 90,
      fire_rate: 20,
      range: 95,
      reload_speed: 30,
      magazine_size: 4
    },
    special_abilities: ['anti_ballistic', 'multi_target'],
    faction_bonus: 1.3
  },
  'missile_s300': {
    name: 'S-300PMU',
    category: 'missiles',
    faction: 'iran',
    rarity: 'legendary',
    price: 21000,
    currency: 'STG',
    level_requirement: 14,
    base_stats: {
      damage: 90,
      accuracy: 85,
      fire_rate: 25,
      range: 90,
      reload_speed: 35,
      magazine_size: 6
    },
    special_abilities: ['long_range', 'stealth_detection'],
    faction_bonus: 1.35
  },
  'missile_tomahawk': {
    name: 'Tomahawk Block V',
    category: 'missiles',
    faction: 'usa',
    rarity: 'epic',
    price: 15000,
    currency: 'STG',
    level_requirement: 10,
    base_stats: {
      damage: 85,
      accuracy: 80,
      fire_rate: 15,
      range: 100,
      reload_speed: 25,
      magazine_size: 2
    },
    special_abilities: ['precision_strike', 'terrain_following'],
    faction_bonus: 1.15
  },
  
  // Drones
  'drone_reaper': {
    name: 'MQ-9 Reaper',
    category: 'drones',
    faction: 'usa',
    rarity: 'rare',
    price: 12000,
    currency: 'STG',
    level_requirement: 8,
    base_stats: {
      damage: 60,
      accuracy: 85,
      fire_rate: 70,
      range: 85,
      reload_speed: 60,
      magazine_size: 16
    },
    special_abilities: ['surveillance', 'hellfire_missiles'],
    faction_bonus: 1.1
  },
  'drone_shahed': {
    name: 'Shahed-136',
    category: 'drones',
    faction: 'iran',
    rarity: 'rare',
    price: 11000,
    currency: 'STG',
    level_requirement: 8,
    base_stats: {
      damage: 65,
      accuracy: 75,
      fire_rate: 80,
      range: 90,
      reload_speed: 50,
      magazine_size: 20
    },
    special_abilities: ['swarm_attack', 'kamikaze_mode'],
    faction_bonus: 1.2
  },
  'drone_bayraktar': {
    name: 'Bayraktar TB2',
    category: 'drones',
    faction: 'neutral',
    rarity: 'uncommon',
    price: 8500,
    currency: 'STG',
    level_requirement: 6,
    base_stats: {
      damage: 50,
      accuracy: 80,
      fire_rate: 60,
      range: 75,
      reload_speed: 65,
      magazine_size: 12
    },
    special_abilities: ['tactical_recon', 'guided_munitions'],
    faction_bonus: 1.0
  },
  
  // Warships
  'warship_ford': {
    name: 'USS Gerald Ford',
    category: 'warships',
    faction: 'usa',
    rarity: 'legendary',
    price: 30000,
    currency: 'STG',
    level_requirement: 20,
    base_stats: {
      damage: 100,
      accuracy: 70,
      fire_rate: 40,
      range: 95,
      reload_speed: 20,
      magazine_size: 96
    },
    special_abilities: ['carrier_air_wing', 'aegis_defense'],
    faction_bonus: 1.4
  },
  'warship_burke': {
    name: 'USS Arleigh Burke',
    category: 'warships',
    faction: 'usa',
    rarity: 'epic',
    price: 20000,
    currency: 'STG',
    level_requirement: 16,
    base_stats: {
      damage: 80,
      accuracy: 85,
      fire_rate: 50,
      range: 85,
      reload_speed: 30,
      magazine_size: 32
    },
    special_abilities: ['missile_defense', 'asw_capability'],
    faction_bonus: 1.25
  },
  'warship_sahand': {
    name: 'IRIS Sahand',
    category: 'warships',
    faction: 'iran',
    rarity: 'rare',
    price: 14000,
    currency: 'STG',
    level_requirement: 12,
    base_stats: {
      damage: 70,
      accuracy: 75,
      fire_rate: 55,
      range: 70,
      reload_speed: 40,
      magazine_size: 24
    },
    special_abilities: ['stealth_design', 'anti_ship_missiles'],
    faction_bonus: 1.15
  },
  
  // Aircraft
  'aircraft_f35': {
    name: 'F-35 Lightning II',
    category: 'aircraft',
    faction: 'usa',
    rarity: 'legendary',
    price: 28000,
    currency: 'STG',
    level_requirement: 18,
    base_stats: {
      damage: 90,
      accuracy: 95,
      fire_rate: 75,
      range: 80,
      reload_speed: 45,
      magazine_size: 20
    },
    special_abilities: ['stealth', 'vtol_capability', 'sensor_fusion'],
    faction_bonus: 1.35
  },
  'aircraft_su57': {
    name: 'Su-57 Felon',
    category: 'aircraft',
    faction: 'iran',
    rarity: 'legendary',
    price: 27000,
    currency: 'STG',
    level_requirement: 18,
    base_stats: {
      damage: 85,
      accuracy: 90,
      fire_rate: 80,
      range: 75,
      reload_speed: 40,
      magazine_size: 24
    },
    special_abilities: ['supermaneuverability', 'thrust_vectoring'],
    faction_bonus: 1.4
  },
  'aircraft_f22': {
    name: 'F-22 Raptor',
    category: 'aircraft',
    faction: 'usa',
    rarity: 'legendary',
    price: 26000,
    currency: 'STG',
    level_requirement: 17,
    base_stats: {
      damage: 95,
      accuracy: 90,
      fire_rate: 70,
      range: 85,
      reload_speed: 35,
      magazine_size: 18
    },
    special_abilities: ['stealth', 'supercruise', 'advanced_avionics'],
    faction_bonus: 1.3
  },
  'aircraft_mig35': {
    name: 'MiG-35',
    category: 'aircraft',
    faction: 'iran',
    rarity: 'epic',
    price: 16000,
    currency: 'STG',
    level_requirement: 11,
    base_stats: {
      damage: 75,
      accuracy: 85,
      fire_rate: 85,
      range: 70,
      reload_speed: 50,
      magazine_size: 30
    },
    special_abilities: ['multirole', 'thrust_vectoring'],
    faction_bonus: 1.2
  },
  'aircraft_apache': {
    name: 'AH-64 Apache',
    category: 'aircraft',
    faction: 'usa',
    rarity: 'rare',
    price: 13000,
    currency: 'STG',
    level_requirement: 9,
    base_stats: {
      damage: 70,
      accuracy: 80,
      fire_rate: 90,
      range: 60,
      reload_speed: 55,
      magazine_size: 38
    },
    special_abilities: ['tank_killer', 'night_vision'],
    faction_bonus: 1.1
  },
  'aircraft_havoc': {
    name: 'Mi-28 Havoc',
    category: 'aircraft',
    faction: 'iran',
    rarity: 'rare',
    price: 12000,
    currency: 'STG',
    level_requirement: 9,
    base_stats: {
      damage: 75,
      accuracy: 75,
      fire_rate: 85,
      range: 55,
      reload_speed: 60,
      magazine_size: 40
    },
    special_abilities: ['heavy_armor', 'all_weather'],
    faction_bonus: 1.15
  }
};

// Get weapon catalog
router.get('/catalog', async (req, res) => {
  try {
    const { category, faction, rarity, min_level, max_level } = req.query;
    
    let weapons = Object.entries(WEAPON_CATALOG).map(([id, weapon]) => ({
      id,
      ...weapon
    }));
    
    // Apply filters
    if (category) {
      weapons = weapons.filter(w => w.category === category);
    }
    
    if (faction) {
      weapons = weapons.filter(w => w.faction === faction || w.faction === 'neutral');
    }
    
    if (rarity) {
      weapons = weapons.filter(w => w.rarity === rarity);
    }
    
    if (min_level) {
      weapons = weapons.filter(w => w.level_requirement >= parseInt(min_level));
    }
    
    if (max_level) {
      weapons = weapons.filter(w => w.level_requirement <= parseInt(max_level));
    }
    
    // Sort by price and level
    weapons.sort((a, b) => {
      if (a.level_requirement !== b.level_requirement) {
        return a.level_requirement - b.level_requirement;
      }
      return a.price - b.price;
    });
    
    res.json({
      success: true,
      data: {
        weapons: weapons,
        categories: [...new Set(Object.values(WEAPON_CATALOG).map(w => w.category))],
        factions: [...new Set(Object.values(WEAPON_CATALOG).map(w => w.faction))],
        rarities: [...new Set(Object.values(WEAPON_CATALOG).map(w => w.rarity))]
      }
    });
  } catch (error) {
    console.error('Error fetching weapon catalog:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch weapon catalog' }
    });
  }
});

// Get weapon details
router.get('/catalog/:weaponId', async (req, res) => {
  try {
    const weapon = WEAPON_CATALOG[req.params.weaponId];
    
    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: { message: 'Weapon not found' }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: req.params.weaponId,
        ...weapon
      }
    });
  } catch (error) {
    console.error('Error fetching weapon details:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch weapon details' }
    });
  }
});

// Purchase weapon
router.post('/purchase', auth, async (req, res) => {
  try {
    const { weapon_id, payment_method = 'wallet', customizations = {} } = req.body;
    
    const weapon = WEAPON_CATALOG[weapon_id];
    const user = await User.findById(req.user.id);
    
    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: { message: 'Weapon not found' }
      });
    }
    
    // Check level requirement
    if (user.level < weapon.level_requirement) {
      return res.status(400).json({
        success: false,
        error: { message: `Level ${weapon.level_requirement} required` }
      });
    }
    
    // Check faction requirement
    if (weapon.faction !== 'neutral' && user.faction !== weapon.faction) {
      return res.status(400).json({
        success: false,
        error: { message: `Weapon requires ${weapon.faction} faction` }
      });
    }
    
    // Check if user already owns this weapon
    const existingPurchase = await WeaponPurchase.findOne({
      user_id: user._id,
      weapon_id: weapon_id,
      status: 'completed'
    });
    
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        error: { message: 'Weapon already owned' }
      });
    }
    
    // Calculate final price
    let finalPrice = weapon.price;
    
    // Apply faction bonus
    if (user.faction === weapon.faction) {
      finalPrice = Math.floor(finalPrice * (1 - (weapon.faction_bonus - 1) * 0.5)); // 50% of faction bonus as discount
    }
    
    // Check user balance
    if (user.stg_balance < finalPrice) {
      return res.status(400).json({
        success: false,
        error: { message: `Insufficient balance. Required: ${finalPrice} STG` }
      });
    }
    
    // Create purchase record
    const purchase = new WeaponPurchase({
      user_id: user._id,
      weapon_id: weapon_id,
      weapon_name: weapon.name,
      purchase: {
        price: weapon.price,
        currency: weapon.currency,
        payment_method,
        final_price: finalPrice,
        discount_applied: weapon.price - finalPrice
      },
      weapon_details: {
        category: weapon.category,
        faction: weapon.faction,
        rarity: weapon.rarity,
        base_stats: weapon.base_stats,
        special_abilities: weapon.special_abilities,
        faction_bonus: weapon.faction_bonus
      },
      inventory: {
        customizations: customizations
      }
    });
    
    // Deduct from user balance
    user.stg_balance -= finalPrice;
    await user.save();
    
    // Complete purchase
    await purchase.completePurchase();
    
    // Broadcast purchase
    broadcastToUser(user._id.toString(), {
      type: 'weapon_purchased',
      weapon: {
        id: weapon_id,
        name: weapon.name,
        category: weapon.category,
        rarity: weapon.rarity,
        stats: weapon.base_stats
      },
      purchase: {
        price: finalPrice,
        currency: weapon.currency,
        purchase_id: purchase.purchase_id
      },
      new_balance: user.stg_balance,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Weapon purchased successfully',
      data: {
        purchase: purchase,
        weapon: {
          id: weapon_id,
          ...weapon
        },
        new_balance: user.stg_balance
      }
    });
  } catch (error) {
    console.error('Error purchasing weapon:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to purchase weapon' }
    });
  }
});

// Get user's weapon inventory
router.get('/inventory', auth, async (req, res) => {
  try {
    const inventory = await WeaponPurchase.getUserInventory(req.user.id);
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch inventory' }
    });
  }
});

// Get user's equipped weapons
router.get('/equipped', auth, async (req, res) => {
  try {
    const equippedWeapons = await WeaponPurchase.getUserEquippedWeapons(req.user.id);
    
    res.json({
      success: true,
      data: equippedWeapons
    });
  } catch (error) {
    console.error('Error fetching equipped weapons:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch equipped weapons' }
    });
  }
});

// Equip weapon
router.post('/:purchaseId/equip', auth, async (req, res) => {
  try {
    const { slot } = req.body;
    
    const purchase = await WeaponPurchase.findOne({
      _id: req.params.purchaseId,
      user_id: req.user.id,
      status: 'completed'
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Weapon not found in inventory' }
      });
    }
    
    // Unequip any weapon in the same slot
    await WeaponPurchase.updateMany(
      { 
        user_id: req.user.id, 
        'inventory.weapon_slot': slot,
        'inventory.is_equipped': true 
      },
      { 
        'inventory.is_equipped': false,
        'inventory.weapon_slot': undefined
      }
    );
    
    // Equip the new weapon
    await purchase.equipWeapon(slot);
    
    res.json({
      success: true,
      message: 'Weapon equipped successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Error equipping weapon:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to equip weapon' }
    });
  }
});

// Unequip weapon
router.post('/:purchaseId/unequip', auth, async (req, res) => {
  try {
    const purchase = await WeaponPurchase.findOne({
      _id: req.params.purchaseId,
      user_id: req.user.id,
      status: 'completed'
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Weapon not found in inventory' }
      });
    }
    
    await purchase.unequipWeapon();
    
    res.json({
      success: true,
      message: 'Weapon unequipped successfully'
    });
  } catch (error) {
    console.error('Error unequipping weapon:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to unequip weapon' }
    });
  }
});

// Upgrade weapon
router.post('/:purchaseId/upgrade', auth, async (req, res) => {
  try {
    const { upgrade_type, cost } = req.body;
    
    const purchase = await WeaponPurchase.findOne({
      _id: req.params.purchaseId,
      user_id: req.user.id,
      status: 'completed'
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Weapon not found in inventory' }
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (user.stg_balance < cost) {
      return res.status(400).json({
        success: false,
        error: { message: 'Insufficient balance for upgrade' }
      });
    }
    
    // Deduct cost and apply upgrade
    user.stg_balance -= cost;
    await user.save();
    
    switch (upgrade_type) {
      case 'repair':
        await purchase.repairWeapon(100);
        break;
      case 'experience':
        await purchase.addExperience(100);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid upgrade type' }
        });
    }
    
    res.json({
      success: true,
      message: 'Weapon upgraded successfully',
      data: {
        purchase: purchase,
        new_balance: user.stg_balance
      }
    });
  } catch (error) {
    console.error('Error upgrading weapon:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upgrade weapon' }
    });
  }
});

// Get purchase statistics
router.get('/stats/purchases', auth, async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    
    const stats = await WeaponPurchase.getPurchaseStats(req.user.id, parseInt(timeframe));
    
    res.json({
      success: true,
      data: stats[0] || {
        total_purchases: 0,
        total_spent: 0,
        weapons_by_category: [],
        weapons_by_faction: [],
        weapons_by_rarity: []
      }
    });
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch purchase statistics' }
    });
  }
});

// Get popular weapons (public)
router.get('/stats/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularWeapons = await WeaponPurchase.getPopularWeapons(parseInt(limit));
    
    res.json({
      success: true,
      data: popularWeapons
    });
  } catch (error) {
    console.error('Error fetching popular weapons:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch popular weapons' }
    });
  }
});

// Request refund
router.post('/:purchaseId/refund', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const purchase = await WeaponPurchase.findOne({
      _id: req.params.purchaseId,
      user_id: req.user.id,
      status: 'completed'
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Purchase not found' }
      });
    }
    
    if (!purchase.canRefund) {
      return res.status(400).json({
        success: false,
        error: { message: 'Purchase cannot be refunded' }
      });
    }
    
    // Process refund
    await WeaponPurchase.processRefund(purchase._id, reason);
    
    // Refund user balance
    const user = await User.findById(req.user.id);
    user.stg_balance += purchase.transaction.refund_amount;
    await user.save();
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund_amount: purchase.transaction.refund_amount,
        new_balance: user.stg_balance
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to process refund' }
    });
  }
});

module.exports = router;
