const { query, getClient } = require('../database/connection');
const { setTerritoryControl, getTerritoryControl, updateLeaderboard } = require('../utils/redis');
const telegramBot = require('../telegram/bot');

class TerritoryService {
  static async getAllTerritories() {
    try {
      const result = await query(`
        SELECT 
          t.*,
          CASE 
            WHEN t.iran_score > t.usa_score THEN 'iran'
            WHEN t.usa_score > t.iran_score THEN 'usa'
            ELSE 'neutral'
          END as current_controller,
          GREATEST(t.iran_score, t.usa_score) as leading_score
        FROM territories t
        WHERE t.is_active = true
        ORDER BY t.name
      `);

      return result.rows;
    } catch (error) {
      console.error('Failed to get territories:', error);
      return [];
    }
  }

  static async getTerritoryById(territoryId) {
    try {
      const result = await query(
        'SELECT * FROM territories WHERE id = $1 AND is_active = true',
        [territoryId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const territory = result.rows[0];
      
      // Determine current controller
      territory.current_controller = territory.iran_score > territory.usa_score ? 'iran' :
                                   territory.usa_score > territory.iran_score ? 'usa' : 'neutral';
      territory.leading_score = Math.max(territory.iran_score, territory.usa_score);

      return territory;
    } catch (error) {
      console.error('Failed to get territory:', error);
      return null;
    }
  }

  static async captureTerritory(territoryId, userId, faction, score) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get territory and lock it
      const territoryResult = await client.query(
        'SELECT * FROM territories WHERE id = $1 AND is_active = true FOR UPDATE',
        [territoryId]
      );

      if (territoryResult.rows.length === 0) {
        throw new Error('Territory not found');
      }

      const territory = territoryResult.rows[0];

      // Update territory scores
      const updateColumn = faction === 'iran' ? 'iran_score' : 'usa_score';
      await client.query(
        `UPDATE territories 
         SET ${updateColumn} = ${updateColumn} + $1, 
             total_battles = total_battles + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [score, territoryId]
      );

      // Check if control changed
      const newIranScore = territory.iran_score + (faction === 'iran' ? score : 0);
      const newUsaScore = territory.usa_score + (faction === 'usa' ? score : 0);
      
      let controlChanged = false;
      let newController = territory.controlling_faction;

      if (newIranScore > newUsaScore && territory.controlling_faction !== 'iran') {
        newController = 'iran';
        controlChanged = true;
      } else if (newUsaScore > newIranScore && territory.controlling_faction !== 'usa') {
        newController = 'usa';
        controlChanged = true;
      } else if (newIranScore === newUsaScore && territory.controlling_faction !== 'neutral') {
        newController = 'neutral';
        controlChanged = true;
      }

      if (controlChanged) {
        await client.query(
          'UPDATE territories SET controlling_faction = $1, last_capture_time = CURRENT_TIMESTAMP WHERE id = $2',
          [newController, territoryId]
        );
      }

      // Record territory battle
      await client.query(`
        INSERT INTO user_events (user_id, event_id, participation_data, rewards_earned)
        VALUES ($1, 
                (SELECT id FROM game_events WHERE event_type = 'territory_battle' AND is_active = true LIMIT 1),
                $2, $3)
      `, [
          userId,
          JSON.stringify({ territoryId, faction, score, controlChanged }),
          JSON.stringify({ score, controlChanged: controlChanged ? 50 : 10 })
        ]);

      await client.query('COMMIT');

      // Update Redis cache
      await setTerritoryControl(territoryId, newController, Math.max(newIranScore, newUsaScore));

      // Broadcast territory update
      if (global.broadcastToFaction) {
        global.broadcastToFaction('iran', {
          type: 'territory_update',
          data: {
            territoryId,
            iranScore: newIranScore,
            usaScore: newUsaScore,
            controller: newController
          }
        });
        
        global.broadcastToFaction('usa', {
          type: 'territory_update',
          data: {
            territoryId,
            iranScore: newIranScore,
            usaScore: newUsaScore,
            controller: newController
          }
        });
      }

      // If control changed, notify both factions
      if (controlChanged) {
        const user = await query('SELECT username, first_name FROM users WHERE id = $1', [userId]);
        const userName = user.rows[0].first_name || user.rows[0].username;
        
        const message = `🏰 Territory Control Changed!\n\n${userName} captured ${territory.name} for Team ${newController === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!\n\nKeep fighting to control the map!`;
        
        await telegramBot.broadcastToFaction('iran', message);
        await telegramBot.broadcastToFaction('usa', message);
      }

      return {
        success: true,
        territory: {
          id: territoryId,
          name: territory.name,
          iranScore: newIranScore,
          usaScore: newUsaScore,
          controller: newController,
          controlChanged
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getTerritoryLeaderboard() {
    try {
      const result = await query(`
        SELECT 
          t.id,
          t.name,
          t.controlling_faction,
          t.iran_score,
          t.usa_score,
          t.total_battles,
          t.last_capture_time,
          CASE 
            WHEN t.iran_score > t.usa_score THEN t.iran_score - t.usa_score
            WHEN t.usa_score > t.iran_score THEN t.usa_score - t.iran_score
            ELSE 0
          END as score_difference
        FROM territories t
        WHERE t.is_active = true
        ORDER BY GREATEST(t.iran_score, t.usa_score) DESC, t.total_battles DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Failed to get territory leaderboard:', error);
      return [];
    }
  }

  static async getFactionTerritoryStats() {
    try {
      const result = await query(`
        SELECT 
          controlling_faction,
          COUNT(*) as territory_count,
          SUM(total_battles) as total_battles,
          SUM(iran_score) as total_iran_score,
          SUM(usa_score) as total_usa_score
        FROM territories
        WHERE is_active = true
        GROUP BY controlling_faction
        ORDER BY territory_count DESC
      `);

      const stats = {
        iran: { territory_count: 0, total_battles: 0, total_score: 0 },
        usa: { territory_count: 0, total_battles: 0, total_score: 0 },
        neutral: { territory_count: 0, total_battles: 0, total_score: 0 }
      };

      result.rows.forEach(row => {
        stats[row.controlling_faction] = {
          territory_count: parseInt(row.territory_count),
          total_battles: parseInt(row.total_battles),
          total_score: row.controlling_faction === 'iran' ? parseInt(row.total_iran_score) : 
                     row.controlling_faction === 'usa' ? parseInt(row.total_usa_score) : 0
        };
      });

      return stats;
    } catch (error) {
      console.error('Failed to get faction territory stats:', error);
      return {
        iran: { territory_count: 0, total_battles: 0, total_score: 0 },
        usa: { territory_count: 0, total_battles: 0, total_score: 0 },
        neutral: { territory_count: 0, total_battles: 0, total_score: 0 }
      };
    }
  }

  static async startTerritoryEvent( eventData ) {
    try {
      const { title, description, duration, rewards } = eventData;

      const result = await query(`
        INSERT INTO game_events (event_type, title, description, start_time, end_time, rewards, is_active)
        VALUES ('territory_war', $1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${duration} minutes', $3, true)
        RETURNING *
      `, [title, description, JSON.stringify(rewards)]);

      // Notify all users
      const message = `⚔️ Territory War Event Started!\n\n${title}\n${description}\n\nDuration: ${duration} minutes\nPrizes: ${JSON.stringify(rewards)}\n\nJoin the battle now!`;
      
      await telegramBot.broadcastToFaction('iran', message);
      await telegramBot.broadcastToFaction('usa', message);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to start territory event:', error);
      throw error;
    }
  }

  static async endTerritoryEvent(eventId) {
    try {
      const result = await query(`
        UPDATE game_events 
        SET is_active = false, end_time = CURRENT_TIMESTAMP
        WHERE id = $1 AND event_type = 'territory_war'
        RETURNING *
      `, [eventId]);

      if (result.rows.length > 0) {
        const event = result.rows[0];
        
        // Calculate rewards based on territory control
        const stats = await this.getFactionTerritoryStats();
        const winner = stats.iran.territory_count > stats.usa.territory_count ? 'iran' : 
                     stats.usa.territory_count > stats.iran.territory_count ? 'usa' : 'neutral';

        const message = `🏆 Territory War Event Ended!\n\nWinner: Team ${winner === 'iran' ? 'Iran 🇮🇷' : winner === 'usa' ? 'USA 🇺🇸' : 'Neutral ⚪'}!\n\nThanks for participating!`;
        
        await telegramBot.broadcastToFaction('iran', message);
        await telegramBot.broadcastToFaction('usa', message);

        return event;
      }

      return null;
    } catch (error) {
      console.error('Failed to end territory event:', error);
      throw error;
    }
  }

  static async getUserTerritoryHistory(userId, limit = 10) {
    try {
      const result = await query(`
        SELECT 
          ue.*,
          ge.title as event_title,
          t.name as territory_name
        FROM user_events ue
        LEFT JOIN game_events ge ON ue.event_id = ge.id
        LEFT JOIN territories t ON ue.participation_data->>'territoryId' = t.id::text
        WHERE ue.user_id = $1 AND ge.event_type = 'territory_battle'
        ORDER BY ue.created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('Failed to get user territory history:', error);
      return [];
    }
  }

  static async resetTerritories() {
    try {
      await query(`
        UPDATE territories 
        SET iran_score = 0, 
            usa_score = 0, 
            total_battles = 0, 
            controlling_faction = 'neutral',
            last_capture_time = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE is_active = true
      `);

      // Clear Redis cache
      const redis = require('../utils/redis').getRedis();
      const keys = await redis.keys('territory:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      console.log('Territories reset successfully');
      return true;
    } catch (error) {
      console.error('Failed to reset territories:', error);
      return false;
    }
  }

  static async getTerritoryControlMap() {
    try {
      const territories = await this.getAllTerritories();
      
      const mapData = territories.map(territory => ({
        id: territory.id,
        name: territory.name,
        controller: territory.current_controller,
        iranScore: territory.iran_score,
        usaScore: territory.usaScore,
        totalBattles: territory.total_battles,
        lastCapture: territory.last_capture_time
      }));

      return {
        territories: mapData,
        stats: await this.getFactionTerritoryStats(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get territory control map:', error);
      return {
        territories: [],
        stats: { iran: { territory_count: 0 }, usa: { territory_count: 0 }, neutral: { territory_count: 0 } },
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

module.exports = TerritoryService;
