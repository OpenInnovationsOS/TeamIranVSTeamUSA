const express = require('express');
const router = express.Router();
const LeaderboardEntry = require('../models/Leaderboard');
const User = require('../models/User');
const Battle = require('../models/Battle');
const auth = require('../middleware/auth');
const { broadcastToAll } = require('../websocket/server');

// Get global leaderboard
router.get('/global', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const leaderboard = await LeaderboardEntry.getGlobalLeaderboard(
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: parseInt(offset) + index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          badges: entry.badges,
          titles: entry.titles.filter(title => title.is_active),
          is_online: entry.isOnline
        })),
        total_players: await LeaderboardEntry.countDocuments()
      }
    });
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch global leaderboard' }
    });
  }
});

// Get faction leaderboard
router.get('/faction/:faction', async (req, res) => {
  try {
    const { faction } = req.params;
    const { limit = 50 } = req.query;
    
    if (!['iran', 'usa'].includes(faction)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid faction' }
      });
    }
    
    const leaderboard = await LeaderboardEntry.getFactionLeaderboard(
      faction,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        faction: faction,
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          badges: entry.badges,
          titles: entry.titles.filter(title => title.is_active),
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching faction leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch faction leaderboard' }
    });
  }
});

// Get level leaderboard
router.get('/level', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const leaderboard = await LeaderboardEntry.getLevelLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching level leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch level leaderboard' }
    });
  }
});

// Get wealth leaderboard
router.get('/wealth', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const leaderboard = await LeaderboardEntry.getWealthLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching wealth leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch wealth leaderboard' }
    });
  }
});

// Get battle leaderboard
router.get('/battle', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const leaderboard = await LeaderboardEntry.getBattleLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching battle leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch battle leaderboard' }
    });
  }
});

// Get achievement leaderboard
router.get('/achievements', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const leaderboard = await LeaderboardEntry.getAchievementLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          badges: entry.badges,
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching achievement leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch achievement leaderboard' }
    });
  }
});

// Get user's rank and stats
router.get('/user/:userId', async (req, res) => {
  try {
    const userRank = await LeaderboardEntry.getUserRank(req.params.userId);
    
    if (!userRank) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found on leaderboard' }
      });
    }
    
    res.json({
      success: true,
      data: userRank
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user rank' }
    });
  }
});

// Get current user's rank
router.get('/my-rank', auth, async (req, res) => {
  try {
    const userRank = await LeaderboardEntry.getUserRank(req.user.id);
    
    if (!userRank) {
      // Create leaderboard entry for user if it doesn't exist
      const user = await User.findById(req.user.id);
      if (user) {
        const newEntry = new LeaderboardEntry({
          user_id: user._id,
          telegram_id: user.telegram_id,
          username: user.username,
          faction: user.faction,
          level: user.level,
          stats: {
            stg_balance: user.stg_balance || 0,
            experience: user.game_stats?.experience || 0
          }
        });
        
        await newEntry.save();
        await LeaderboardEntry.updateRanks();
        
        const updatedRank = await LeaderboardEntry.getUserRank(req.user.id);
        return res.json({
          success: true,
          data: updatedRank
        });
      }
    }
    
    res.json({
      success: true,
      data: userRank
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user rank' }
    });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [globalStats, topPerformers] = await Promise.all([
      LeaderboardEntry.getLeaderboardStats(),
      LeaderboardEntry.getTopPerformers()
    ]);
    
    res.json({
      success: true,
      data: {
        overview: globalStats[0] || {
          total_players: 0,
          iran_players: 0,
          usa_players: 0,
          average_level: 0,
          average_stg_balance: 0,
          total_battles: 0,
          total_stg_in_circulation: 0
        },
        top_performers: topPerformers,
        faction_distribution: globalStats[0] ? {
          iran: globalStats[0].iran_players,
          usa: globalStats[0].usa_players,
          iran_percentage: (globalStats[0].iran_players / globalStats[0].total_players) * 100,
          usa_percentage: (globalStats[0].usa_players / globalStats[0].total_players) * 100
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch leaderboard statistics' }
    });
  }
});

// Update user stats (internal endpoint)
router.post('/update/:userId', async (req, res) => {
  try {
    const { battle_result, experience_gained, stg_change } = req.body;
    
    let leaderboardEntry = await LeaderboardEntry.findOne({ user_id: req.params.userId });
    
    if (!leaderboardEntry) {
      // Create new entry if it doesn't exist
      const user = await User.findById(req.params.userId);
      if (user) {
        leaderboardEntry = new LeaderboardEntry({
          user_id: user._id,
          telegram_id: user.telegram_id,
          username: user.username,
          faction: user.faction,
          level: user.level,
          stats: {
            stg_balance: user.stg_balance || 0,
            experience: user.game_stats?.experience || 0
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }
    }
    
    // Update stats
    if (battle_result) {
      await leaderboardEntry.updateStats(battle_result);
    }
    
    if (experience_gained) {
      leaderboardEntry.stats.experience += experience_gained;
    }
    
    if (stg_change) {
      leaderboardEntry.stats.stg_balance += stg_change;
      if (stg_change > 0) {
        leaderboardEntry.stats.total_stg_earned += stg_change;
      } else {
        leaderboardEntry.stats.total_stg_spent += Math.abs(stg_change);
      }
      leaderboardEntry.stats.net_stg_profit = 
        leaderboardEntry.stats.total_stg_earned - leaderboardEntry.stats.total_stg_spent;
    }
    
    // Record history
    await leaderboardEntry.recordHistory();
    
    // Update ranks
    await LeaderboardEntry.updateRanks();
    
    // Broadcast leaderboard update
    broadcastToAll({
      type: 'leaderboard_updated',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Leaderboard updated successfully',
      data: leaderboardEntry
    });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update leaderboard' }
    });
  }
});

// Search leaderboard
router.get('/search', async (req, res) => {
  try {
    const { query, faction, limit = 20 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query must be at least 2 characters' }
      });
    }
    
    let searchQuery = {
      username: { $regex: query, $options: 'i' }
    };
    
    if (faction && ['iran', 'usa'].includes(faction)) {
      searchQuery.faction = faction;
    }
    
    const results = await LeaderboardEntry.find(searchQuery)
      .sort({ 'rankings.overall_score': -1 })
      .limit(parseInt(limit))
      .select('user_id telegram_id username faction level stats rankings badges titles');
    
    res.json({
      success: true,
      data: {
        query: query,
        faction: faction,
        results: results.map(entry => ({
          user_id: entry.user_id,
          telegram_id: entry.telegram_id,
          username: entry.username,
          faction: entry.faction,
          level: entry.level,
          stats: entry.stats,
          rankings: entry.rankings,
          badges: entry.badges,
          titles: entry.titles.filter(title => title.is_active),
          is_online: entry.isOnline
        }))
      }
    });
  } catch (error) {
    console.error('Error searching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to search leaderboard' }
    });
  }
});

// Get leaderboard trends
router.get('/trends', async (req, res) => {
  try {
    const { timeframe = 7 } = req.query; // days
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeframe));
    
    const trends = await LeaderboardEntry.aggregate([
      { $unwind: '$history' },
      { $match: { 'history.date': { $gte: cutoff } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$history.date' } },
            user_id: '$user_id'
          },
          username: { $first: '$username' },
          faction: { $first: '$faction' },
          rank: { $first: '$history.rank' },
          score: { $first: '$history.score' },
          level: { $first: '$history.level' },
          battles_won: { $first: '$history.battles_won' },
          stg_balance: { $first: '$history.stg_balance' }
        }
      },
      { $sort: { '_id.date': 1, rank: 1 } },
      {
        $group: {
          _id: '$_id.date',
          top_players: { $push: '$$ROOT' },
          average_score: { $avg: '$score' },
          average_level: { $avg: '$level' },
          total_battles_won: { $sum: '$battles_won' },
          total_stg_in_circulation: { $sum: '$stg_balance' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        timeframe: timeframe,
        trends: trends
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard trends:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch leaderboard trends' }
    });
  }
});

// Force rank update (admin only)
router.post('/update-ranks', async (req, res) => {
  try {
    await LeaderboardEntry.updateRanks();
    
    res.json({
      success: true,
      message: 'Leaderboard ranks updated successfully'
    });
  } catch (error) {
    console.error('Error updating leaderboard ranks:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update leaderboard ranks' }
    });
  }
});

module.exports = router;
