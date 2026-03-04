const GameService = require('../services/gameService');
const User = require('../models/User');
const { checkRateLimit } = require('../utils/redis');

class GameController {
  static async tapToEarn(req, res) {
    try {
      const userId = req.user.id;

      // Check rate limit for tap endpoint
      const rateLimitKey = `tap_endpoint:${userId}`;
      const isAllowed = await checkRateLimit(userId, rateLimitKey, 100, 60000); // 100 taps per minute
      
      if (!isAllowed) {
        return res.status(429).json({ error: 'Too many tap requests. Please slow down.' });
      }

      const result = await GameService.tapToEarn(userId);
      
      // Broadcast update to user's WebSocket connections
      if (global.broadcastToUsers) {
        global.broadcastToUsers(userId, {
          type: 'balance_update',
          data: {
            stg_balance: result.newBalance,
            experience: result.experience,
            level: result.level
          }
        });
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async initiateBattle(req, res) {
    try {
      const { defenderId, wager } = req.body;
      const attackerId = req.user.id;

      if (!defenderId || !wager) {
        return res.status(400).json({ error: 'Defender ID and wager are required' });
      }

      if (defenderId === attackerId) {
        return res.status(400).json({ error: 'Cannot battle yourself' });
      }

      const result = await GameService.initiateBattle(attackerId, defenderId, wager);
      
      // Broadcast to both players
      if (global.broadcastToUsers) {
        global.broadcastToUsers(attackerId, {
          type: 'battle_initiated',
          data: result.battle
        });
        global.broadcastToUsers(defenderId, {
          type: 'battle_challenge',
          data: result.battle
        });
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async acceptBattle(req, res) {
    try {
      const { battleId } = req.body;
      const defenderId = req.user.id;

      if (!battleId) {
        return res.status(400).json({ error: 'Battle ID is required' });
      }

      const result = await GameService.acceptBattle(battleId, defenderId);
      
      // Broadcast battle result to both players
      if (global.broadcastToUsers) {
        const battle = await GameService.getBattleById(battleId);
        global.broadcastToUsers(battle.attacker_id, {
          type: 'battle_completed',
          data: result
        });
        global.broadcastToUsers(battle.defender_id, {
          type: 'battle_completed',
          data: result
        });
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getBattleHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      
      const battles = await GameService.getBattleHistory(userId, limit);
      res.json({ battles });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBattleStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await GameService.getUserStats(userId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableOpponents(req, res) {
    try {
      const userId = req.user.id;
      const faction = req.query.faction || null;
      const limit = parseInt(req.query.limit) || 10;
      
      const opponents = await GameService.getAvailableOpponents(userId, faction, limit);
      res.json({ opponents });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getGameState(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user data
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user stats
      const stats = await GameService.getUserStats(userId);
      
      // Get recent battles
      const recentBattles = await GameService.getBattleHistory(userId, 5);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          faction: user.faction,
          stg_balance: user.stg_balance,
          win_claimable: user.win_claimable,
          level: user.level,
          experience: user.experience
        },
        stats,
        recentBattles
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async selectFaction(req, res) {
    try {
      const { faction } = req.body;
      const userId = req.user.id;

      if (!faction || !['iran', 'usa'].includes(faction)) {
        return res.status(400).json({ error: 'Invalid faction. Must be "iran" or "usa"' });
      }

      const user = await User.setFaction(userId, faction);
      
      // Broadcast faction selection
      if (global.broadcastToFaction) {
        global.broadcastToFaction(faction, {
          type: 'new_member',
          data: {
            username: user.username,
            first_name: user.first_name
          }
        });
      }

      res.json({ 
        success: true, 
        faction: user.faction,
        message: `You have joined Team ${faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLeaderboard(req, res) {
    try {
      const type = req.query.type || 'global';
      const faction = req.query.faction || null;
      const limit = parseInt(req.query.limit) || 50;

      let leaderboard;
      if (type === 'faction' && faction) {
        leaderboard = await User.getLeaderboard(limit, faction);
      } else {
        leaderboard = await User.getLeaderboard(limit);
      }

      res.json({ 
        type,
        faction,
        leaderboard: leaderboard.map((user, index) => ({
          rank: index + 1,
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          faction: user.faction,
          stg_balance: user.stg_balance,
          level: user.level
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GameController;
