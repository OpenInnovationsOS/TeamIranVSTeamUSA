const mongoose = require('mongoose');

const matchmakingQueueSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  telegram_id: { type: Number, required: true },
  username: { type: String, required: true },
  faction: { type: String, enum: ['iran', 'usa'], required: true },
  level: { type: Number, required: true },
  
  // Matchmaking preferences
  preferences: {
    battle_type: { 
      type: String, 
      enum: ['normal', 'tournament', 'quick'], 
      default: 'normal' 
    },
    stake_amount: { type: Number, default: 100 },
    faction_preference: { 
      type: String, 
      enum: ['same', 'opposite', 'any'], 
      default: 'any' 
    },
    level_range: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 }
    },
    weapon_restrictions: [{ type: String }],
    territory_preference: { type: String }
  },
  
  // Queue state
  queue_time: { type: Date, default: Date.now },
  priority: { type: Number, default: 1 }, // Higher priority for longer wait times
  matched: { type: Boolean, default: false },
  match_found: { 
    opponent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    battle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
    match_time: { type: Date }
  },
  
  // Statistics
  total_queue_time: { type: Number, default: 0 }, // Total time spent in queue
  matches_found: { type: Number, default: 0 },
  average_wait_time: { type: Number, default: 0 },
  last_match_time: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
matchmakingQueueSchema.virtual('waitTime').get(function() {
  return Date.now() - this.queue_time.getTime();
});

matchmakingQueueSchema.virtual('isExpired').get(function() {
  return this.waitTime > 300000; // 5 minutes
});

// Indexes for performance
matchmakingQueueSchema.index({ user_id: 1 });
matchmakingQueueSchema.index({ faction: 1 });
matchmakingQueueSchema.index({ level: 1 });
matchmakingQueueSchema.index({ queue_time: 1 });
matchmakingQueueSchema.index({ matched: 1 });
matchmakingQueueSchema.index({ priority: -1 });

// Static methods
matchmakingQueueSchema.statics.addToQueue = function(user, preferences = {}) {
  return this.findOneAndUpdate(
    { user_id: user._id },
    {
      user_id: user._id,
      telegram_id: user.telegram_id,
      username: user.username,
      faction: user.faction,
      level: user.level,
      preferences: {
        battle_type: preferences.battle_type || 'normal',
        stake_amount: preferences.stake_amount || 100,
        faction_preference: preferences.faction_preference || 'any',
        level_range: {
          min: preferences.level_min || Math.max(1, user.level - 5),
          max: preferences.level_max || user.level + 5
        },
        weapon_restrictions: preferences.weapon_restrictions || [],
        territory_preference: preferences.territory_preference
      },
      queue_time: new Date(),
      matched: false,
      priority: 1
    },
    { upsert: true, new: true }
  );
};

matchmakingQueueSchema.statics.removeFromQueue = function(userId) {
  return this.findOneAndDelete({ user_id: userId });
};

matchmakingQueueSchema.statics.findMatches = function(userId, maxMatches = 5) {
  const user = this.findOne({ user_id: userId });
  
  return this.aggregate([
    { $match: { 
      matched: false,
      user_id: { $ne: userId }
    }},
    { $lookup: {
      from: 'users',
      localField: 'user_id',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $match: {
      'user.status': 'active',
      'user.in_battle': false
    }},
    { $sort: { priority: -1, queue_time: 1 } },
    { $limit: maxMatches }
  ]);
};

matchmakingQueueSchema.statics.getQueueStats = function() {
  return this.aggregate([
    { $match: { matched: false } },
    {
      $group: {
        _id: null,
        total_waiting: { $sum: 1 },
        iran_players: {
          $sum: { $cond: [{ $eq: ['$faction', 'iran'] }, 1, 0] }
        },
        usa_players: {
          $sum: { $cond: [{ $eq: ['$faction', 'usa'] }, 1, 0] }
        },
        average_wait_time: { $avg: { $subtract: [new Date(), '$queue_time'] } },
        average_level: { $avg: '$level' }
      }
    }
  ]);
};

matchmakingQueueSchema.statics.updatePriorities = function() {
  const now = new Date();
  
  return this.updateMany(
    { matched: false },
    [
      {
        $set: {
          priority: {
            $ceil: {
              $divide: [
                { $subtract: [now, '$queue_time'] },
                60000 // Every minute increases priority
              ]
            }
          }
        }
      }
    ]
  );
};

matchmakingQueueSchema.statics.cleanupExpired = function() {
  const expiredTime = new Date(Date.now() - 300000); // 5 minutes ago
  
  return this.deleteMany({
    matched: false,
    queue_time: { $lt: expiredTime }
  });
};

// Instance methods
matchmakingQueueSchema.methods.calculateCompatibility = function(otherPlayer) {
  let score = 0;
  
  // Level compatibility (40 points)
  const levelDiff = Math.abs(this.level - otherPlayer.level);
  if (levelDiff <= 2) score += 40;
  else if (levelDiff <= 5) score += 30;
  else if (levelDiff <= 10) score += 20;
  else score += 10;
  
  // Faction preference (30 points)
  if (this.preferences.faction_preference === 'same') {
    if (this.faction === otherPlayer.faction) score += 30;
    else score += 5;
  } else if (this.preferences.faction_preference === 'opposite') {
    if (this.faction !== otherPlayer.faction) score += 30;
    else score += 5;
  } else {
    score += 20; // Any preference
  }
  
  // Wait time priority (20 points)
  const waitTimeBonus = Math.min(20, Math.floor(this.waitTime / 15000)); // 1 point per 15 seconds
  score += waitTimeBonus;
  
  // Battle type compatibility (10 points)
  if (this.preferences.battle_type === otherPlayer.preferences.battle_type) {
    score += 10;
  } else {
    score += 5;
  }
  
  return score;
};

matchmakingQueueSchema.methods.markAsMatched = function(opponentId, battleId) {
  this.matched = true;
  this.match_found = {
    opponent_id: opponentId,
    battle_id: battleId,
    match_time: new Date()
  };
  
  // Update statistics
  this.total_queue_time += this.waitTime;
  this.matches_found += 1;
  this.average_wait_time = this.total_queue_time / this.matches_found;
  this.last_match_time = new Date();
  
  return this.save();
};

module.exports = mongoose.model('MatchmakingQueue', matchmakingQueueSchema);
