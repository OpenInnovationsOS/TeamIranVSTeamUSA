const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Battle = require('../models/Battle');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Middleware to verify JWT token and admin role
const authenticateAdmin = (req, res, next) => {
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

    // Check if user is admin (in production, verify role from database)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
    }

    req.user = user;
    next();
  });
};

// Validation schemas
const updateTokenPackSchema = Joi.object({
  price: Joi.number().min(0.99).max(99.99),
  bonus: Joi.number().min(0).max(50000),
  active: Joi.boolean()
});

const updatePremiumFeatureSchema = Joi.object({
  monthly: Joi.number().min(0.99).max(99.99),
  description: Joi.string().max(500),
  active: Joi.boolean()
});

const addTokenPackSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(100000).required(),
  price: Joi.number().min(0.99).max(99.99).required(),
  bonus: Joi.number().min(0).max(50000).default(0),
  active: Joi.boolean().default(true)
});

// Product definitions (same as in monetization route)
const TOKEN_PACKS = {
  'stg_1k': { name: '1,000 STG Tokens', amount: 1000, price: 1.99, bonus: 0, category: 'STG_TOKEN_PACKS', wallet: process.env.STG_TOKENS_WALLET },
  'stg_5k': { name: '5,000 STG Tokens', amount: 5000, price: 5.99, bonus: 500, category: 'STG_TOKEN_PACKS', wallet: process.env.STG_TOKENS_WALLET },
  'stg_10k': { name: '10,000 STG Tokens', amount: 10000, price: 10.99, bonus: 1500, category: 'STG_TOKEN_PACKS', wallet: process.env.STG_TOKENS_WALLET },
  'stg_50k': { name: '50,000 STG Tokens', amount: 50000, price: 29.99, bonus: 10000, category: 'STG_TOKEN_PACKS', wallet: process.env.STG_TOKENS_WALLET }
};

const PREMIUM_FEATURES = {
  'custom_avatar': { name: 'Custom Avatar', description: 'Exclusive avatars and skins', monthly: 5.00, category: 'PREMIUM_FEATURES', wallet: process.env.PREMIUM_FEATURES_WALLET },
  'battle_analytics': { name: 'Battle Analytics', description: 'Advanced battle statistics', monthly: 3.00, category: 'PREMIUM_FEATURES', wallet: process.env.PREMIUM_FEATURES_WALLET },
  'vip_chat': { name: 'VIP Chat', description: 'Priority support and chat features', monthly: 4.00, category: 'PREMIUM_FEATURES', wallet: process.env.PREMIUM_FEATURES_WALLET }
};

const ENERGY_BOOST_PACKS = {
  'energy_10': { name: '10 Energy Boosts', amount: 10, price: 2.99, bonus: 0, category: 'ENERGY_BOOSTS', wallet: process.env.PREMIUM_FEATURES_WALLET },
  'energy_25': { name: '25 Energy Boosts', amount: 25, price: 6.99, bonus: 3, category: 'ENERGY_BOOSTS', wallet: process.env.PREMIUM_FEATURES_WALLET },
  'energy_50': { name: '50 Energy Boosts', amount: 50, price: 12.99, bonus: 8, category: 'ENERGY_BOOSTS', wallet: process.env.PREMIUM_FEATURES_WALLET },
  'energy_100': { name: '100 Energy Boosts', amount: 100, price: 24.99, bonus: 20, category: 'ENERGY_BOOSTS', wallet: process.env.PREMIUM_FEATURES_WALLET }
};

// GET /api/admin/users - Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      faction, 
      status = 'active',
      search 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    if (faction) {
      query.faction = faction;
    }
    
    if (status === 'banned') {
      query.is_banned = true;
    } else if (status === 'inactive') {
      query.is_active = false;
      query.is_banned = false;
    } else {
      query.is_active = true;
      query.is_banned = false;
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { telegram_id: parseInt(search) }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('telegram_id username faction game_stats level stg_tokens energy wins losses rank total_spent last_active is_banned')
        .sort({ 'game_stats.rank': 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          faction,
          status,
          search
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/analytics - Get comprehensive analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = 30, category = 'all' } = req.query;
    const timeframeNum = parseInt(timeframe) || 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeframeNum);

    // Get category-specific analytics
    const categoryAnalytics = await Payment.aggregate([
      { $match: { created_at: { $gte: cutoff } } },
      {
        $group: {
          _id: '$product_details.category',
          total_revenue: { $sum: '$product_details.price_usd' },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: '$product_details.price_usd' }
        }
      }
    ]);

    // Get wallet-specific analytics
    const walletAnalytics = await Payment.aggregate([
      { $match: { created_at: { $gte: cutoff } } },
      {
        $group: {
          _id: '$product_details.wallet',
          total_revenue: { $sum: '$product_details.price_usd' },
          transaction_count: { $sum: 1 },
          categories: {
            $addToSet: '$product_details.category'
          }
        }
      }
    ]);

    const [userStats, paymentAnalytics, battleStats, topProducts] = await Promise.all([
      User.aggregate([
        { $match: { is_banned: false } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalByFaction: {
              $push: {
                faction: '$faction',
                count: 1
              }
            },
            averageLevel: { $avg: '$game_stats.level' },
            totalTokens: { $sum: '$game_stats.stg_tokens' }
          }
        }
      ]),
      
      Payment.aggregate([
        { $match: { created_at: { $gte: cutoff } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$product_details.price_usd' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),
      
      Battle.getBattleStats(timeframeNum),
      
      Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$product_details.product_id',
            name: { $first: '$product_details.name' },
            category: { $first: '$product_details.category' },
            revenue: { $sum: '$product_details.price_usd' },
            purchases: { $sum: 1 },
            average_price: { $avg: '$product_details.price_usd' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Calculate additional metrics
    const newUsers = await User.countDocuments({
      created_at: { $gte: cutoff }
    });

    const totalRevenue = paymentAnalytics[0]?.totalRevenue || 0;
    const totalUsers = userStats[0]?.totalUsers || 0;
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const conversionRate = totalUsers > 0 ? (paymentAnalytics[0]?.totalTransactions || 0) / totalUsers : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue,
          totalUsers: totalUsers,
          activeUsers: await User.getActiveUsers(24),
          newUsers: newUsers,
          averageRevenuePerUser: averageRevenuePerUser,
          conversionRate: conversionRate
        },
        categoryBreakdown: categoryAnalytics,
        walletBreakdown: walletAnalytics,
        userMetrics: {
          totalByFaction: userStats[0]?.totalByFaction || [],
          averageLevel: userStats[0]?.averageLevel || 0,
          totalTokens: userStats[0]?.totalTokens || 0,
          retentionRate: 0.89, // Calculate based on actual data
          churnRate: 0.032
        },
        battleMetrics: battleStats[0] || {
          total_battles: 0,
          average_duration: 0,
          total_fees_collected: 0
        },
        topProducts: topProducts,
        timeframe: timeframeNum
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/monetization/token-packs - Get token packs for management
router.get('/monetization/token-packs', authenticateAdmin, async (req, res) => {
  try {
    const tokenPacks = Object.entries(TOKEN_PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      amount: pack.amount,
      price: pack.price,
      bonus: pack.bonus,
      total_tokens: pack.amount + pack.bonus,
      value_per_token: pack.price / (pack.amount + pack.bonus),
      active: true,
      category: pack.category,
      wallet: pack.wallet,
      revenue: 0, // Calculate from actual payment data
      purchases: 0 // Calculate from actual payment data
    }));

    // Get actual revenue and purchase data
    const revenueData = await Payment.aggregate([
      { $match: { type: 'token_purchase', status: 'completed' } },
      { $group: { _id: '$product_details.product_id', revenue: { $sum: '$product_details.price_usd' }, purchases: { $sum: 1 } } }
    ]);

    // Merge actual data
    tokenPacks.forEach(pack => {
      const actualData = revenueData.find(r => r._id === pack.id);
      if (actualData) {
        pack.revenue = actualData.revenue;
        pack.purchases = actualData.purchases;
      }
    });

    res.json({
      success: true,
      data: { token_packs: tokenPacks }
    });
  } catch (error) {
    console.error('Get token packs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/admin/monetization/token-packs/:packId - Update token pack
router.put('/monetization/token-packs/:packId', authenticateAdmin, async (req, res) => {
  try {
    const { error, value } = updateTokenPackSchema.validate(req.body);
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

    const packId = req.params.packId;
    if (!TOKEN_PACKS[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Token pack not found'
        }
      });
    }

    // Update token pack (in production, save to database)
    TOKEN_PACKS[packId] = { ...TOKEN_PACKS[packId], ...value };

    res.json({
      success: true,
      message: 'Token pack updated successfully',
      data: {
        pack: {
          id: packId,
          name: TOKEN_PACKS[packId].name,
          amount: TOKEN_PACKS[packId].amount,
          price: TOKEN_PACKS[packId].price,
          bonus: TOKEN_PACKS[packId].bonus,
          active: TOKEN_PACKS[packId].active
        }
      }
    });
  } catch (error) {
    console.error('Update token pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/admin/monetization/token-packs - Add new token pack
router.post('/monetization/token-packs', authenticateAdmin, async (req, res) => {
  try {
    const { error, value } = addTokenPackSchema.validate(req.body);
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

    // Generate new pack ID
    const packId = `stg_${value.amount}`;
    
    // Add new token pack (in production, save to database)
    TOKEN_PACKS[packId] = {
      name: `${value.amount.toLocaleString()} STG Tokens`,
      amount: value.amount,
      price: value.price,
      bonus: value.bonus,
      active: value.active
    };

    res.status(201).json({
      success: true,
      message: 'Token pack added successfully',
      data: {
        pack: {
          id: packId,
          name: TOKEN_PACKS[packId].name,
          amount: value.amount,
          price: value.price,
          bonus: value.bonus,
          active: value.active
        }
      }
    });
  } catch (error) {
    console.error('Add token pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// DELETE /api/admin/monetization/token-packs/:packId - Delete token pack
router.delete('/monetization/token-packs/:packId', authenticateAdmin, async (req, res) => {
  try {
    const packId = req.params.packId;
    if (!TOKEN_PACKS[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Token pack not found'
        }
      });
    }

    // Delete token pack (in production, remove from database)
    delete TOKEN_PACKS[packId];

    res.json({
      success: true,
      message: 'Token pack deleted successfully'
    });
  } catch (error) {
    console.error('Delete token pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/monetization/energy-boosts - Get energy boost packs for management
router.get('/monetization/energy-boosts', authenticateAdmin, async (req, res) => {
  try {
    const energyBoosts = Object.entries(ENERGY_BOOST_PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      amount: pack.amount,
      price: pack.price,
      bonus: pack.bonus,
      total_boosts: pack.amount + pack.bonus,
      value_per_boost: pack.price / (pack.amount + pack.bonus),
      active: true,
      category: pack.category,
      wallet: pack.wallet,
      revenue: 0, // Calculate from actual payment data
      purchases: 0 // Calculate from actual payment data
    }));

    // Get actual revenue and purchase data
    const revenueData = await Payment.aggregate([
      { $match: { type: 'energy_boost_purchase', status: 'completed' } },
      { $group: { _id: '$product_details.product_id', revenue: { $sum: '$product_details.price_usd' }, purchases: { $sum: 1 } } }
    ]);

    // Merge actual data
    energyBoosts.forEach(pack => {
      const actualData = revenueData.find(r => r._id === pack.id);
      if (actualData) {
        pack.revenue = actualData.revenue;
        pack.purchases = actualData.purchases;
      }
    });

    res.json({
      success: true,
      data: { energy_boosts: energyBoosts }
    });
  } catch (error) {
    console.error('Get energy boosts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/admin/monetization/energy-boosts/:packId - Update energy boost pack
router.put('/monetization/energy-boosts/:packId', authenticateAdmin, async (req, res) => {
  try {
    const { error, value } = updateTokenPackSchema.validate(req.body);
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

    const packId = req.params.packId;
    if (!ENERGY_BOOST_PACKS[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Energy boost pack not found'
        }
      });
    }

    // Update energy boost pack (in production, save to database)
    ENERGY_BOOST_PACKS[packId] = { ...ENERGY_BOOST_PACKS[packId], ...value };

    res.json({
      success: true,
      message: 'Energy boost pack updated successfully',
      data: {
        pack: {
          id: packId,
          name: ENERGY_BOOST_PACKS[packId].name,
          amount: ENERGY_BOOST_PACKS[packId].amount,
          price: ENERGY_BOOST_PACKS[packId].price,
          bonus: ENERGY_BOOST_PACKS[packId].bonus,
          active: ENERGY_BOOST_PACKS[packId].active
        }
      }
    });
  } catch (error) {
    console.error('Update energy boost pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/admin/monetization/energy-boosts - Add new energy boost pack
router.post('/monetization/energy-boosts', authenticateAdmin, async (req, res) => {
  try {
    const { error, value } = addTokenPackSchema.validate(req.body);
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

    // Generate new pack ID
    const packId = `energy_${value.amount}`;
    
    // Add new energy boost pack (in production, save to database)
    ENERGY_BOOST_PACKS[packId] = {
      name: `${value.amount} Energy Boosts`,
      amount: value.amount,
      price: value.price,
      bonus: value.bonus,
      active: value.active,
      category: 'ENERGY_BOOSTS',
      wallet: process.env.PREMIUM_FEATURES_WALLET
    };

    res.status(201).json({
      success: true,
      message: 'Energy boost pack added successfully',
      data: {
        pack: {
          id: packId,
          name: ENERGY_BOOST_PACKS[packId].name,
          amount: value.amount,
          price: value.price,
          bonus: value.bonus,
          active: value.active
        }
      }
    });
  } catch (error) {
    console.error('Add energy boost pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// DELETE /api/admin/monetization/energy-boosts/:packId - Delete energy boost pack
router.delete('/monetization/energy-boosts/:packId', authenticateAdmin, async (req, res) => {
  try {
    const packId = req.params.packId;
    if (!ENERGY_BOOST_PACKS[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Energy boost pack not found'
        }
      });
    }

    // Delete energy boost pack (in production, remove from database)
    delete ENERGY_BOOST_PACKS[packId];

    res.json({
      success: true,
      message: 'Energy boost pack deleted successfully'
    });
  } catch (error) {
    console.error('Delete energy boost pack error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/monetization/premium-features - Get premium features for management
router.get('/monetization/premium-features', authenticateAdmin, async (req, res) => {
  try {
    const premiumFeatures = Object.entries(PREMIUM_FEATURES).map(([id, feature]) => ({
      id,
      name: feature.name,
      description: feature.description,
      monthly: feature.monthly,
      active: true,
      category: feature.category,
      wallet: feature.wallet,
      subscribers: 0, // Calculate from actual user data
      revenue: 0, // Calculate from actual payment data
      churn_rate: 0 // Calculate from actual subscription data
    }));

    // Get actual subscriber and revenue data
    const subscriptionData = await User.aggregate([
      { $unwind: '$premium_features' },
      { $match: { 'premium_features.status': 'active' } },
      { $group: { _id: '$premium_features.feature_id', subscribers: { $sum: 1 }, revenue: { $sum: '$premium_features.monthly_price' } } }
    ]);

    // Merge actual data
    premiumFeatures.forEach(feature => {
      const actualData = subscriptionData.find(s => s._id === feature.id);
      if (actualData) {
        feature.subscribers = actualData.subscribers;
        feature.revenue = actualData.revenue;
      }
    });

    res.json({
      success: true,
      data: { premium_features: premiumFeatures }
    });
  } catch (error) {
    console.error('Get premium features error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/admin/monetization/premium-features/:featureId - Update premium feature
router.put('/monetization/premium-features/:featureId', authenticateAdmin, async (req, res) => {
  try {
    const { error, value } = updatePremiumFeatureSchema.validate(req.body);
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

    const featureId = req.params.featureId;
    if (!PREMIUM_FEATURES[featureId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Premium feature not found'
        }
      });
    }

    // Update premium feature (in production, save to database)
    PREMIUM_FEATURES[featureId] = { ...PREMIUM_FEATURES[featureId], ...value };

    res.json({
      success: true,
      message: 'Premium feature updated successfully',
      data: {
        feature: {
          id: featureId,
          name: PREMIUM_FEATURES[featureId].name,
          description: PREMIUM_FEATURES[featureId].description,
          monthly: PREMIUM_FEATURES[featureId].monthly,
          active: PREMIUM_FEATURES[featureId].active
        }
      }
    });
  } catch (error) {
    console.error('Update premium feature error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/battles - Get all battles
router.get('/battles', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = status === 'all' ? {} : { status };

    const [battles, total] = await Promise.all([
      Battle.find(query)
        .populate('players.user_id', 'username telegram_id faction level')
        .populate('result.winner', 'username')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Battle.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        battles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get battles error:', error);
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
