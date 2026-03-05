const express = require('express');
const router = express.Router();
const Weapon = require('../models/Weapon');
const WeaponBoost = require('../models/WeaponBoost');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid token'
        }
      });
    }
    req.user = user;
    next();
  });
};

// Validation schemas
const purchaseWeaponSchema = Joi.object({
  weapon_id: Joi.string().required(),
  payment_method: Joi.string().valid('stg_tokens', 'ton', 'stripe', 'coinbase').required(),
  quantity: Joi.number().integer().min(1).max(10).default(1)
});

const purchaseBoostSchema = Joi.object({
  weapon_id: Joi.string().required(),
  boost_level: Joi.number().integer().min(1).max(10).required(),
  boost_type: Joi.string().valid('damage', 'accuracy', 'fire_rate', 'all_stats', 'special_ability').required(),
  duration_hours: Joi.number().integer().min(1).max(720).required(),
  payment_method: Joi.string().valid('stg_tokens', 'ton', 'stripe', 'coinbase').required()
});

// Weapon Boost Packs Configuration
const WEAPON_BOOST_PACKS = {
  'damage_basic': {
    name: 'Damage Boost Pack - Basic',
    description: 'Increase weapon damage by 20% for 24 hours',
    boost_type: 'damage',
    boost_level: 1,
    duration_hours: 24,
    price: 50,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET,
    popular: true
  },
  'damage_advanced': {
    name: 'Damage Boost Pack - Advanced',
    description: 'Increase weapon damage by 50% for 24 hours',
    boost_type: 'damage',
    boost_level: 2,
    duration_hours: 24,
    price: 120,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'accuracy_basic': {
    name: 'Accuracy Boost Pack - Basic',
    description: 'Increase weapon accuracy by 15% for 24 hours',
    boost_type: 'accuracy',
    boost_level: 1,
    duration_hours: 24,
    price: 40,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'accuracy_advanced': {
    name: 'Accuracy Boost Pack - Advanced',
    description: 'Increase weapon accuracy by 30% for 24 hours',
    boost_type: 'accuracy',
    boost_level: 2,
    duration_hours: 24,
    price: 90,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'fire_rate_basic': {
    name: 'Fire Rate Boost Pack - Basic',
    description: 'Increase weapon fire rate by 25% for 24 hours',
    boost_type: 'fire_rate',
    boost_level: 1,
    duration_hours: 24,
    price: 60,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'fire_rate_advanced': {
    name: 'Fire Rate Boost Pack - Advanced',
    description: 'Increase weapon fire rate by 50% for 24 hours',
    boost_type: 'fire_rate',
    boost_level: 2,
    duration_hours: 24,
    price: 140,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'all_stats_basic': {
    name: 'All Stats Boost Pack - Basic',
    description: 'Increase all weapon stats by 15% for 24 hours',
    boost_type: 'all_stats',
    boost_level: 1,
    duration_hours: 24,
    price: 150,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET,
    popular: true
  },
  'all_stats_advanced': {
    name: 'All Stats Boost Pack - Advanced',
    description: 'Increase all weapon stats by 35% for 24 hours',
    boost_type: 'all_stats',
    boost_level: 2,
    duration_hours: 24,
    price: 300,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'weekend_warrior': {
    name: 'Weekend Warrior Pack',
    description: 'All stats +50% boost for 48 hours - Perfect for weekend battles!',
    boost_type: 'all_stats',
    boost_level: 3,
    duration_hours: 48,
    price: 500,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET,
    limited: true
  },
  'tournament_champion': {
    name: 'Tournament Champion Pack',
    description: 'All stats +75% boost for 72 hours - Dominate the tournament!',
    boost_type: 'all_stats',
    boost_level: 4,
    duration_hours: 72,
    price: 1000,
    category: 'WEAPON_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET,
    limited: true
  }
};

// GET /api/weapons - Get available weapons
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      faction, 
      rarity, 
      min_level, 
      max_price,
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    let query = { 'availability.is_active': true };

    // Apply filters
    if (category) query.category = category;
    if (faction) query.faction = faction;
    if (rarity) query.rarity = rarity;
    if (min_level) query['unlock_requirements.level'] = { $lte: parseInt(min_level) };
    if (max_price) query['pricing.base_price'] = { $lte: parseInt(max_price) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const weapons = await Weapon.find(query)
      .sort({ 'metadata.popularity_score': -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Weapon.countDocuments(query);

    res.json({
      success: true,
      data: {
        weapons: weapons.map(weapon => ({
          weapon_id: weapon.weapon_id,
          display_name: weapon.display_name,
          name: weapon.name,
          description: weapon.description,
          category: weapon.category,
          faction: weapon.faction,
          rarity: weapon.rarity,
          base_stats: weapon.base_stats,
          unlock_requirements: weapon.unlock_requirements,
          pricing: weapon.pricing,
          visual_effects: weapon.visual_effects,
          boost_info: weapon.boost_info,
          total_power: weapon.total_power,
          can_be_boosted: weapon.boost_info.can_be_boosted,
          animation_config: weapon.getAnimationConfig()
        })),
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(total / limitNum),
          total_items: total,
          items_per_page: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get weapons error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/weapons/boost-packs - Get weapon boost packs
router.get('/boost-packs', async (req, res) => {
  try {
    const boostPacks = Object.entries(WEAPON_BOOST_PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      description: pack.description,
      boost_type: pack.boost_type,
      boost_level: pack.boost_level,
      duration_hours: pack.duration_hours,
      price: pack.price,
      category: pack.category,
      wallet: pack.wallet,
      popular: pack.popular || false,
      limited: pack.limited || false
    }));

    res.json({
      success: true,
      data: {
        boost_packs: boostPacks
      }
    });
  } catch (error) {
    console.error('Get boost packs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/weapons/:weaponId - Get specific weapon details
router.get('/:weaponId', async (req, res) => {
  try {
    const { weaponId } = req.params;
    
    const weapon = await Weapon.findOne({ 
      weapon_id: weaponId,
      'availability.is_active': true 
    });

    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Weapon not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        weapon: {
          weapon_id: weapon.weapon_id,
          display_name: weapon.display_name,
          name: weapon.name,
          description: weapon.description,
          category: weapon.category,
          faction: weapon.faction,
          rarity: weapon.rarity,
          base_stats: weapon.base_stats,
          unlock_requirements: weapon.unlock_requirements,
          pricing: weapon.pricing,
          visual_effects: weapon.visual_effects,
          boost_info: weapon.boost_info,
          total_power: weapon.total_power,
          can_be_boosted: weapon.boost_info.can_be_boosted,
          animation_config: weapon.getAnimationConfig()
        }
      }
    });
  } catch (error) {
    console.error('Get weapon error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/weapons/purchase - Purchase weapon
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { error, value } = purchaseWeaponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const weapon = await Weapon.findOne({ weapon_id: value.weapon_id });
    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Weapon not found'
        }
      });
    }

    // Check if user can unlock
    if (!weapon.canUserUnlock(user)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REQUIREMENTS_NOT_MET',
          message: 'User does not meet unlock requirements',
          details: {
            current_level: user.game_stats.level,
            required_level: weapon.unlock_requirements.level,
            current_tokens: user.game_stats.stg_tokens,
            required_tokens: weapon.unlock_requirements.stg_tokens
          }
        }
      });
    }

    // Check if user already owns weapon
    if (user.inventory.weapons.includes(value.weapon_id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_OWNED',
          message: 'Weapon already owned'
        }
      });
    }

    // Calculate total cost
    const totalCost = weapon.pricing.base_price * value.quantity;

    // Check if user has enough tokens
    if (user.game_stats.stg_tokens < totalCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TOKENS',
          message: 'Insufficient STG tokens',
          details: {
            required: totalCost,
            available: user.game_stats.stg_tokens
          }
        }
      });
    }

    // Process purchase
    user.inventory.weapons.push(value.weapon_id);
    user.game_stats.stg_tokens -= totalCost;
    await user.save();

    res.json({
      success: true,
      message: 'Weapon purchased successfully',
      data: {
        purchase: {
          weapon_id: value.weapon_id,
          weapon_name: weapon.name,
          quantity: value.quantity,
          total_cost: totalCost,
          payment_method: value.payment_method,
          remaining_tokens: user.game_stats.stg_tokens
        },
        weapon: {
          weapon_id: weapon.weapon_id,
          display_name: weapon.display_name,
          base_stats: weapon.base_stats,
          visual_effects: weapon.visual_effects,
          animation_config: weapon.getAnimationConfig()
        }
      }
    });
  } catch (error) {
    console.error('Purchase weapon error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/weapons/boost-purchase - Purchase weapon boost
router.post('/boost-purchase', authenticateToken, async (req, res) => {
  try {
    const { error, value } = purchaseBoostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const weapon = await Weapon.findOne({ weapon_id: value.weapon_id });
    if (!weapon) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Weapon not found'
        }
      });
    }

    // Check if weapon can be boosted
    if (!weapon.boost_info.can_be_boosted) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BE_BOOSTED',
          message: 'This weapon cannot be boosted'
        }
      });
    }

    // Check boost level limit
    if (value.boost_level > weapon.boost_info.max_boost_level) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BOOST_LEVEL_EXCEEDED',
          message: `Maximum boost level is ${weapon.boost_info.max_boost_level}`
        }
      });
    }

    // Calculate boost cost
    const boostCost = weapon.calculateBoostCost(value.boost_level);
    if (!boostCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BOOST_LEVEL',
          message: 'Invalid boost level'
        }
      });
    }

    // Check if user has enough tokens
    if (user.game_stats.stg_tokens < boostCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TOKENS',
          message: 'Insufficient STG tokens',
          details: {
            required: boostCost,
            available: user.game_stats.stg_tokens
          }
        }
      });
    }

    // Create boost
    const boost = await WeaponBoost.createBoost(req.user.userId, value.weapon_id, {
      boost_level: value.boost_level,
      boost_type: value.boost_type,
      duration_hours: value.duration_hours,
      boost_multiplier: weapon.boost_info.boost_multipliers[value.boost_type] || 1.2,
      cost: {
        stg_tokens: boostCost,
        usd_equivalent: boostCost * 0.01 // Assuming 1 STG = $0.01
      },
      purchase_details: {
        transaction_id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payment_method: value.payment_method,
        wallet_address: process.env.PREMIUM_FEATURES_WALLET
      },
      effects: {
        visual_effects: [{
          type: 'glow',
          intensity: 5 + value.boost_level,
          color: value.boost_level > 2 ? 'gold' : 'blue'
        }],
        special_abilities: value.boost_type === 'special_ability' ? [{
          name: 'Enhanced Damage',
          description: `+${value.boost_level * 20}% damage for 10 seconds`,
          cooldown_seconds: 30,
          duration_seconds: 10
        }] : []
      }
    });

    // Deduct tokens
    user.game_stats.stg_tokens -= boostCost;
    await user.save();

    // Activate boost
    await WeaponBoost.activateBoost(boost.boost_id);

    res.json({
      success: true,
      message: 'Weapon boost purchased and activated successfully',
      data: {
        boost: boost.getDisplayInfo(),
        remaining_tokens: user.game_stats.stg_tokens,
        weapon_stats: weapon.getBoostedStats(value.boost_level)
      }
    });
  } catch (error) {
    console.error('Purchase boost error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/weapons/user-inventory - Get user's weapon inventory
router.get('/user-inventory', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get owned weapons
    const ownedWeaponIds = user.inventory.weapons;
    const ownedWeapons = await Weapon.find({ 
      weapon_id: { $in: ownedWeaponIds } 
    });

    // Get active boosts
    const activeBoosts = await WeaponBoost.getActiveForUser(req.user.userId);

    res.json({
      success: true,
      data: {
        owned_weapons: ownedWeapons.map(weapon => ({
          weapon_id: weapon.weapon_id,
          display_name: weapon.display_name,
          name: weapon.name,
          category: weapon.category,
          faction: weapon.faction,
          rarity: weapon.rarity,
          base_stats: weapon.base_stats,
          visual_effects: weapon.visual_effects,
          boost_info: weapon.boost_info,
          total_power: weapon.total_power,
          animation_config: weapon.getAnimationConfig()
        })),
        active_boosts: activeBoosts.map(boost => boost.getDisplayInfo())
      }
    });
  } catch (error) {
    console.error('Get user inventory error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/weapons/boost-history - Get user's boost history
router.get('/boost-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const boostHistory = await WeaponBoost.getHistoryForUser(req.user.userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        boost_history: boostHistory,
        pagination: {
          current_page: parseInt(page),
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get boost history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;
