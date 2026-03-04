const { query, getClient } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(telegramUser) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const referralCode = uuidv4().substring(0, 8).toUpperCase();
      
      const result = await client.query(`
        INSERT INTO users (telegram_id, username, first_name, last_name, faction, referral_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        telegramUser.id,
        telegramUser.username,
        telegramUser.first_name,
        telegramUser.last_name,
        telegramUser.faction,
        referralCode
      ]);

      const user = result.rows[0];

      // Create initial transaction record
      await client.query(`
        INSERT INTO transactions (user_id, type, amount, balance_after, description)
        VALUES ($1, 'stg', 100, 100, 'Welcome bonus')
      `, [user.id]);

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByTelegramId(telegramId) {
    const result = await query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByReferralCode(referralCode) {
    const result = await query(
      'SELECT * FROM users WHERE referral_code = $1',
      [referralCode]
    );
    return result.rows[0];
  }

  static async updateBalance(userId, amount, type = 'stg') {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const balanceColumn = type === 'stg' ? 'stg_balance' : 'win_claimable';
      
      const result = await client.query(`
        UPDATE users 
        SET ${balanceColumn} = ${balanceColumn} + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING ${balanceColumn}
      `, [amount, userId]);

      const newBalance = result.rows[0][balanceColumn];

      // Record transaction
      await client.query(`
        INSERT INTO transactions (user_id, type, amount, balance_after, description)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, type, amount, newBalance, `${type.toUpperCase()} balance update`]);

      await client.query('COMMIT');
      return newBalance;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async setFaction(userId, faction) {
    const result = await query(
      'UPDATE users SET faction = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [faction, userId]
    );
    return result.rows[0];
  }

  static async setTonWallet(userId, walletAddress) {
    const result = await query(
      'UPDATE users SET ton_wallet_address = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [walletAddress, userId]
    );
    return result.rows[0];
  }

  static async addExperience(userId, experience) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get current user data
      const userResult = await client.query(
        'SELECT experience, level FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      
      const user = userResult.rows[0];
      const newExperience = user.experience + experience;
      
      // Calculate new level (1000 XP per level)
      const newLevel = Math.floor(newExperience / 1000) + 1;
      
      const result = await client.query(`
        UPDATE users 
        SET experience = $1, level = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [newExperience, newLevel, userId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getLeaderboard(limit = 50, faction = null) {
    let queryText = `
      SELECT id, username, first_name, faction, stg_balance, level, experience
      FROM users
    `;
    let params = [];

    if (faction) {
      queryText += ' WHERE faction = $1';
      params.push(faction);
    }

    queryText += ' ORDER BY stg_balance DESC, experience DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(queryText, params);
    return result.rows;
  }

  static async getReferrals(userId) {
    const result = await query(`
      SELECT id, username, first_name, created_at, stg_balance, level
      FROM users 
      WHERE referred_by = $1 
      ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
  }

  static async getStats(userId) {
    const result = await query(`
      SELECT 
        u.*,
        COUNT(DISTINCT CASE WHEN b.winner_id = u.id THEN b.id END) as battles_won,
        COUNT(DISTINCT CASE WHEN b.attacker_id = u.id OR b.defender_id = u.id THEN b.id END) as battles_total,
        COUNT(DISTINCT CASE WHEN um.is_completed = true THEN um.id END) as missions_completed,
        COUNT(DISTINCT r.id) as referrals_count
      FROM users u
      LEFT JOIN battles b ON (u.id = b.attacker_id OR u.id = b.defender_id)
      LEFT JOIN user_missions um ON u.id = um.user_id
      LEFT JOIN users r ON u.id = r.referred_by
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);
    
    return result.rows[0];
  }

  static async deactivate(userId) {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = User;
