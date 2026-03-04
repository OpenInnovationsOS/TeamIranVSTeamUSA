const { query, getClient } = require('../database/connection');
const User = require('../models/User');
const { updateLeaderboard, getCache, setCache } = require('../utils/redis');
const telegramBot = require('../telegram/bot');

class ReferralService {
  static async processReferral(referralCode, newUserId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Find referrer by code
      const referrerResult = await client.query(
        'SELECT * FROM users WHERE referral_code = $1 AND is_active = true',
        [referralCode]
      );

      if (referrerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Invalid referral code' };
      }

      const referrer = referrerResult.rows[0];

      // Check if already referred
      const existingReferral = await client.query(
        'SELECT * FROM users WHERE id = $1 AND referred_by IS NOT NULL',
        [newUserId]
      );

      if (existingReferral.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'User already referred' };
      }

      // Update new user with referrer
      await client.query(
        'UPDATE users SET referred_by = $1 WHERE id = $2',
        [referrer.id, newUserId]
      );

      // Calculate referral bonus
      const referralBonus = parseInt(process.env.REFERRAL_BONUS) || 50;
      
      // Add bonus to referrer
      await client.query(
        'UPDATE users SET stg_balance = stg_balance + $1 WHERE id = $2',
        [referralBonus, referrer.id]
      );

      // Record transactions
      await client.query(
        'INSERT INTO transactions (user_id, type, amount, balance_after, description, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          referrer.id,
          'stg',
          referralBonus,
          referrer.stg_balance + referralBonus,
          'Referral bonus',
          JSON.stringify({ referralCode, referredUserId: newUserId })
        ]
      );

      // Add bonus to new user
      const newUserBonus = Math.floor(referralBonus * 0.5); // 50% of referrer bonus
      await client.query(
        'UPDATE users SET stg_balance = stg_balance + $1 WHERE id = $2',
        [newUserBonus, newUserId]
      );

      await client.query(
        'INSERT INTO transactions (user_id, type, amount, balance_after, description, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          newUserId,
          'stg',
          newUserBonus,
          newUserBonus, // New user starts with 0, so balance is just the bonus
          'Welcome bonus from referral',
          JSON.stringify({ referralCode, referrerId: referrer.id })
        ]
      );

      // Update leaderboards
      await updateLeaderboard('global', referrer.id, referrer.stg_balance + referralBonus);
      await updateLeaderboard(referrer.faction, referrer.id, referrer.stg_balance + referralBonus);

      await client.query('COMMIT');

      // Send notifications
      await telegramBot.notifyUser(
        referrer.telegram_id,
        `🎉 Referral Success!\nSomeone joined using your referral code and earned you ${referralBonus} STG!\n\nKeep sharing to earn more!`
      );

      // Cache referral stats
      await this.updateReferralStats(referrer.id);

      return {
        success: true,
        referrerBonus,
        newUserBonus,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          first_name: referrer.first_name
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getReferralStats(userId) {
    try {
      // Check cache first
      const cacheKey = `referral_stats:${userId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await query(`
        SELECT 
          COUNT(*) as total_referrals,
          COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as weekly_referrals,
          COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as monthly_referrals,
          COALESCE(SUM(CASE WHEN t.type = 'stg' AND t.description LIKE '%Referral bonus%' THEN t.amount END), 0) as total_earned
        FROM users u
        LEFT JOIN transactions t ON u.id = t.user_id
        WHERE u.referred_by = $1
      `, [userId]);

      const stats = result.rows[0];

      // Cache for 5 minutes
      await setCache(cacheKey, stats, 300);

      return stats;
    } catch (error) {
      console.error('Failed to get referral stats:', error);
      return {
        total_referrals: 0,
        weekly_referrals: 0,
        monthly_referrals: 0,
        total_earned: 0
      };
    }
  }

  static async updateReferralStats(userId) {
    try {
      const stats = await this.getReferralStats(userId);
      const cacheKey = `referral_stats:${userId}`;
      await setCache(cacheKey, stats, 300);
    } catch (error) {
      console.error('Failed to update referral stats:', error);
    }
  }

  static async getReferralLeaderboard(limit = 50) {
    try {
      const cacheKey = 'referral_leaderboard';
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await query(`
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.faction,
          COUNT(r.id) as referral_count,
          COALESCE(SUM(CASE WHEN t.type = 'stg' AND t.description LIKE '%Referral bonus%' THEN t.amount END), 0) as total_earned
        FROM users u
        LEFT JOIN users r ON u.id = r.referred_by
        LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'stg' AND t.description LIKE '%Referral bonus%'
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.first_name, u.faction
        HAVING COUNT(r.id) > 0
        ORDER BY referral_count DESC, total_earned DESC
        LIMIT $1
      `, [limit]);

      const leaderboard = result.rows;

      // Cache for 10 minutes
      await setCache(cacheKey, leaderboard, 600);

      return leaderboard;
    } catch (error) {
      console.error('Failed to get referral leaderboard:', error);
      return [];
    }
  }

  static async processSocialShare(userId, platform, content) {
    try {
      // Validate platform
      const validPlatforms = ['telegram', 'twitter', 'instagram', 'facebook'];
      if (!validPlatforms.includes(platform)) {
        throw new Error('Invalid platform');
      }

      // Check rate limit for social shares
      const cacheKey = `social_share:${userId}:${platform}`;
      const existing = await getCache(cacheKey);
      if (existing) {
        return { success: false, error: 'Share cooldown active' };
      }

      // Calculate share reward
      const shareReward = this.calculateShareReward(platform, userId);

      // Add reward to user
      const newBalance = await User.updateBalance(userId, shareReward, 'stg');

      // Record transaction
      await query(`
        INSERT INTO transactions (user_id, type, amount, balance_after, description, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        'stg',
        shareReward,
        newBalance,
        `Social share bonus (${platform})`,
        JSON.stringify({ platform, content })
      ]);

      // Update leaderboard
      const user = await User.findById(userId);
      await updateLeaderboard('global', userId, newBalance);
      await updateLeaderboard(user.faction, userId, newBalance);

      // Cache share to prevent spam (1 hour cooldown)
      await setCache(cacheKey, true, 3600);

      // Update user's social share count
      await this.updateSocialShareStats(userId, platform);

      return {
        success: true,
        reward: shareReward,
        newBalance,
        platform
      };
    } catch (error) {
      console.error('Failed to process social share:', error);
      return { success: false, error: error.message };
    }
  }

  static calculateShareReward(platform, userId) {
    const baseRewards = {
      telegram: 10,
      twitter: 15,
      instagram: 12,
      facebook: 8
    };

    const baseReward = baseRewards[platform] || 5;

    // Bonus for users with more referrals
    const stats = this.getReferralStats(userId);
    const referralMultiplier = Math.min(1 + (stats.total_referrals * 0.1), 2); // Max 2x

    return Math.floor(baseReward * referralMultiplier);
  }

  static async updateSocialShareStats(userId, platform) {
    try {
      const cacheKey = `social_share_stats:${userId}`;
      let stats = await getCache(cacheKey) || {
        telegram: 0,
        twitter: 0,
        instagram: 0,
        facebook: 0,
        total: 0
      };

      stats[platform] = (stats[platform] || 0) + 1;
      stats.total += 1;

      await setCache(cacheKey, stats, 3600); // Cache for 1 hour
    } catch (error) {
      console.error('Failed to update social share stats:', error);
    }
  }

  static async getSocialShareStats(userId) {
    try {
      const cacheKey = `social_share_stats:${userId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }

      // If not cached, initialize with zeros
      const stats = {
        telegram: 0,
        twitter: 0,
        instagram: 0,
        facebook: 0,
        total: 0
      };

      await setCache(cacheKey, stats, 3600);
      return stats;
    } catch (error) {
      console.error('Failed to get social share stats:', error);
      return {
        telegram: 0,
        twitter: 0,
        instagram: 0,
        facebook: 0,
        total: 0
      };
    }
  }

  static async getViralMetrics() {
    try {
      const cacheKey = 'viral_metrics';
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as daily_new_users,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as weekly_new_users,
          COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END) as total_referred_users,
          ROUND(COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as referral_rate,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' AND referred_by IS NOT NULL THEN 1 END) as daily_referrals
        FROM users
        WHERE is_active = true
      `);

      const metrics = result.rows[0];

      // Cache for 5 minutes
      await setCache(cacheKey, metrics, 300);

      return metrics;
    } catch (error) {
      console.error('Failed to get viral metrics:', error);
      return {
        total_users: 0,
        daily_new_users: 0,
        weekly_new_users: 0,
        total_referred_users: 0,
        referral_rate: 0,
        daily_referrals: 0
      };
    }
  }

  static async generateReferralLink(userId, referralCode) {
    const baseUrl = process.env.TELEGRAM_WEBAPP_URL || 'https://your-domain.com';
    return `${baseUrl}?start=${referralCode}`;
  }

  static async validateReferralCode(referralCode) {
    try {
      const result = await query(
        'SELECT id, username, first_name, faction FROM users WHERE referral_code = $1 AND is_active = true',
        [referralCode]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Failed to validate referral code:', error);
      return null;
    }
  }
}

module.exports = ReferralService;
