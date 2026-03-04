const ReferralService = require('../services/referralService');
const User = require('../models/User');

class ReferralController {
  // Process referral when new user joins
  async processReferral(req, res) {
    try {
      const { referralCode } = req.body;
      const userId = req.user.id;

      if (!referralCode) {
        return res.status(400).json({ error: 'Referral code required' });
      }

      // Check if user already has a referrer
      const user = await User.findById(userId);
      if (user.referred_by) {
        return res.status(400).json({ error: 'User already has a referrer' });
      }

      const result = await ReferralService.processReferral(referralCode, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Referral processed successfully!',
          data: {
            referrerBonus: result.referrerBonus,
            newUserBonus: result.newUserBonus,
            referrer: result.referrer
          }
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Referral processing error:', error);
      res.status(500).json({ error: 'Failed to process referral' });
    }
  }

  // Get user's referral stats
  async getReferralStats(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      const stats = await ReferralService.getReferralStats(userId);
      const referralLink = await ReferralService.generateReferralLink(userId, user.referral_code);

      res.json({
        success: true,
        data: {
          referralCode: user.referral_code,
          referralLink,
          stats
        }
      });
    } catch (error) {
      console.error('Failed to get referral stats:', error);
      res.status(500).json({ error: 'Failed to get referral stats' });
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const leaderboard = await ReferralService.getReferralLeaderboard(limit);

      res.json({
        success: true,
        data: leaderboard.map((user, index) => ({
          rank: index + 1,
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          faction: user.faction,
          referral_count: user.referral_count,
          total_earned: user.total_earned
        }))
      });
    } catch (error) {
      console.error('Failed to get referral leaderboard:', error);
      res.status(500).json({ error: 'Failed to get referral leaderboard' });
    }
  }

  // Process social share
  async processSocialShare(req, res) {
    try {
      const { platform, content } = req.body;
      const userId = req.user.id;

      if (!platform || !content) {
        return res.status(400).json({ error: 'Platform and content required' });
      }

      const result = await ReferralService.processSocialShare(userId, platform, content);

      if (result.success) {
        res.json({
          success: true,
          message: `Share processed! Earned ${result.reward} STG`,
          data: {
            reward: result.reward,
            newBalance: result.newBalance,
            platform
          }
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Social share processing error:', error);
      res.status(500).json({ error: 'Failed to process social share' });
    }
  }

  // Get social share stats
  async getSocialShareStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await ReferralService.getSocialShareStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Failed to get social share stats:', error);
      res.status(500).json({ error: 'Failed to get social share stats' });
    }
  }

  // Get viral metrics (admin only)
  async getViralMetrics(req, res) {
    try {
      // Check if user is admin
      if (req.user.telegram_id.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const metrics = await ReferralService.getViralMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Failed to get viral metrics:', error);
      res.status(500).json({ error: 'Failed to get viral metrics' });
    }
  }

  // Validate referral code
  async validateReferralCode(req, res) {
    try {
      const { referralCode } = req.params;

      if (!referralCode) {
        return res.status(400).json({ error: 'Referral code required' });
      }

      const referrer = await ReferralService.validateReferralCode(referralCode);

      if (referrer) {
        res.json({
          success: true,
          data: {
            valid: true,
            referrer: {
              username: referrer.username,
              first_name: referrer.first_name,
              faction: referrer.faction
            }
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            valid: false
          }
        });
      }
    } catch (error) {
      console.error('Failed to validate referral code:', error);
      res.status(500).json({ error: 'Failed to validate referral code' });
    }
  }

  // Get user's referrals
  async getUserReferrals(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const referrals = await User.getReferrals(userId);

      res.json({
        success: true,
        data: referrals.slice(0, limit)
      });
    } catch (error) {
      console.error('Failed to get user referrals:', error);
      res.status(500).json({ error: 'Failed to get user referrals' });
    }
  }

  // Generate share content
  async generateShareContent(req, res) {
    try {
      const { platform } = req.query;
      const userId = req.user.id;
      const user = await User.findById(userId);

      const shareContents = {
        telegram: `🎮 Join Team ${user.faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!\n\nI've earned ${user.stg_balance} STG tokens! Come battle with me!\n\nJoin now: ${await ReferralService.generateReferralLink(userId, user.referral_code)}`,
        twitter: `🎮 Team ${user.faction === 'iran' ? 'Iran' : 'USA'} Battle!\n\nI've earned ${user.stg_balance} STG tokens in this epic Telegram game! Join the fight! 🇮🇷🇺🇸\n\n#TeamIranVsUSA #TelegramGaming #P2E`,
        instagram: `🎮 Team ${user.faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'} Battle!\n\nJoin me in the ultimate Telegram game! I've earned ${user.stg_balance} STG tokens! 🪙\n\nLink in bio! #TeamIranVsUSA #Gaming`,
        facebook: `🎮 Join Team ${user.faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'} in this amazing Telegram game!\n\nI've earned ${user.stg_balance} STG tokens and having a blast! Come battle with me!\n\nPlay here: ${await ReferralService.generateReferralLink(userId, user.referral_code)}`
      };

      const content = shareContents[platform] || shareContents.telegram;

      res.json({
        success: true,
        data: {
          platform,
          content,
          referralLink: await ReferralService.generateReferralLink(userId, user.referral_code)
        }
      });
    } catch (error) {
      console.error('Failed to generate share content:', error);
      res.status(500).json({ error: 'Failed to generate share content' });
    }
  }
}

module.exports = new ReferralController();
