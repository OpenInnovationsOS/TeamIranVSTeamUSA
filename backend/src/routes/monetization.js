const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
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
const purchaseSchema = Joi.object({
  product_id: Joi.string().required(),
  payment_method: Joi.string().valid('ton', 'stripe', 'coinbase', 'paypal').required(),
  ton_transaction_hash: Joi.string().when('payment_method', {
    is: 'ton',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const subscribeSchema = Joi.object({
  feature_id: Joi.string().required(),
  payment_method: Joi.string().valid('ton', 'stripe', 'coinbase', 'paypal').required(),
  ton_transaction_hash: Joi.string().when('payment_method', {
    is: 'ton',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Product definitions with TON wallet destinations
const TOKEN_PACKS = {
  'stg_1k': { 
    name: '1,000 STG Tokens', 
    amount: 1000, 
    price: 1.99, 
    bonus: 0,
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET
  },
  'stg_5k': { 
    name: '5,000 STG Tokens', 
    amount: 5000, 
    price: 5.99, 
    bonus: 500,
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET
  },
  'stg_10k': { 
    name: '10,000 STG Tokens', 
    amount: 10000, 
    price: 10.99, 
    bonus: 1500,
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET
  },
  'stg_50k': { 
    name: '50,000 STG Tokens', 
    amount: 50000, 
    price: 29.99, 
    bonus: 10000,
    category: 'STG_TOKEN_PACKS',
    wallet: process.env.STG_TOKENS_WALLET
  }
};

const PREMIUM_FEATURES = {
  'custom_avatar': { 
    name: 'Custom Avatar', 
    description: 'Exclusive avatars and skins', 
    monthly: 5.00,
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'battle_analytics': { 
    name: 'Battle Analytics', 
    description: 'Advanced battle statistics', 
    monthly: 3.00,
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'vip_chat': { 
    name: 'VIP Chat', 
    description: 'Priority support and chat features', 
    monthly: 4.00,
    category: 'PREMIUM_FEATURES',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  }
};

// Energy Boost Packs (similar to STG Token Packs)
const ENERGY_BOOST_PACKS = {
  'energy_10': { 
    name: '10 Energy Boosts', 
    amount: 10, 
    price: 2.99, 
    bonus: 0,
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'energy_25': { 
    name: '25 Energy Boosts', 
    amount: 25, 
    price: 6.99, 
    bonus: 3,
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'energy_50': { 
    name: '50 Energy Boosts', 
    amount: 50, 
    price: 12.99, 
    bonus: 8,
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  },
  'energy_100': { 
    name: '100 Energy Boosts', 
    amount: 100, 
    price: 24.99, 
    bonus: 20,
    category: 'ENERGY_BOOSTS',
    wallet: process.env.PREMIUM_FEATURES_WALLET
  }
};

// GET /api/monetization/products - Get available products
router.get('/products', async (req, res) => {
  try {
    const tokenPacks = Object.entries(TOKEN_PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      amount: pack.amount,
      price: pack.price,
      bonus: pack.bonus,
      total_tokens: pack.amount + pack.bonus,
      currency: 'USD',
      category: pack.category,
      wallet: pack.wallet,
      popular: id === 'stg_5k'
    }));

    const premiumFeatures = Object.entries(PREMIUM_FEATURES).map(([id, feature]) => ({
      id,
      name: feature.name,
      description: feature.description,
      monthly: feature.monthly,
      currency: 'USD',
      category: feature.category,
      wallet: feature.wallet,
      active: true
    }));

    const energyBoosts = Object.entries(ENERGY_BOOST_PACKS).map(([id, pack]) => ({
      id,
      name: pack.name,
      amount: pack.amount,
      price: pack.price,
      bonus: pack.bonus,
      total_boosts: pack.amount + pack.bonus,
      currency: 'USD',
      category: pack.category,
      wallet: pack.wallet,
      popular: id === 'energy_25'
    }));

    res.json({
      success: true,
      data: {
        token_packs: tokenPacks,
        premium_features: premiumFeatures,
        energy_boosts: energyBoosts
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/monetization/purchase - Purchase tokens
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { error, value } = purchaseSchema.validate(req.body);
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

    // Check token packs first
    let product = TOKEN_PACKS[value.product_id];
    let productType = 'token_purchase';
    
    // If not found, check energy boosts
    if (!product) {
      product = ENERGY_BOOST_PACKS[value.product_id];
      productType = 'energy_boost_purchase';
    }

    if (!product) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRODUCT',
          message: 'Invalid product ID'
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

    // Create payment record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = new Payment({
      transaction_id: transactionId,
      user_id: user._id,
      type: productType,
      product_details: {
        product_id: value.product_id,
        name: product.name,
        amount: product.amount,
        bonus: product.bonus,
        price_usd: product.price,
        currency: 'USD',
        category: product.category,
        wallet: product.wallet
      },
      payment_method: value.payment_method,
      blockchain: value.ton_transaction_hash ? {
        transaction_hash: value.ton_transaction_hash,
        wallet_address: product.wallet
      } : undefined,
      status: 'pending'
    });

    await payment.save();

    // Process payment (in production, this would verify the blockchain transaction)
    await payment.processPayment();
    
    // Simulate payment completion (in production, verify actual payment)
    setTimeout(async () => {
      await payment.completePayment();
      
      if (productType === 'token_purchase') {
        // Credit user tokens
        const totalTokens = product.amount + product.bonus;
        user.game_stats.stg_tokens += totalTokens;
        await user.save();
      } else if (productType === 'energy_boost_purchase') {
        // Add energy boosts to user inventory
        user.inventory.boosts.push({
          type: 'energy_boost',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          multiplier: 2.0
        });
        await user.save();
      }
    }, 2000);

    const responseData = {
      purchase: {
        id: payment._id,
        transaction_id: payment.transaction_id,
        product_id: value.product_id,
        amount: product.price,
        category: product.category,
        wallet: product.wallet,
        status: payment.status,
        created_at: payment.created_at
      }
    };

    if (productType === 'token_purchase') {
      responseData.user_balance = {
        current_tokens: user.game_stats.stg_tokens,
        tokens_to_add: product.amount + product.bonus,
        new_balance: user.game_stats.stg_tokens + product.amount + product.bonus
      };
    } else if (productType === 'energy_boost_purchase') {
      responseData.user_boosts = {
        current_boosts: user.inventory.boosts.length,
        boosts_to_add: 1,
        new_total: user.inventory.boosts.length + 1
      };
    }

    res.status(201).json({
      success: true,
      message: 'Purchase processed successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/monetization/subscribe - Subscribe to premium feature
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { error, value } = subscribeSchema.validate(req.body);
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

    const feature = PREMIUM_FEATURES[value.feature_id];
    if (!feature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FEATURE',
          message: 'Invalid feature ID'
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

    // Check if user already has this feature
    const existingFeature = user.premium_features.find(f => 
      f.feature_id === value.feature_id && 
      f.status === 'active' && 
      f.expires_at > new Date()
    );

    if (existingFeature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_SUBSCRIBED',
          message: 'You already have this premium feature'
        }
      });
    }

    // Create payment record
    const transactionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = new Payment({
      transaction_id: transactionId,
      user_id: user._id,
      type: 'premium_subscription',
      product_details: {
        product_id: value.feature_id,
        name: feature.name,
        amount: 0,
        bonus: 0,
        price_usd: feature.monthly,
        currency: 'USD',
        category: feature.category,
        wallet: feature.wallet
      },
      payment_method: value.payment_method,
      blockchain: value.ton_transaction_hash ? {
        transaction_hash: value.ton_transaction_hash,
        wallet_address: feature.wallet
      } : undefined,
      status: 'pending'
    });

    await payment.save();

    // Process payment
    await payment.processPayment();
    
    // Simulate payment completion
    setTimeout(async () => {
      await payment.completePayment();
      
      // Add premium feature to user
      await user.addPremiumFeature(value.feature_id, feature.name, feature.monthly);
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Subscription processed successfully',
      data: {
        subscription: {
          id: payment._id,
          transaction_id: payment.transaction_id,
          feature_id: value.feature_id,
          feature_name: feature.name,
          category: feature.category,
          wallet: feature.wallet,
          monthly_price: feature.monthly,
          status: payment.status,
          created_at: payment.created_at
        },
        benefits: {
          description: feature.description,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/monetization/purchases - Get user purchases
router.get('/purchases', authenticateToken, async (req, res) => {
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

    const payments = await Payment.getUserPayments(req.user.userId, 50);
    
    // Separate purchases by category
    const tokenPurchases = payments.filter(p => p.type === 'token_purchase' && p.status === 'completed');
    const energyBoostPurchases = payments.filter(p => p.type === 'energy_boost_purchase' && p.status === 'completed');
    const subscriptions = user.premium_features.filter(f => f.status === 'active');

    // Calculate totals by category
    const tokenSpent = tokenPurchases.reduce((sum, p) => sum + p.product_details.price_usd, 0);
    const energyBoostSpent = energyBoostPurchases.reduce((sum, p) => sum + p.product_details.price_usd, 0);
    const monthlySpent = subscriptions.reduce((sum, f) => sum + f.monthly_price, 0);

    res.json({
      success: true,
      data: {
        token_purchases: tokenPurchases.map(p => ({
          id: p._id,
          product_type: p.type,
          product_id: p.product_details.product_id,
          amount: p.product_details.price_usd,
          tokens: p.total_tokens,
          category: p.product_details.category,
          wallet: p.product_details.wallet,
          status: p.status,
          created_at: p.created_at
        })),
        energy_boost_purchases: energyBoostPurchases.map(p => ({
          id: p._id,
          product_type: p.type,
          product_id: p.product_details.product_id,
          amount: p.product_details.price_usd,
          boosts: p.product_details.amount + p.product_details.bonus,
          category: p.product_details.category,
          wallet: p.product_details.wallet,
          status: p.status,
          created_at: p.created_at
        })),
        subscriptions: subscriptions.map(s => ({
          id: s._id,
          feature_id: s.feature_id,
          feature_name: s.name,
          category: 'PREMIUM_FEATURES',
          wallet: s.wallet || process.env.PREMIUM_FEATURES_WALLET,
          monthly_price: s.monthly_price,
          status: s.status,
          expires_at: s.expires_at
        })),
        totals: {
          token_spent: tokenSpent,
          energy_boost_spent: energyBoostSpent,
          monthly_spent: monthlySpent,
          total_spent: tokenSpent + energyBoostSpent + monthlySpent,
          total_purchases: tokenPurchases.length + energyBoostPurchases.length,
          active_subscriptions: subscriptions.length
        }
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/monetization/analytics - Get monetization analytics by category
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
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

    // Get payment type breakdown
    const paymentTypeAnalytics = await Payment.aggregate([
      { $match: { 
        created_at: { $gte: cutoff },
        status: 'completed'
      }},
      {
        $group: {
          _id: '$type',
          total_revenue: { $sum: '$product_details.price_usd' },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: '$product_details.price_usd' }
        }
      }
    ]);

    const result = {
      summary: categoryAnalytics[0] || {
        total_revenue: 0,
        total_transactions: 0,
        categories: []
      },
      category_breakdown: categoryAnalytics[0]?.categories || [],
      wallet_breakdown: walletAnalytics,
      payment_type_breakdown: paymentTypeAnalytics,
      revenue_by_day: revenueByDay,
      top_products: topProducts,
      timeframe: timeframeNum
    };

    res.json({
      success: true,
      data: result
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

module.exports = router;
