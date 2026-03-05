const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Validation schemas
const createUserSchema = Joi.object({
  telegram_id: Joi.number().required(),
  username: Joi.string().min(3).max(30).required(),
  faction: Joi.string().valid('iran', 'usa').required()
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  faction: Joi.string().valid('iran', 'usa')
});

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

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details);
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

    // Check if user already exists
    const existingUser = await User.findOne({ telegram_id: value.telegram_id });
    if (existingUser) {
      console.log('User already exists:', value.telegram_id);
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'User with this Telegram ID already exists'
        }
      });
    }

    // Create new user
    const user = new User(value);
    await user.save();
    console.log('User created successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        telegramId: user.telegram_id, 
        role: 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('JWT token generated successfully');
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          telegram_id: user.telegram_id,
          username: user.username,
          faction: user.faction,
          level: user.game_stats.level,
          stg_tokens: user.game_stats.stg_tokens,
          energy: user.game_stats.energy,
          rank: user.game_stats.rank
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

// GET /api/users/stats - Get user stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('premium_features')
      .populate('social.friends', 'username faction level');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update last active
    user.last_active = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        telegram_id: user.telegram_id,
        username: user.username,
        faction: user.faction,
        level: user.game_stats.level,
        experience: user.game_stats.experience,
        stg_tokens: user.game_stats.stg_tokens,
        energy: user.game_stats.energy,
        max_energy: user.game_stats.max_energy,
        wins: user.game_stats.wins,
        losses: user.game_stats.losses,
        rank: user.game_stats.rank,
        win_rate: user.game_stats.win_rate,
        total_battles: user.game_stats.total_battles,
        premium_features: user.premium_features.filter(f => 
          f.status === 'active' && f.expires_at > new Date()
        ),
        achievements: user.achievements,
        last_active: user.last_active
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
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

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { ...value, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        username: user.username,
        faction: user.faction,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/users/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { faction, limit = 50 } = req.query;
    const limitNum = parseInt(limit) || 50;

    const leaderboard = await User.getLeaderboard(faction, limitNum);

    res.json({
      success: true,
      data: {
        leaderboard,
        filters: {
          faction: faction || 'all',
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/users/search - Search users (admin only)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, faction, limit = 20 } = req.query;
    const limitNum = parseInt(limit) || 20;

    // Build search query
    const query = { is_banned: false };
    
    if (q) {
      query.$or = [
        { username: { $regex: q, $options: 'i' } },
        { telegram_id: parseInt(q) }
      ];
    }
    
    if (faction) {
      query.faction = faction;
    }

    const users = await User.find(query)
      .select('telegram_id username faction game_stats.level game_stats.wins game_stats.losses game_stats.rank created_at')
      .sort({ 'game_stats.rank': 1 })
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        users,
        query: { q, faction, limit: limitNum },
        total: users.length
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/users/energy/refill - Refill energy (premium feature)
router.post('/energy/refill', authenticateToken, async (req, res) => {
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

    // Check if user has energy boost premium feature
    const hasEnergyBoost = user.hasActivePremiumFeature('energy_boost');
    
    if (!hasEnergyBoost) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Energy boost premium feature required'
        }
      });
    }

    // Refill energy
    user.game_stats.energy = user.game_stats.max_energy;
    await user.save();

    res.json({
      success: true,
      message: 'Energy refilled successfully',
      data: {
        energy: user.game_stats.energy,
        max_energy: user.game_stats.max_energy
      }
    });
  } catch (error) {
    console.error('Energy refill error:', error);
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
