const express = require('express');
const router = express.Router();
const MatchmakingQueue = require('../models/MatchmakingQueue');
const Battle = require('../models/Battle');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { broadcastToUser, broadcastToAll } = require('../websocket/server');

// Join matchmaking queue
router.post('/join', auth, async (req, res) => {
  try {
    const {
      battle_type = 'normal',
      stake_amount = 100,
      faction_preference = 'any',
      level_min,
      level_max,
      weapon_restrictions = [],
      territory_preference
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    // Check if user is already in queue or battle
    const existingQueue = await MatchmakingQueue.findOne({ user_id: user._id });
    if (existingQueue && !existingQueue.matched) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already in matchmaking queue' }
      });
    }
    
    if (user.in_battle) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot join queue while in battle' }
      });
    }
    
    // Check stake amount
    if (stake_amount > user.stg_balance) {
      return res.status(400).json({
        success: false,
        error: { message: 'Insufficient STG balance for stake' }
      });
    }
    
    // Add to queue
    const queueEntry = await MatchmakingQueue.addToQueue(user, {
      battle_type,
      stake_amount,
      faction_preference,
      level_min,
      level_max,
      weapon_restrictions,
      territory_preference
    });
    
    // Start matchmaking process
    setTimeout(() => findMatch(user._id), 2000);
    
    res.json({
      success: true,
      message: 'Joined matchmaking queue',
      data: {
        queue_id: queueEntry._id,
        preferences: queueEntry.preferences,
        queue_time: queueEntry.queue_time
      }
    });
  } catch (error) {
    console.error('Error joining matchmaking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to join matchmaking queue' }
    });
  }
});

// Leave matchmaking queue
router.post('/leave', auth, async (req, res) => {
  try {
    const queueEntry = await MatchmakingQueue.findOneAndDelete({ 
      user_id: req.user.id,
      matched: false
    });
    
    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Not in matchmaking queue' }
      });
    }
    
    res.json({
      success: true,
      message: 'Left matchmaking queue'
    });
  } catch (error) {
    console.error('Error leaving matchmaking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to leave matchmaking queue' }
    });
  }
});

// Get queue status
router.get('/status', auth, async (req, res) => {
  try {
    const queueEntry = await MatchmakingQueue.findOne({ 
      user_id: req.user.id,
      matched: false
    }).populate('match_found.opponent_id', 'username telegram_id faction level');
    
    if (!queueEntry) {
      return res.json({
        success: true,
        data: { in_queue: false }
      });
    }
    
    res.json({
      success: true,
      data: {
        in_queue: true,
        queue_time: queueEntry.queue_time,
        wait_time: queueEntry.waitTime,
        preferences: queueEntry.preferences,
        priority: queueEntry.priority,
        matched: queueEntry.matched,
        match_found: queueEntry.match_found
      }
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get queue status' }
    });
  }
});

// Get queue statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await MatchmakingQueue.getQueueStats();
    
    res.json({
      success: true,
      data: stats[0] || {
        total_waiting: 0,
        iran_players: 0,
        usa_players: 0,
        average_wait_time: 0,
        average_level: 0
      }
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get queue statistics' }
    });
  }
});

// Find match for user
async function findMatch(userId) {
  try {
    const queueEntry = await MatchmakingQueue.findOne({ 
      user_id: userId,
      matched: false 
    });
    
    if (!queueEntry) return;
    
    // Find potential matches
    const potentialMatches = await MatchmakingQueue.findMatches(userId, 10);
    
    if (potentialMatches.length === 0) {
      // No matches found, update priority and continue waiting
      await MatchmakingQueue.updatePriorities();
      return;
    }
    
    // Calculate compatibility scores
    const matchesWithScores = potentialMatches.map(match => ({
      ...match,
      compatibility_score: queueEntry.calculateCompatibility(match)
    }));
    
    // Sort by compatibility score
    matchesWithScores.sort((a, b) => b.compatibility_score - a.compatibility_score);
    
    // Try to create battle with best match
    const bestMatch = matchesWithScores[0];
    
    if (bestMatch.compatibility_score >= 50) { // Minimum compatibility threshold
      await createBattle(queueEntry, bestMatch);
    } else {
      // No suitable match, continue waiting
      setTimeout(() => findMatch(userId), 5000);
    }
  } catch (error) {
    console.error('Error in findMatch:', error);
  }
}

// Create battle between two players
async function createBattle(player1, player2) {
  try {
    const user1 = await User.findById(player1.user_id);
    const user2 = await User.findById(player2.user_id);
    
    if (!user1 || !user2) return;
    
    // Check if either user is now in battle
    if (user1.in_battle || user2.in_battle) return;
    
    // Generate battle ID
    const battle_id = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create battle
    const battle = new Battle({
      battle_id,
      players: [
        {
          user_id: user1._id,
          telegram_id: user1.telegram_id,
          username: user1.username,
          faction: user1.faction,
          level: user1.level,
          current_health: 100,
          max_health: 100,
          energy: 50,
          max_energy: 50
        },
        {
          user_id: user2._id,
          telegram_id: user2.telegram_id,
          username: user2.username,
          faction: user2.faction,
          level: user2.level,
          current_health: 100,
          max_health: 100,
          energy: 50,
          max_energy: 50
        }
      ],
      battle_config: {
        stake_amount: Math.max(player1.preferences.stake_amount, player2.preferences.stake_amount),
        battle_type: player1.preferences.battle_type,
        fee_amount: Math.floor(Math.max(player1.preferences.stake_amount, player2.preferences.stake_amount) * 0.05)
      },
      status: 'pending'
    });
    
    await battle.save();
    
    // Mark both players as matched
    await player1.markAsMatched(player2.user_id, battle._id);
    await MatchmakingQueue.findOneAndUpdate(
      { user_id: player2.user_id },
      {
        matched: true,
        match_found: {
          opponent_id: player1.user_id,
          battle_id: battle._id,
          match_time: new Date()
        }
      }
    );
    
    // Update user battle status
    user1.in_battle = true;
    user2.in_battle = true;
    await Promise.all([user1.save(), user2.save()]);
    
    // Notify both players
    const battleData = {
      battle_id: battle.battle_id,
      id: battle._id,
      opponent: {
        user_id: player2.user_id,
        username: player2.username,
        faction: player2.faction,
        level: player2.level
      },
      stake_amount: battle.battle_config.stake_amount,
      battle_type: battle.battle_config.battle_type
    };
    
    broadcastToUser(user1._id.toString(), {
      type: 'match_found',
      battle: battleData,
      timestamp: new Date().toISOString()
    });
    
    broadcastToUser(user2._id.toString(), {
      type: 'match_found',
      battle: {
        ...battleData,
        opponent: {
          user_id: player1.user_id,
          username: player1.username,
          faction: player1.faction,
          level: player1.level
        }
      },
      timestamp: new Date().toISOString()
    });
    
    // Start battle after 10 seconds
    setTimeout(async () => {
      try {
        await battle.startBattle();
        
        // Broadcast battle start
        [user1._id, user2._id].forEach(userId => {
          broadcastToUser(userId.toString(), {
            type: 'battle_started',
            battle: {
              id: battle._id,
              battle_id: battle.battle_id,
              players: battle.players,
              current_turn: battle.current_turn,
              turn_time_limit: battle.turn_time_limit
            },
            timestamp: new Date().toISOString()
          });
        });
      } catch (error) {
        console.error('Error starting battle:', error);
      }
    }, 10000);
    
  } catch (error) {
    console.error('Error creating battle:', error);
  }
}

// Matchmaking cleanup interval
setInterval(async () => {
  try {
    await MatchmakingQueue.cleanupExpired();
    await MatchmakingQueue.updatePriorities();
  } catch (error) {
    console.error('Error in matchmaking cleanup:', error);
  }
}, 60000); // Run every minute

module.exports = router;
