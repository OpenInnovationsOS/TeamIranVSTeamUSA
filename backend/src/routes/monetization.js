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

// Product definitions
const TOKEN_PACKS = {
  'stg_1k': { name: '1,000 STG Tokens', amount: 1000, price: 1.99, bonus: 0 },
  'stg_5k': { name: '5,000 STG Tokens', amount: 5000, price: 5.99, bonus: 500 },
  'stg_10k': { name: '10,000 STG Tokens', amount: 10000, price: 10.99, bonus: 1500 },
  'stg_50k': { name: '50,000 STG Tokens', amount: 50000, price: 29.99, bonus: 10000 }
};

const PREMIUM_FEATURES = {
  'energy_boost': { name: 'Energy Boost', description: '2x energy regeneration', monthly: 2.00 },
  'custom_avatar': { name: 'Custom Avatar', description: 'Exclusive avatars and skins', monthly: 5.00 },
  'battle_analytics': { name: 'Battle Analytics', description: 'Advanced battle statistics', monthly: 3.00 },
  'vip_chat': { name: 'VIP Chat', description: 'Priority support and chat features', monthly: 4.00 }
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
      popular: id === 'stg_5k'
    }));

    const premiumFeatures = Object.entries(PREMIUM_FEATURES).map(([id, feature]) => ({
      id,
      name: feature.name,
      description: feature.description,
      monthly: feature.monthly,
      currency: 'USD',
      active: true
    }));

    res.json({
      success: true,
      data: {
        token_packs: tokenPacks,
        premium_features: premiumFeatures
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

    const product = TOKEN_PACKS[value.product_id];
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
      type: 'token_purchase',
      product_details: {
        product_id: value.product_id,
        name: product.name,
        amount: product.amount,
        bonus: product.bonus,
        price_usd: product.price,
        currency: 'USD'
      },
      payment_method: value.payment_method,
      blockchain: value.ton_transaction_hash ? {
        transaction_hash: value.ton_transaction_hash
      } : undefined,
      status: 'pending'
    });

    await payment.save();

    // Process payment (in production, this would verify the blockchain transaction)
    await payment.processPayment();
    
    // Simulate payment completion (in production, verify actual payment)
    setTimeout(async () => {
      await payment.completePayment();
      
      // Credit user tokens
      const totalTokens = product.amount + product.bonus;
      user.game_stats.stg_tokens += totalTokens;
      await user.save();
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Purchase processed successfully',
      data: {
        purchase: {
          id: payment._id,
          transaction_id: payment.transaction_id,
          product_id: value.product_id,
          amount: product.price,
          tokens: product.amount + product.bonus,
          bonus: product.bonus,
          status: payment.status,
          created_at: payment.created_at
        },
        user_balance: {
          current_tokens: user.game_stats.stg_tokens,
          tokens_to_add: product.amount + product.bonus,
          new_balance: user.game_stats.stg_tokens + product.amount + product.bonus
        }
      }
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
        currency: 'USD'
      },
      payment_method: value.payment_method,
      blockchain: value.ton_transaction_hash ? {
        transaction_hash: value.ton_transaction_hash
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
    
    // Separate purchases and subscriptions
    const purchases = payments.filter(p => p.type === 'token_purchase' && p.status === 'completed');
    const subscriptions = user.premium_features.filter(f => f.status === 'active');

    // Calculate totals
    const totalSpent = purchases.reduce((sum, p) => sum + p.product_details.price_usd, 0);
    const monthlySpent = subscriptions.reduce((sum, f) => sum + f.monthly_price, 0);

    res.json({
      success: true,
      data: {
        purchases: purchases.map(p => ({
          id: p._id,
          product_type: p.type,
          product_id: p.product_details.product_id,
          amount: p.product_details.price_usd,
          tokens: p.total_tokens,
          status: p.status,
          created_at: p.created_at
        })),
        subscriptions: subscriptions.map(s => ({
          id: s._id,
          feature_id: s.feature_id,
          feature_name: s.name,
          monthly_price: s.monthly_price,
          status: s.status,
          expires_at: s.expires_at
        })),
        totals: {
          total_spent: totalSpent,
          monthly_spent: monthlySpent,
          total_purchases: purchases.length,
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

// GET /api/monetization/analytics - Get monetization analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const timeframeNum = parseInt(timeframe) || 30;

    const [paymentAnalytics, revenueByDay, topProducts] = await Promise.all([
      Payment.getPaymentAnalytics(timeframeNum),
      Payment.getRevenueByDay(timeframeNum),
      Payment.getTopProducts(10)
    ]);

    res.json({
      success: true,
      data: {
        summary: paymentAnalytics[0] || {
          total_revenue: 0,
          total_transactions: 0,
          breakdown: []
        },
        revenue_by_day: revenueByDay,
        top_products: topProducts,
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

module.exports = router;
