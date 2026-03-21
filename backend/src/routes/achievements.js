const express = require('express');
const router = express.Router();
const { Achievement, UserAchievement } = require('../models/Achievement');
const User = require('../models/User');
const Battle = require('../models/Battle');
const auth = require('../middleware/auth');
const { broadcastToUser } = require('../websocket/server');

// Get all achievements for user
router.get('/', auth, async (req, res) => {
  try {
    const { category, rarity, completed } = req.query;
    
    let userAchievements = await UserAchievement.getUserProgress(req.user.id);
    
    // Apply filters
    if (category) {
      userAchievements = userAchievements.filter(ua => 
        ua.achievement_id.category === category
      );
    }
    
    if (rarity) {
      userAchievements = userAchievements.filter(ua => 
        ua.achievement_id.rarity === rarity
      );
    }
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      userAchievements = userAchievements.filter(ua => 
        ua.completed === isCompleted
      );
    }
    
    res.json({
      success: true,
      data: userAchievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch achievements' }
    });
  }
});

// Get achievement by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const userAchievement = await UserAchievement.findOne({
      user_id: req.user.id,
      achievement_id: req.params.id
    }).populate('achievement_id');
    
    if (!userAchievement) {
      // Create new user achievement if it doesn't exist
      const achievement = await Achievement.findById(req.params.id);
      if (!achievement) {
        return res.status(404).json({
          success: false,
          error: { message: 'Achievement not found' }
        });
      }
      
      const newUserAchievement = new UserAchievement({
        user_id: req.user.id,
        achievement_id: req.params.id,
        progress: {
          current: 0,
          target: achievement.requirements.target,
          percentage: 0
        }
      });
      
      await newUserAchievement.save();
      await newUserAchievement.populate('achievement_id');
      
      return res.json({
        success: true,
        data: newUserAchievement
      });
    }
    
    res.json({
      success: true,
      data: userAchievement
    });
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch achievement' }
    });
  }
});

// Claim achievement rewards
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const userAchievement = await UserAchievement.findOne({
      user_id: req.user.id,
      achievement_id: req.params.id
    }).populate('achievement_id');
    
    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        error: { message: 'Achievement not found' }
      });
    }
    
    if (!userAchievement.completed) {
      return res.status(400).json({
        success: false,
        error: { message: 'Achievement not completed yet' }
      });
    }
    
    if (userAchievement.rewards_claimed) {
      return res.status(400).json({
        success: false,
        error: { message: 'Rewards already claimed' }
      });
    }
    
    await userAchievement.claimRewards();
    
    // Get updated user data
    const user = await User.findById(req.user.id);
    
    // Broadcast achievement completion
    broadcastToUser(req.user.id, {
      type: 'achievement_claimed',
      achievement: {
        id: userAchievement.achievement_id._id,
        name: userAchievement.achievement_id.name,
        description: userAchievement.achievement_id.description,
        rarity: userAchievement.achievement_id.rarity,
        rewards: userAchievement.achievement_id.rewards
      },
      rewards: userAchievement.achievement_id.rewards,
      new_balance: user.stg_balance,
      new_experience: user.game_stats.experience,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      data: {
        rewards: userAchievement.achievement_id.rewards,
        new_balance: user.stg_balance,
        new_experience: user.game_stats.experience
      }
    });
  } catch (error) {
    console.error('Error claiming achievement rewards:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to claim rewards' }
    });
  }
});

// Get achievement categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Achievement.distinct('category');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching achievement categories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch categories' }
    });
  }
});

// Get achievement statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's achievement stats
    const userAchievements = await UserAchievement.find({ user_id: userId })
      .populate('achievement_id');
    
    const totalAchievements = await Achievement.countDocuments({ is_active: true });
    const completedAchievements = userAchievements.filter(ua => ua.completed).length;
    const inProgressAchievements = userAchievements.filter(ua => !ua.completed && ua.progress.current > 0).length;
    const unstartedAchievements = totalAchievements - userAchievements.length;
    
    // Calculate completion percentage
    const completionPercentage = (completedAchievements / totalAchievements) * 100;
    
    // Get stats by category
    const categoryStats = {};
    userAchievements.forEach(ua => {
      const category = ua.achievement_id.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, completed: 0, in_progress: 0 };
      }
      categoryStats[category].total++;
      if (ua.completed) {
        categoryStats[category].completed++;
      } else if (ua.progress.current > 0) {
        categoryStats[category].in_progress++;
      }
    });
    
    // Get stats by rarity
    const rarityStats = {};
    userAchievements.forEach(ua => {
      const rarity = ua.achievement_id.rarity;
      if (!rarityStats[rarity]) {
        rarityStats[rarity] = { total: 0, completed: 0 };
      }
      rarityStats[rarity].total++;
      if (ua.completed) {
        rarityStats[rarity].completed++;
      }
    });
    
    // Get recent completions
    const recentCompletions = await UserAchievement.find({
      user_id: userId,
      completed: true
    }).populate('achievement_id', 'name category rarity')
      .sort({ completion_date: -1 })
      .limit(5);
    
    // Get total rewards earned
    const totalRewards = userAchievements.reduce((acc, ua) => {
      if (ua.rewards_claimed && ua.achievement_id.rewards) {
        acc.experience += ua.achievement_id.rewards.experience || 0;
        acc.stg_tokens += ua.achievement_id.rewards.stg_tokens || 0;
      }
      return acc;
    }, { experience: 0, stg_tokens: 0 });
    
    res.json({
      success: true,
      data: {
        overview: {
          total_achievements: totalAchievements,
          completed_achievements: completedAchievements,
          in_progress_achievements: inProgressAchievements,
          unstarted_achievements: unstartedAchievements,
          completion_percentage: Math.round(completionPercentage * 100) / 100
        },
        category_stats: categoryStats,
        rarity_stats: rarityStats,
        recent_completions: recentCompletions,
        total_rewards: totalRewards
      }
    });
  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch achievement statistics' }
    });
  }
});

// Update achievement progress (internal endpoint)
router.post('/update/:achievementId', auth, async (req, res) => {
  try {
    const { progress, additional_data } = req.body;
    
    const userAchievement = await UserAchievement.updateUserAchievement(
      req.user.id,
      req.params.achievementId,
      progress,
      additional_data
    );
    
    await userAchievement.populate('achievement_id');
    
    // Check for milestones (25%, 50%, 75%)
    const milestones = [25, 50, 75];
    const currentPercentage = Math.floor(userAchievement.progress.percentage);
    
    for (const milestone of milestones) {
      if (currentPercentage >= milestone && 
          !userAchievement.milestone_notifications.includes(milestone)) {
        
        userAchievement.milestone_notifications.push(milestone);
        
        // Broadcast milestone notification
        broadcastToUser(req.user.id, {
          type: 'achievement_milestone',
          achievement: {
            id: userAchievement.achievement_id._id,
            name: userAchievement.achievement_id.name,
            milestone: milestone,
            progress: userAchievement.progress
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for completion
    if (userAchievement.completed && !userAchievement.notified) {
      userAchievement.notified = true;
      
      // Broadcast achievement completion
      broadcastToUser(req.user.id, {
        type: 'achievement_completed',
        achievement: {
          id: userAchievement.achievement_id._id,
          name: userAchievement.achievement_id.name,
          description: userAchievement.achievement_id.description,
          rarity: userAchievement.achievement_id.rarity,
          rewards: userAchievement.achievement_id.rewards
        },
        timestamp: new Date().toISOString()
      });
    }
    
    await userAchievement.save();
    
    res.json({
      success: true,
      data: userAchievement
    });
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update achievement progress' }
    });
  }
});

// Initialize achievements for new user
router.post('/initialize', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active achievements
    const achievements = await Achievement.find({ is_active: true });
    
    // Create user achievement entries for all achievements
    const userAchievements = achievements.map(achievement => ({
      user_id: userId,
      achievement_id: achievement._id,
      unique_key: `${userId}_${achievement._id}`,
      progress: {
        current: 0,
        target: achievement.requirements.target,
        percentage: 0
      }
    }));
    
    // Bulk insert
    await UserAchievement.insertMany(userAchievements, { ordered: false });
    
    res.json({
      success: true,
      message: 'Achievements initialized successfully',
      data: {
        achievements_created: achievements.length
      }
    });
  } catch (error) {
    console.error('Error initializing achievements:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to initialize achievements' }
    });
  }
});

// Achievement progress tracking middleware
async function trackAchievementProgress(userId, type, value, additionalData = {}) {
  try {
    // Find achievements that match this type
    const achievements = await Achievement.find({
      'requirements.type': type,
      is_active: true
    });
    
    for (const achievement of achievements) {
      // Check faction-specific requirements
      if (achievement.requirements.faction_specific) {
        const user = await User.findById(userId);
        if (user.faction !== achievement.requirements.faction_specific) {
          continue;
        }
      }
      
      // Update user achievement progress
      await UserAchievement.updateUserAchievement(
        userId,
        achievement._id,
        value,
        additionalData
      );
    }
  } catch (error) {
    console.error('Error tracking achievement progress:', error);
  }
}

// Make tracking function available globally
global.trackAchievementProgress = trackAchievementProgress;

module.exports = router;
