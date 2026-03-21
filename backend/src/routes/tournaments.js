const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const Battle = require('../models/Battle');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { broadcastToAll, broadcastToUser } = require('../websocket/server');

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, type, limit = 20, page = 1 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.tournament_type = type;
    
    const tournaments = await Tournament.find(query)
      .populate('participants.user_id', 'username telegram_id faction level')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Tournament.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tournaments'
      }
    });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user_id', 'username telegram_id faction level avatar_url')
      .populate('bracket.player1', 'username telegram_id faction level')
      .populate('bracket.player2', 'username telegram_id faction level')
      .populate('bracket.winner', 'username telegram_id faction level')
      .populate('results.winner', 'username telegram_id faction level')
      .populate('results.runner_up', 'username telegram_id faction level')
      .populate('results.third_place', 'username telegram_id faction level');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tournament'
      }
    });
  }
});

// Create new tournament (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      tournament_type,
      registration,
      settings,
      prize_pool
    } = req.body;
    
    // Generate unique tournament ID
    const tournament_id = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tournament = new Tournament({
      tournament_id,
      name,
      description,
      tournament_type,
      registration,
      settings,
      prize_pool: prize_pool || 0
    });
    
    await tournament.save();
    
    // Broadcast new tournament
    broadcastToAll({
      type: 'tournament_created',
      tournament: {
        id: tournament._id,
        tournament_id: tournament.tournament_id,
        name: tournament.name,
        tournament_type: tournament.tournament_type,
        registration: tournament.registration,
        prize_pool: tournament.prize_pool
      },
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: tournament,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create tournament'
      }
    });
  }
});

// Register for tournament
router.post('/:id/register', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user meets requirements
    if (!tournament.isRegistrationOpen) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Registration is not open'
        }
      });
    }
    
    if (user.level < tournament.registration.level_requirement) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Level requirement: ${tournament.registration.level_requirement}`
        }
      });
    }
    
    // Check entry fee
    if (tournament.registration.entry_fee > 0) {
      if (user.stg_balance < tournament.registration.entry_fee) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Insufficient STG balance for entry fee'
          }
        });
      }
      
      // Deduct entry fee
      user.stg_balance -= tournament.registration.entry_fee;
      await user.save();
    }
    
    // Register participant
    await tournament.registerParticipant(user);
    
    // Broadcast registration update
    broadcastToAll({
      type: 'tournament_registration_update',
      tournament_id: tournament._id,
      participant_count: tournament.participantCount,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Successfully registered for tournament',
      data: {
        tournament_id: tournament._id,
        participant_count: tournament.participantCount
      }
    });
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to register for tournament'
      }
    });
  }
});

// Withdraw from tournament
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    await tournament.withdrawParticipant(req.user.id);
    
    // Refund entry fee if tournament hasn't started
    if (tournament.status === 'registration' && tournament.registration.entry_fee > 0) {
      const user = await User.findById(req.user.id);
      user.stg_balance += tournament.registration.entry_fee;
      await user.save();
    }
    
    // Broadcast registration update
    broadcastToAll({
      type: 'tournament_registration_update',
      tournament_id: tournament._id,
      participant_count: tournament.participantCount,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Successfully withdrew from tournament'
    });
  } catch (error) {
    console.error('Error withdrawing from tournament:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to withdraw from tournament'
      }
    });
  }
});

// Start tournament (admin only)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    await tournament.startTournament();
    
    // Broadcast tournament start
    broadcastToAll({
      type: 'tournament_started',
      tournament: {
        id: tournament._id,
        tournament_id: tournament.tournament_id,
        name: tournament.name,
        bracket: tournament.bracket,
        participant_count: tournament.participantCount
      },
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Tournament started successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to start tournament'
      }
    });
  }
});

// Get tournament bracket
router.get('/:id/bracket', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('bracket.player1', 'username telegram_id faction level avatar_url')
      .populate('bracket.player2', 'username telegram_id faction level avatar_url')
      .populate('bracket.winner', 'username telegram_id faction level avatar_url')
      .populate('bracket.battle_id', 'battle_id status result');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        tournament_id: tournament._id,
        tournament_name: tournament.name,
        tournament_type: tournament.tournament_type,
        status: tournament.status,
        current_round: tournament.bracket.current_round,
        total_rounds: tournament.bracket.total_rounds,
        matches: tournament.bracket.matches,
        participants: tournament.participants.map(p => ({
          user_id: p.user_id,
          username: p.username,
          faction: p.faction,
          level: p.level,
          status: p.status,
          current_round: p.current_round,
          wins: p.wins,
          losses: p.losses,
          points: p.points
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tournament bracket'
      }
    });
  }
});

// Get user's tournament history
router.get('/user/history', auth, async (req, res) => {
  try {
    const tournaments = await Tournament.getTournamentsByUser(req.user.id);
    
    res.json({
      success: true,
      data: tournaments
    });
  } catch (error) {
    console.error('Error fetching tournament history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tournament history'
      }
    });
  }
});

// Get upcoming tournaments
router.get('/upcoming', async (req, res) => {
  try {
    const tournaments = await Tournament.getUpcomingTournaments();
    
    res.json({
      success: true,
      data: tournaments
    });
  } catch (error) {
    console.error('Error fetching upcoming tournaments:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch upcoming tournaments'
      }
    });
  }
});

// Complete tournament match (admin only)
router.post('/:id/matches/:matchId/complete', auth, async (req, res) => {
  try {
    const { winnerId, battleId } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tournament not found'
        }
      });
    }
    
    await tournament.completeMatch(req.params.matchId, winnerId, battleId);
    
    // Broadcast match completion
    broadcastToAll({
      type: 'tournament_match_completed',
      tournament_id: tournament._id,
      match_id: req.params.matchId,
      winner_id: winnerId,
      battle_id: battleId,
      current_round: tournament.bracket.current_round,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Match completed successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error completing tournament match:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to complete tournament match'
      }
    });
  }
});

module.exports = router;
