// Enhanced Battle Database Schema
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/team_iran_vs_usa'
});

// Initialize battle tables
const initializeBattleTables = async () => {
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/battle_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    console.log('✅ Battle tables initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize battle tables:', error);
    throw error;
  }
};

// Battle CRUD operations
class BattleModel {
  // Create new battle
  static async create(battleData) {
    const {
      player1_id,
      player2_id,
      wager,
      weapon1_id,
      weapon2_id,
      territory_id,
      game_mode = 'standard'
    } = battleData;
    
    try {
      const query = `
        INSERT INTO battles (
          player1_id, player2_id, wager, weapon1_id, weapon2_id,
          territory_id, game_mode, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
        RETURNING *
      `;
      
      const values = [
        player1_id, player2_id, wager, weapon1_id, weapon2_id,
        territory_id, game_mode
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to create battle:', error);
      throw error;
    }
  }
  
  // Get battle by ID
  static async findById(battleId) {
    try {
      const query = `
        SELECT 
          b.*,
          p1.username as player1_username,
          p1.faction as player1_faction,
          p1.level as player1_level,
          p2.username as player2_username,
          p2.faction as player2_faction,
          p2.level as player2_level,
          t.name as territory_name,
          t.controller as territory_controller
        FROM battles b
        LEFT JOIN users p1 ON b.player1_id = p1.id
        LEFT JOIN users p2 ON b.player2_id = p2.id
        LEFT JOIN territories t ON b.territory_id = t.id
        WHERE b.id = $1
      `;
      
      const result = await pool.query(query, [battleId]);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to get battle:', error);
      throw error;
    }
  }
  
  // Update battle state
  static async updateState(battleId, stateData) {
    try {
      const {
        current_turn,
        turn_count,
        battle_data,
        status
      } = stateData;
      
      const query = `
        UPDATE battles 
        SET current_turn = $1, turn_count = $2, battle_data = $3, status = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      
      const values = [
        current_turn, turn_count, JSON.stringify(battle_data), status, battleId
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to update battle state:', error);
      throw error;
    }
  }
  
  // Complete battle
  static async complete(battleId, completionData) {
    try {
      const {
        winner_id,
        loser_id,
        battle_quality,
        duration,
        final_stats
      } = completionData;
      
      const query = `
        UPDATE battles 
        SET winner_id = $1, loser_id = $2, battle_quality = $3,
            duration = $4, final_stats = $5, status = 'completed',
            completed_at = NOW(), updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      
      const values = [
        winner_id, loser_id, battle_quality, duration,
        JSON.stringify(final_stats), battleId
      ];
      
      const result = await pool.query(query, values);
      
      // Create battle rewards
      await this.createRewards(battleId, completionData);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to complete battle:', error);
      throw error;
    }
  }
  
  // Create battle rewards
  static async createRewards(battleId, completionData) {
    try {
      const { winner_id, loser_id, wager, battle_quality } = completionData;
      
      // Quality multipliers
      const qualityMultipliers = {
        domination: 2.0,
        victory: 1.5,
        win: 1.2,
        struggle: 1.0
      };
      
      const multiplier = qualityMultipliers[battle_quality] || 1.0;
      const winnerReward = Math.round(wager * 2 * multiplier);
      const winnerExperience = Math.round(wager * 0.5 * multiplier);
      const loserExperience = Math.round(wager * 0.1 * multiplier);
      
      // Winner rewards
      await pool.query(`
        INSERT INTO battle_rewards (
          battle_id, user_id, reward_type, amount, experience, battle_quality
        ) VALUES ($1, $2, 'stg', $3, $4, $5)
      `, [battleId, winner_id, winnerReward, winnerExperience, battle_quality]);
      
      // Loser rewards
      await pool.query(`
        INSERT INTO battle_rewards (
          battle_id, user_id, reward_type, amount, experience, battle_quality
        ) VALUES ($1, $2, 'stg', 0, $3, $4)
      `, [battleId, loser_id, loserExperience, battle_quality]);
      
      // Update user balances
      await pool.query(`
        UPDATE users 
        SET stg_balance = stg_balance + $1, experience = experience + $2,
            updated_at = NOW()
        WHERE id = $3
      `, [winnerReward, winnerExperience, winner_id]);
      
      await pool.query(`
        UPDATE users 
        SET experience = experience + $1, updated_at = NOW()
        WHERE id = $2
      `, [loserExperience, loser_id]);
      
      console.log(`💰 Battle rewards created - Winner: ${winnerReward} STG, ${winnerExperience} XP`);
      
    } catch (error) {
      console.error('❌ Failed to create battle rewards:', error);
      throw error;
    }
  }
  
  // Get user's battle history
  static async getUserHistory(userId, limit = 10, offset = 0) {
    try {
      const query = `
        SELECT 
          b.*,
          opponent.username as opponent_username,
          opponent.faction as opponent_faction,
          opponent.level as opponent_level,
          CASE 
            WHEN b.player1_id = $1 THEN b.player2_id 
            ELSE b.player1_id 
          END as opponent_id,
          CASE 
            WHEN b.winner_id = $1 THEN 'win' 
            WHEN b.winner_id IS NULL THEN 'ongoing'
            ELSE 'lose' 
          END as result,
          br.amount as stg_reward,
          br.experience as experience_gained
        FROM battles b
        LEFT JOIN users opponent ON (
          (b.player1_id = $1 AND opponent.id = b.player2_id) OR
          (b.player2_id = $1 AND opponent.id = b.player1_id)
        )
        LEFT JOIN battle_rewards br ON br.battle_id = b.id AND br.user_id = $1
        WHERE (b.player1_id = $1 OR b.player2_id = $1)
        ORDER BY b.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get user battle history:', error);
      throw error;
    }
  }
  
  // Get user battle statistics
  static async getUserStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_battles,
          COUNT(CASE WHEN winner_id = $1 THEN 1 END) as wins,
          COUNT(CASE WHEN winner_id != $1 AND winner_id IS NOT NULL THEN 1 END) as losses,
          AVG(wager) as average_wager,
          SUM(CASE WHEN winner_id = $1 THEN wager * 2 ELSE 0 END) as total_earnings,
          COUNT(CASE WHEN battle_quality = 'domination' THEN 1 END) as domination_count,
          COUNT(CASE WHEN battle_quality = 'victory' THEN 1 END) as victory_count,
          COUNT(CASE WHEN battle_quality = 'win' THEN 1 END) as win_count,
          COUNT(CASE WHEN battle_quality = 'struggle' THEN 1 END) as struggle_count
        FROM battles
        WHERE (player1_id = $1 OR player2_id = $1)
        AND status = 'completed'
      `;
      
      const result = await pool.query(query, [userId]);
      const stats = result.rows[0];
      
      // Calculate win rate
      stats.win_rate = stats.total_battles > 0 
        ? ((stats.wins / stats.total_battles) * 100).toFixed(2)
        : 0;
      
      // Get favorite weapon
      const weaponQuery = `
        SELECT weapon_id, COUNT(*) as usage_count
        FROM battles
        WHERE (player1_id = $1 AND weapon1_id IS NOT NULL) OR
              (player2_id = $1 AND weapon2_id IS NOT NULL)
        GROUP BY weapon_id
        ORDER BY usage_count DESC
        LIMIT 1
      `;
      
      const weaponResult = await pool.query(weaponQuery, [userId]);
      stats.favorite_weapon = weaponResult.rows[0]?.weapon_id || null;
      
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to get user battle stats:', error);
      throw error;
    }
  }
  
  // Get active battles
  static async getActiveBattles() {
    try {
      const query = `
        SELECT 
          b.*,
          p1.username as player1_username,
          p1.faction as player1_faction,
          p2.username as player2_username,
          p2.faction as player2_faction
        FROM battles b
        LEFT JOIN users p1 ON b.player1_id = p1.id
        LEFT JOIN users p2 ON b.player2_id = p2.id
        WHERE b.status = 'active'
        ORDER BY b.created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get active battles:', error);
      throw error;
    }
  }
  
  // Get battle queue
  static async getQueue() {
    try {
      const query = `
        SELECT 
          bq.*,
          u.username,
          u.faction,
          u.level
        FROM battle_queue bq
        LEFT JOIN users u ON bq.user_id = u.id
        WHERE bq.status = 'waiting'
        ORDER BY bq.joined_at ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get battle queue:', error);
      throw error;
    }
  }
  
  // Add user to queue
  static async addToQueue(queueData) {
    try {
      const {
        user_id,
        game_mode = 'standard',
        wager,
        weapon_id,
        territory_id
      } = queueData;
      
      const query = `
        INSERT INTO battle_queue (
          user_id, game_mode, wager, weapon_id, territory_id, 
          status, joined_at
        ) VALUES ($1, $2, $3, $4, $5, 'waiting', NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          game_mode = EXCLUDED.game_mode,
          wager = EXCLUDED.wager,
          weapon_id = EXCLUDED.weapon_id,
          territory_id = EXCLUDED.territory_id,
          joined_at = NOW()
        RETURNING *
      `;
      
      const values = [user_id, game_mode, wager, weapon_id, territory_id];
      const result = await pool.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to add to queue:', error);
      throw error;
    }
  }
  
  // Remove user from queue
  static async removeFromQueue(userId) {
    try {
      const query = `
        DELETE FROM battle_queue 
        WHERE user_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to remove from queue:', error);
      throw error;
    }
  }
  
  // Find match in queue
  static async findMatch(userId) {
    try {
      const query = `
        SELECT bq2.*
        FROM battle_queue bq1
        JOIN battle_queue bq2 ON (
          bq1.user_id != bq2.user_id AND
          bq1.game_mode = bq2.game_mode AND
          ABS(bq1.wager - bq2.wager) <= (bq1.wager * 0.2)
        )
        WHERE bq1.user_id = $1
        ORDER BY bq2.joined_at ASC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to find match:', error);
      throw error;
    }
  }
  
  // Create battle actions log
  static async logAction(battleId, actionData) {
    try {
      const {
        player_id,
        action_type,
        action_data,
        turn_number
      } = actionData;
      
      const query = `
        INSERT INTO battle_actions (
          battle_id, player_id, action_type, action_data, turn_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const values = [battleId, player_id, action_type, JSON.stringify(action_data), turn_number];
      const result = await pool.query(query, values);
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to log battle action:', error);
      throw error;
    }
  }
  
  // Get battle actions
  static async getBattleActions(battleId) {
    try {
      const query = `
        SELECT 
          ba.*,
          u.username
        FROM battle_actions ba
        LEFT JOIN users u ON ba.player_id = u.id
        WHERE ba.battle_id = $1
        ORDER BY ba.turn_number ASC, ba.created_at ASC
      `;
      
      const result = await pool.query(query, [battleId]);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get battle actions:', error);
      throw error;
    }
  }
}

module.exports = {
  BattleModel,
  initializeBattleTables,
  pool
};
