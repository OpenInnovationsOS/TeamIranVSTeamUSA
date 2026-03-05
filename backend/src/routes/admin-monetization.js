const express = require('express');
const router = express.Router();
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

    // Check if user is admin or super_admin
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
  name: Joi.string().min(3).max(100),
  amount: Joi.number().integer().min(100).max(100000),
  price: Joi.number().min(0.99).max(99.99),
  bonus: Joi.number().min(0).max(50000),
  active: Joi.boolean(),
  description: Joi.string().max(500)
});

const updatePremiumFeatureSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
  monthly: Joi.number().min(0.99).max(99.99),
  active: Joi.boolean(),
  features: Joi.array().items(Joi.string())
});

// Product storage (in production, these would be in database)
let tokenPacks = {
  'stg_1k': { 
    name: '1,000 STG Tokens', 
    amount: 1000, 
    price: 1.99, 
    bonus: 0, 
    active: true,
    description: 'Basic token pack for new players',
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET 
  },
  'stg_5k': { 
    name: '5,000 STG Tokens', 
    amount: 5000, 
    price: 5.99, 
    bonus: 500, 
    active: true,
    description: 'Popular token pack with bonus tokens',
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET 
  },
  'stg_10k': { 
    name: '10,000 STG Tokens', 
    amount: 10000, 
    price: 10.99, 
    bonus: 1500, 
    active: true,
    description: 'Premium token pack with large bonus',
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET 
  },
  'stg_50k': { 
    name: '50,000 STG Tokens', 
    amount: 50000, 
    price: 29.99, 
    bonus: 10000, 
    active: true,
    description: 'Ultimate token pack for serious players',
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET 
  }
};

let energyBoostPacks = {
  'energy_10': { 
    name: '10 Energy Boosts', 
    amount: 10, 
    price: 2.99, 
    bonus: 0, 
    active: true,
    description: 'Quick energy refill for casual players',
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  },
  'energy_25': { 
    name: '25 Energy Boosts', 
    amount: 25, 
    price: 6.99, 
    bonus: 3, 
    active: true,
    description: 'Popular energy pack with bonus boosts',
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  },
  'energy_50': { 
    name: '50 Energy Boosts', 
    amount: 50, 
    price: 12.99, 
    bonus: 8, 
    active: true,
    description: 'Bulk energy pack for active players',
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  },
  'energy_100': { 
    name: '100 Energy Boosts', 
    amount: 100, 
    price: 24.99, 
    bonus: 20, 
    active: true,
    description: 'Ultimate energy pack for hardcore players',
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  }
};

let premiumFeatures = {
  'custom_avatar': { 
    name: 'Custom Avatar', 
    description: 'Exclusive avatars and skins', 
    monthly: 5.00, 
    active: true,
    features: ['exclusive_avatars', 'custom_skins', 'special_effects'],
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  },
  'battle_analytics': { 
    name: 'Battle Analytics', 
    description: 'Advanced battle statistics', 
    monthly: 3.00, 
    active: true,
    features: ['detailed_stats', 'battle_history', 'performance_metrics'],
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  },
  'vip_chat': { 
    name: 'VIP Chat', 
    description: 'Priority support and chat features', 
    monthly: 4.00, 
    active: true,
    features: ['priority_support', 'vip_chat_rooms', 'custom_emoji'],
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET 
  }
};

// GET /api/admin/monetization/token-packs - Get all token packs
router.get('/token-packs', authenticateAdmin, async (req, res) => {
  try {
    const packs = Object.entries(tokenPacks).map(([id, pack]) => ({
      id,
      ...pack,
      total_tokens: pack.amount + pack.bonus,
      value_per_token: pack.price / (pack.amount + pack.bonus)
    }));

    // Get actual revenue and purchase data
    const revenueData = await Payment.aggregate([
      { $match: { type: 'token_purchase', status: 'completed' } },
      { $group: { _id: '$product_details.product_id', revenue: { $sum: '$product_details.price_usd' }, purchases: { $sum: 1 } } }
    ]);

    // Merge actual data
    packs.forEach(pack => {
      const actualData = revenueData.find(r => r._id === pack.id);
      if (actualData) {
        pack.revenue = actualData.revenue;
        pack.purchases = actualData.purchases;
      }
    });

    res.json({
      success: true,
      data: { token_packs: packs }
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
router.put('/token-packs/:packId', authenticateAdmin, async (req, res) => {
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
    if (!tokenPacks[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Token pack not found'
        }
      });
    }

    // Update token pack
    tokenPacks[packId] = { ...tokenPacks[packId], ...value };

    res.json({
      success: true,
      message: 'Token pack updated successfully',
      data: {
        pack: {
          id: packId,
          ...tokenPacks[packId]
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
router.post('/token-packs', authenticateAdmin, async (req, res) => {
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

    // Generate new pack ID
    const packId = `stg_${value.amount}`;
    
    // Add new token pack
    tokenPacks[packId] = {
      name: value.name,
      amount: value.amount,
      price: value.price,
      bonus: value.bonus,
      active: value.active,
      description: value.description,
      category: 'STG_TOKEN_PACKS',
      wallet: process.env.STG_TOKENS_WALLET
    };

    res.status(201).json({
      success: true,
      message: 'Token pack added successfully',
      data: {
        pack: {
          id: packId,
          ...tokenPacks[packId]
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
router.delete('/token-packs/:packId', authenticateAdmin, async (req, res) => {
  try {
    const packId = req.params.packId;
    if (!tokenPacks[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Token pack not found'
        }
      });
    }

    // Delete token pack
    delete tokenPacks[packId];

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

// GET /api/admin/monetization/energy-boosts - Get all energy boost packs
router.get('/energy-boosts', authenticateAdmin, async (req, res) => {
  try {
    const packs = Object.entries(energyBoostPacks).map(([id, pack]) => ({
      id,
      ...pack,
      total_boosts: pack.amount + pack.bonus,
      value_per_boost: pack.price / (pack.amount + pack.bonus)
    }));

    // Get actual revenue and purchase data
    const revenueData = await Payment.aggregate([
      { $match: { type: 'energy_boost_purchase', status: 'completed' } },
      { $group: { _id: '$product_details.product_id', revenue: { $sum: '$product_details.price_usd' }, purchases: { $sum: 1 } } }
    ]);

    // Merge actual data
    packs.forEach(pack => {
      const actualData = revenueData.find(r => r._id === pack.id);
      if (actualData) {
        pack.revenue = actualData.revenue;
        pack.purchases = actualData.purchases;
      }
    });

    res.json({
      success: true,
      data: { energy_boosts: packs }
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
router.put('/energy-boosts/:packId', authenticateAdmin, async (req, res) => {
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
    if (!energyBoostPacks[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Energy boost pack not found'
        }
      });
    }

    // Update energy boost pack
    energyBoostPacks[packId] = { ...energyBoostPacks[packId], ...value };

    res.json({
      success: true,
      message: 'Energy boost pack updated successfully',
      data: {
        pack: {
          id: packId,
          ...energyBoostPacks[packId]
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
router.post('/energy-boosts', authenticateAdmin, async (req, res) => {
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

    // Generate new pack ID
    const packId = `energy_${value.amount}`;
    
    // Add new energy boost pack
    energyBoostPacks[packId] = {
      name: value.name,
      amount: value.amount,
      price: value.price,
      bonus: value.bonus,
      active: value.active,
      description: value.description,
      category: 'ENERGY_BOOSTS',
      wallet: process.env.PREMIUM_FEATURES_WALLET
    };

    res.status(201).json({
      success: true,
      message: 'Energy boost pack added successfully',
      data: {
        pack: {
          id: packId,
          ...energyBoostPacks[packId]
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
router.delete('/energy-boosts/:packId', authenticateAdmin, async (req, res) => {
  try {
    const packId = req.params.packId;
    if (!energyBoostPacks[packId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Energy boost pack not found'
        }
      });
    }

    // Delete energy boost pack
    delete energyBoostPacks[packId];

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

// GET /api/admin/monetization/premium-features - Get all premium features
router.get('/premium-features', authenticateAdmin, async (req, res) => {
  try {
    const features = Object.entries(premiumFeatures).map(([id, feature]) => ({
      id,
      ...feature,
      subscribers: 0, // Calculate from actual user data
      revenue: 0, // Calculate from actual payment data
      churn_rate: 0 // Calculate from actual subscription data
    }));

    // Get actual subscriber and revenue data
    const subscriptionData = await Payment.aggregate([
      { $match: { type: 'premium_subscription', status: 'completed' } },
      { $group: { _id: '$product_details.product_id', revenue: { $sum: '$product_details.price_usd' }, subscribers: { $sum: 1 } } }
    ]);

    // Merge actual data
    features.forEach(feature => {
      const actualData = subscriptionData.find(s => s._id === feature.id);
      if (actualData) {
        feature.revenue = actualData.revenue;
        feature.subscribers = actualData.subscribers;
      }
    });

    res.json({
      success: true,
      data: { premium_features: features }
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
router.put('/premium-features/:featureId', authenticateAdmin, async (req, res) => {
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
    if (!premiumFeatures[featureId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Premium feature not found'
        }
      });
    }

    // Update premium feature
    premiumFeatures[featureId] = { ...premiumFeatures[featureId], ...value };

    res.json({
      success: true,
      message: 'Premium feature updated successfully',
      data: {
        feature: {
          id: featureId,
          ...premiumFeatures[featureId]
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

// POST /api/admin/monetization/premium-features - Add new premium feature
router.post('/premium-features', authenticateAdmin, async (req, res) => {
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

    // Generate new feature ID
    const featureId = `feature_${Date.now()}`;
    
    // Add new premium feature
    premiumFeatures[featureId] = {
      name: value.name,
      description: value.description,
      monthly: value.monthly,
      active: value.active,
      features: value.features || [],
      category: 'PREMIUM_FEATURES',
      wallet: process.env.PREMIUM_FEATURES_WALLET
    };

    res.status(201).json({
      success: true,
      message: 'Premium feature added successfully',
      data: {
        feature: {
          id: featureId,
          ...premiumFeatures[featureId]
        }
      }
    });
  } catch (error) {
    console.error('Add premium feature error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// DELETE /api/admin/monetization/premium-features/:featureId - Delete premium feature
router.delete('/premium-features/:featureId', authenticateAdmin, async (req, res) => {
  try {
    const featureId = req.params.featureId;
    if (!premiumFeatures[featureId]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Premium feature not found'
        }
      });
    }

    // Delete premium feature
    delete premiumFeatures[featureId];

    res.json({
      success: true,
      message: 'Premium feature deleted successfully'
    });
  } catch (error) {
    console.error('Delete premium feature error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/admin/monetization/analytics - Get comprehensive monetization analytics
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { timeframe = 30, category = 'all' } = req.query;
    const timeframeNum = parseInt(timeframe) || 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeframeNum);

    // Get category-specific analytics
    const categoryAnalytics = await Payment.aggregate([
      { $match: { 
        created_at: { $gte: cutoff },
        status: 'completed'
      }},
      {
        $group: {
          _id: '$product_details.category',
          total_revenue: { $sum: '$product_details.price_usd' },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: '$product_details.price_usd' },
          successful_transactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          failed_transactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total_revenue' },
          total_transactions: { $sum: '$transaction_count' },
          categories: {
            $push: {
              category: '$_id',
              revenue: '$total_revenue',
              count: '$transaction_count',
              average: '$average_amount',
              success_rate: {
                $divide: [
                  '$successful_transactions',
                  '$transaction_count'
                ]
              }
            }
          }
        }
      }
    ]);

    // Get wallet-specific analytics
    const walletAnalytics = await Payment.aggregate([
      { $match: { 
        created_at: { $gte: cutoff },
        status: 'completed'
      }},
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

    // Get top products
    const topProducts = await Payment.aggregate([
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
    ]);

    // Get revenue by day
    const revenueByDay = await Payment.aggregate([
      { $match: { 
        created_at: { $gte: cutoff },
        status: 'completed'
      }},
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$created_at'
            }
          },
          daily_revenue: { $sum: '$product_details.price_usd' },
          transaction_count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const result = {
      summary: categoryAnalytics[0] || {
        total_revenue: 0,
        total_transactions: 0,
        categories: []
      },
      category_breakdown: categoryAnalytics[0]?.categories || [],
      wallet_breakdown: walletAnalytics,
      revenue_by_day: revenueByDay,
      top_products: topProducts,
      timeframe: timeframeNum
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get monetization analytics error:', error);
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
