const express = require('express');
const router = express.Router();
const Battle = require('../models/Battle');
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
const createBattleSchema = Joi.object({
  player2_id: Joi.string().required(),
  stake_amount: Joi.number().min(100).max(50000).required(),
  battle_type: Joi.string().valid('normal', 'tournament', 'quick').default('normal')
});

const moveSchema = Joi.object({
  move: Joi.object({
    action: Joi.string().valid('attack', 'defend', 'special', 'heal').required(),
    target: Joi.string(),
    damage: Joi.number().min(0).max(100),
    healing: Joi.number().min(0).max(50),
    energy_cost: Joi.number().min(0).max(50).required()
  }).required()
});

// GET /api/battles/active - Get active battles
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeBattles = await Battle.getActiveBattles();
    
    // Filter battles that user can join
    const availableBattles = activeBattles.filter(battle => 
      battle.status === 'pending' && 
      !battle.players.some(p => p.user_id.toString() === req.user.userId)
    );

    res.json({
      success: true,
      data: {
        activeBattles: availableBattles,
        totalActive: activeBattles.length,
        availableSlots: availableBattles.length
      }
    });
  } catch (error) {
    console.error('Get active battles error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/battles/create - Create new battle
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { error, value } = createBattleSchema.validate(req.body);
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

    // Get players
    const player1 = await User.findById(req.user.userId);
    const player2 = await User.findById(value.player2_id);

    if (!player1 || !player2) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'One or both players not found'
        }
      });
    }

    // Check if players have enough tokens
    const feeRate = value.battle_type === 'tournament' ? 0.05 : 
                   value.battle_type === 'quick' ? 0.01 : 0.02;
    const feeAmount = Math.floor(value.stake_amount * feeRate);
    const totalCost = value.stake_amount + feeAmount;

    if (player1.game_stats.stg_tokens < totalCost) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient STG tokens for battle'
        }
      });
    }

    // Check if player2 has enough tokens
    if (player2.game_stats.stg_tokens < value.stake_amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Opponent has insufficient STG tokens'
        }
      });
    }

    // Create battle
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const battle = new Battle({
      battle_id: battleId,
      players: [
        {
          user_id: player1._id,
          telegram_id: player1.telegram_id,
          username: player1.username,
          faction: player1.faction,
          level: player1.game_stats.level,
          deck: [],
          current_health: 100,
          max_health: 100,
          energy: 50,
          max_energy: 50
        },
        {
          user_id: player2._id,
          telegram_id: player2.telegram_id,
          username: player2.username,
          faction: player2.faction,
          level: player2.game_stats.level,
          deck: [],
          current_health: 100,
          max_health: 100,
          energy: 50,
          max_energy: 50
        }
      ],
      battle_config: {
        stake_amount: value.stake_amount,
        battle_type: value.battle_type,
        fee_amount: feeAmount
      },
      status: 'pending'
    });

    await battle.save();

    // Deduct stake from players
    player1.game_stats.stg_tokens -= totalCost;
    player2.game_stats.stg_tokens -= value.stake_amount;
    
    await Promise.all([player1.save(), player2.save()]);

    res.status(201).json({
      success: true,
      message: 'Battle created successfully',
      data: {
        battle: {
          id: battle._id,
          battle_id: battle.battle_id,
          players: battle.players,
          stake_amount: battle.battle_config.stake_amount,
          fee_amount: battle.battle_config.fee_amount,
          battle_type: battle.battle_config.battle_type,
          status: battle.status
        }
      }
    });
  } catch (error) {
    console.error('Create battle error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/battles/:battleId/join - Join a pending battle
router.post('/:battleId/join', authenticateToken, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId);

    if (!battle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Battle not found'
        }
      });
    }

    if (battle.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BATTLE_STATUS',
          message: 'Battle is no longer accepting players'
        }
      });
    }

    if (battle.players.some(p => p.user_id.toString() === req.user.userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_JOINED',
          message: 'You are already in this battle'
        }
      });
    }

    // Start the battle
    await battle.startBattle();

    res.json({
      success: true,
      message: 'Battle started',
      data: {
        battle: {
          id: battle._id,
          battle_id: battle.battle_id,
          players: battle.players,
          current_turn: battle.current_turn,
          status: battle.status
        }
      }
    });
  } catch (error) {
    console.error('Join battle error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// POST /api/battles/:battleId/move - Submit battle move
router.post('/:battleId/move', authenticateToken, async (req, res) => {
  try {
    const { error, value } = moveSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid move data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }

    const battle = await Battle.findById(req.params.battleId);

    if (!battle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Battle not found'
        }
      });
    }

    if (battle.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BATTLE_STATUS',
          message: 'Battle is not in progress'
        }
      });
    }

    // Check for timeout
    const timeoutResult = await battle.checkTimeout();
    if (timeoutResult && timeoutResult.status === 'timeout') {
      return res.json({
        success: true,
        message: 'Battle ended due to timeout',
        data: { battle: timeoutResult }
      });
    }

    // Make move
    const updatedBattle = await battle.makeMove(req.user.userId, value.move);

    res.json({
      success: true,
      message: 'Move submitted successfully',
      data: {
        battle: {
          id: updatedBattle._id,
          current_turn: updatedBattle.current_turn,
          players: updatedBattle.players,
          total_turns: updatedBattle.result.total_turns,
          status: updatedBattle.status
        }
      }
    });
  } catch (error) {
    console.error('Submit move error:', error);
    
    if (error.message === 'Not your turn') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TURN',
          message: 'Not your turn'
        }
      });
    }

    if (error.message === 'Not enough energy') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ENERGY',
          message: 'Not enough energy for this move'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/battles/history - Get battle history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, status = 'completed' } = req.query;
    const limitNum = parseInt(limit) || 20;

    const battles = await Battle.getBattlesByUser(req.user.userId, limitNum);

    // Filter by status if specified
    const filteredBattles = status === 'all' ? battles : 
      battles.filter(b => b.status === status);

    res.json({
      success: true,
      data: {
        battles: filteredBattles,
        pagination: {
          limit: limitNum,
          total: filteredBattles.length
        }
      }
    });
  } catch (error) {
    console.error('Battle history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/battles/:battleId - Get battle details
router.get('/:battleId', authenticateToken, async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.battleId)
      .populate('players.user_id', 'username telegram_id faction level');

    if (!battle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Battle not found'
        }
      });
    }

    // Check if user is part of this battle
    const isParticipant = battle.players.some(p => 
      p.user_id._id.toString() === req.user.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this battle'
        }
      });
    }

    res.json({
      success: true,
      data: { battle }
    });
  } catch (error) {
    console.error('Get battle details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
});

// GET /api/battles/stats - Get battle statistics
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = 24 } = req.query;
    const timeframeNum = parseInt(timeframe) || 24;

    const stats = await Battle.getBattleStats(timeframeNum);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          total_battles: 0,
          average_duration: 0,
          total_fees_collected: 0,
          battles_by_type: []
        },
        timeframe: timeframeNum
      }
    });
  } catch (error) {
    console.error('Battle stats error:', error);
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
