const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  achievement_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['battle', 'social', 'economic', 'exploration', 'special'], 
    required: true 
  },
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], 
    required: true 
  },
  
  // Achievement requirements
  requirements: {
    type: { type: String, required: true }, // 'wins', 'losses', 'level', 'stg_earned', 'battles_fought', etc.
    target: { type: Number, required: true },
    conditions: [{ type: String }], // Additional conditions
    timeframe: { type: Number }, // Time limit in hours (optional)
    faction_specific: { type: String, enum: ['iran', 'usa'] } // Faction-specific achievements
  },
  
  // Rewards
  rewards: {
    experience: { type: Number, default: 0 },
    stg_tokens: { type: Number, default: 0 },
    weapon_unlock: { type: String }, // Weapon ID to unlock
    title: { type: String }, // Special title
    badge: { type: String }, // Badge identifier
    faction_bonus: { type: Number } // Faction reputation bonus
  },
  
  // Visual settings
  visual: {
    icon: { type: String }, // Icon identifier
    color: { type: String, default: '#ffffff' }, // Display color
    gradient: { type: String }, // Gradient for cards
    animation: { type: String } // Animation type
  },
  
  // Achievement state
  is_active: { type: Boolean, default: true },
  is_hidden: { type: Boolean, default: false }, // Hidden until discovered
  is_repeatable: { type: Boolean, default: false }, // Can be earned multiple times
  max_completions: { type: Number, default: 1 }, // Max times repeatable
  
  // Statistics
  total_earners: { type: Number, default: 0 },
  average_completion_time: { type: Number, default: 0 }, // In hours
  difficulty_score: { type: Number, default: 1 }, // 1-10 difficulty
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// User Achievement Progress Schema
const userAchievementSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  achievement_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Achievement', 
    required: true 
  },
  
  // Progress tracking
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
    percentage: { type: Number, default: 0 }
  },
  
  // Completion state
  completed: { type: Boolean, default: false },
  completion_date: { type: Date },
  completion_count: { type: Number, default: 0 }, // For repeatable achievements
  
  // Rewards claimed
  rewards_claimed: { type: Boolean, default: false },
  claimed_date: { type: Date },
  rewards_claimed_count: { type: Number, default: 0 },
  
  // Tracking data
  started_date: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  
  // Additional progress data
  progress_data: { type: mongoose.Schema.Types.Mixed }, // Flexible data for complex achievements
  
  // Notifications
  notified: { type: Boolean, default: false }, // User has been notified about progress
  milestone_notifications: [{ type: Number }], // Progress milestones already notified
  
  // Unique constraint
  unique_key: { 
    type: String, 
    unique: true, 
    required: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userAchievementSchema.virtual('is_completed').get(function() {
  return this.progress.current >= this.progress.target;
});

userAchievementSchema.virtual('remaining').get(function() {
  return Math.max(0, this.progress.target - this.progress.current);
});

userAchievementSchema.virtual('time_to_complete').get(function() {
  if (this.completed) {
    return this.completion_date - this.started_date;
  }
  return Date.now() - this.started_date;
});

// Indexes for performance
achievementSchema.index({ category: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ is_active: 1 });
achievementSchema.index({ 'requirements.type': 1 });

userAchievementSchema.index({ user_id: 1 });
userAchievementSchema.index({ achievement_id: 1 });
userAchievementSchema.index({ completed: 1 });
userAchievementSchema.index({ unique_key: 1 });
userAchievementSchema.index({ user_id: 1, completed: 1 });

// Achievement methods
achievementSchema.methods.checkCompletion = function(userProgress) {
  return userProgress >= this.requirements.target;
};

achievementSchema.methods.calculateDifficulty = function() {
  let difficulty = 1;
  
  // Base difficulty on target value
  if (this.requirements.target >= 1000) difficulty += 3;
  else if (this.requirements.target >= 500) difficulty += 2;
  else if (this.requirements.target >= 100) difficulty += 1;
  
  // Adjust for rarity
  switch (this.rarity) {
    case 'uncommon': difficulty += 1; break;
    case 'rare': difficulty += 2; break;
    case 'epic': difficulty += 3; break;
    case 'legendary': difficulty += 4; break;
  }
  
  // Adjust for time limits
  if (this.requirements.timeframe && this.requirements.timeframe < 24) {
    difficulty += 2;
  }
  
  // Adjust for additional conditions
  if (this.requirements.conditions && this.requirements.conditions.length > 0) {
    difficulty += this.requirements.conditions.length;
  }
  
  return Math.min(10, difficulty);
};

// User Achievement methods
userAchievementSchema.methods.updateProgress = function(newValue, additionalData = {}) {
  this.progress.current = Math.min(newValue, this.progress.target);
  this.progress.percentage = (this.progress.current / this.progress.target) * 100;
  this.last_updated = new Date();
  
  if (additionalData) {
    this.progress_data = { ...this.progress_data, ...additionalData };
  }
  
  // Check for completion
  if (this.progress.current >= this.progress.target && !this.completed) {
    this.completed = true;
    this.completion_date = new Date();
    this.completion_count += 1;
  }
  
  return this.save();
};

userAchievementSchema.methods.claimRewards = async function() {
  if (!this.completed || this.rewards_claimed) {
    throw new Error('Rewards cannot be claimed');
  }
  
  const achievement = await mongoose.model('Achievement').findById(this.achievement_id);
  const user = await mongoose.model('User').findById(this.user_id);
  
  if (!achievement || !user) {
    throw new Error('Achievement or user not found');
  }
  
  // Apply rewards
  if (achievement.rewards.experience > 0) {
    user.game_stats.experience += achievement.rewards.experience;
  }
  
  if (achievement.rewards.stg_tokens > 0) {
    user.stg_balance += achievement.rewards.stg_tokens;
  }
  
  // Update achievement stats
  achievement.total_earners += 1;
  await achievement.save();
  
  // Mark rewards as claimed
  this.rewards_claimed = true;
  this.claimed_date = new Date();
  this.rewards_claimed_count += 1;
  
  await user.save();
  return this.save();
};

// Static methods
achievementSchema.statics.getByCategory = function(category) {
  return this.find({ category, is_active: true }).sort({ rarity: 1, name: 1 });
};

achievementSchema.statics.getByRarity = function(rarity) {
  return this.find({ rarity, is_active: true }).sort({ name: 1 });
};

achievementSchema.statics.getForUser = function(userId, includeHidden = false) {
  const query = { is_active: true };
  if (!includeHidden) {
    query.is_hidden = false;
  }
  
  return this.find(query).sort({ category: 1, rarity: 1, name: 1 });
};

userAchievementSchema.statics.getUserProgress = function(userId) {
  return this.find({ user_id: userId })
    .populate('achievement_id', 'name description category rarity rewards visual')
    .sort({ 'achievement_id.category': 1, 'achievement_id.rarity': 1 });
};

userAchievementSchema.statics.getCompletedAchievements = function(userId) {
  return this.find({ 
    user_id: userId, 
    completed: true 
  }).populate('achievement_id', 'name category rarity rewards')
    .sort({ completion_date: -1 });
};

userAchievementSchema.statics.getInProgressAchievements = function(userId) {
  return this.find({ 
    user_id: userId, 
    completed: false 
  }).populate('achievement_id', 'name description category rarity requirements visual')
    .sort({ 'progress.percentage': -1 });
};

userAchievementSchema.statics.updateUserAchievement = async function(userId, achievementId, progress, additionalData = {}) {
  const uniqueKey = `${userId}_${achievementId}`;
  
  // Find or create user achievement
  let userAchievement = await this.findOne({ unique_key });
  
  if (!userAchievement) {
    const achievement = await mongoose.model('Achievement').findById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }
    
    userAchievement = new this({
      user_id: userId,
      achievement_id: achievementId,
      unique_key,
      progress: {
        current: 0,
        target: achievement.requirements.target,
        percentage: 0
      }
    });
  }
  
  return userAchievement.updateProgress(progress, additionalData);
};

// Pre-save middleware
userAchievementSchema.pre('save', function(next) {
  if (this.isNew) {
    this.unique_key = `${this.user_id}_${this.achievement_id}`;
  }
  next();
});

// Create models
const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };
