const TerritoryService = require('../services/territoryService');
const User = require('../models/User');

class TerritoryController {
  // Get all territories
  async getAllTerritories(req, res) {
    try {
      const territories = await TerritoryService.getAllTerritories();
      
      res.json({
        success: true,
        data: territories
      });
    } catch (error) {
      console.error('Failed to get territories:', error);
      res.status(500).json({ error: 'Failed to get territories' });
    }
  }

  // Get specific territory
  async getTerritory(req, res) {
    try {
      const { territoryId } = req.params;
      const territory = await TerritoryService.getTerritoryById(territoryId);

      if (!territory) {
        return res.status(404).json({ error: 'Territory not found' });
      }

      res.json({
        success: true,
        data: territory
      });
    } catch (error) {
      console.error('Failed to get territory:', error);
      res.status(500).json({ error: 'Failed to get territory' });
    }
  }

  // Capture territory
  async captureTerritory(req, res) {
    try {
      const { territoryId } = req.params;
      const { score } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!score || score <= 0) {
        return res.status(400).json({ error: 'Score must be greater than 0' });
      }

      if (!user.faction) {
        return res.status(400).json({ error: 'User must select a faction first' });
      }

      const result = await TerritoryService.captureTerritory(
        territoryId, 
        userId, 
        user.faction, 
        score
      );

      res.json({
        success: true,
        message: result.territory.controlChanged ? 
          'Territory captured successfully!' : 
          'Territory battle completed!',
        data: result.territory
      });
    } catch (error) {
      console.error('Failed to capture territory:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get territory leaderboard
  async getTerritoryLeaderboard(req, res) {
    try {
      const leaderboard = await TerritoryService.getTerritoryLeaderboard();

      res.json({
        success: true,
        data: leaderboard.map((territory, index) => ({
          rank: index + 1,
          id: territory.id,
          name: territory.name,
          controller: territory.controlling_faction,
          iranScore: territory.iran_score,
          usaScore: territory.usa_score,
          totalBattles: territory.total_battles,
          scoreDifference: territory.score_difference,
          lastCapture: territory.last_capture_time
        }))
      });
    } catch (error) {
      console.error('Failed to get territory leaderboard:', error);
      res.status(500).json({ error: 'Failed to get territory leaderboard' });
    }
  }

  // Get faction territory stats
  async getFactionTerritoryStats(req, res) {
    try {
      const stats = await TerritoryService.getFactionTerritoryStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to get faction territory stats:', error);
      res.status(500).json({ error: 'Failed to get faction territory stats' });
    }
  }

  // Get territory control map
  async getTerritoryControlMap(req, res) {
    try {
      const mapData = await TerritoryService.getTerritoryControlMap();

      res.json({
        success: true,
        data: mapData
      });
    } catch (error) {
      console.error('Failed to get territory control map:', error);
      res.status(500).json({ error: 'Failed to get territory control map' });
    }
  }

  // Get user territory history
  async getUserTerritoryHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const history = await TerritoryService.getUserTerritoryHistory(userId, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Failed to get user territory history:', error);
      res.status(500).json({ error: 'Failed to get user territory history' });
    }
  }

  // Start territory event (admin only)
  async startTerritoryEvent(req, res) {
    try {
      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { title, description, duration, rewards } = req.body;

      if (!title || !description || !duration) {
        return res.status(400).json({ error: 'Title, description, and duration required' });
      }

      const event = await TerritoryService.startTerritoryEvent({
        title,
        description,
        duration: parseInt(duration),
        rewards: rewards || {}
      });

      res.json({
        success: true,
        message: 'Territory event started successfully!',
        data: event
      });
    } catch (error) {
      console.error('Failed to start territory event:', error);
      res.status(500).json({ error: 'Failed to start territory event' });
    }
  }

  // End territory event (admin only)
  async endTerritoryEvent(req, res) {
    try {
      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { eventId } = req.params;

      const event = await TerritoryService.endTerritoryEvent(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Event not found or already ended' });
      }

      res.json({
        success: true,
        message: 'Territory event ended successfully!',
        data: event
      });
    } catch (error) {
      console.error('Failed to end territory event:', error);
      res.status(500).json({ error: 'Failed to end territory event' });
    }
  }

  // Reset territories (admin only)
  async resetTerritories(req, res) {
    try {
      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const success = await TerritoryService.resetTerritories();

      if (success) {
        res.json({
          success: true,
          message: 'All territories reset successfully!'
        });
      } else {
        res.status(500).json({ error: 'Failed to reset territories' });
      }
    } catch (error) {
      console.error('Failed to reset territories:', error);
      res.status(500).json({ error: 'Failed to reset territories' });
    }
  }

  // Get active territory events
  async getActiveTerritoryEvents(req, res) {
    try {
      const result = await require('../database/connection').query(`
        SELECT * FROM game_events 
        WHERE event_type = 'territory_war' AND is_active = true 
        ORDER BY start_time DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Failed to get active territory events:', error);
      res.status(500).json({ error: 'Failed to get active territory events' });
    }
  }
}

module.exports = new TerritoryController();
