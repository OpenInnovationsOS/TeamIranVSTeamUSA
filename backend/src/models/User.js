const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_id: { 
    type: Number, 
    unique: true, 
    required: true,
    index: true
  },
  username: { 
    type: String, 
    required: true,
    trim: true
  },
  faction: { 
    type: String, 
    enum: ['iran', 'usa'], 
    required: true,
    index: true
  },
  
  // Guild information
  guild_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Guild',
    default: null
  },
  guild_rank: { 
    type: String, 
    enum: ['leader', 'officer', 'veteran', 'member', 'recruit'],
    default: null
  },
  
  // Battle status
  in_battle: { 
    type: Boolean, 
    default: false 
  },
  
  // Economic data
  stg_balance: { 
    type: Number, 
    default: 1000, 
    min: 0 
  },
  
  game_stats: {
    level: { type: Number, default: 1, min: 1 },
    experience: { type: Number, default: 0, min: 0 },
    stg_tokens: { type: Number, default: 1000, min: 0 },
    energy: { type: Number, default: 100, min: 0, max: 100 },
    max_energy: { type: Number, default: 100, min: 100 },
    wins: { type: Number, default: 0, min: 0 },
    losses: { type: Number, default: 0, min: 0 },
    rank: { type: Number, default: 999, min: 1 },
    total_battles: { type: Number, default: 0, min: 0 },
    win_rate: { type: Number, default: 0, min: 0, max: 1 }
  },
  inventory: {
    weapons: [{ type: String, default: [] }],
    cosmetics: [{ type: String }],
    boosts: [{
      type: { type: String, enum: ['energy_boost', 'damage_boost', 'accuracy_boost', 'fire_rate_boost'] },
      expires_at: { type: Date },
      multiplier: { type: Number, default: 1.0 }
    }],
    items: [{
      item_id: String,
      name: String,
      quantity: Number,
      expires_at: Date
    }]
  },
  premium_features: [{
    feature_id: { type: String, required: true },
    name: { type: String, required: true },
    monthly_price: { type: Number, required: true },
    expires_at: Date,
    status: { 
      type: String, 
      enum: ['active', 'expired'], 
      default: 'active' 
    },
    created_at: { type: Date, default: Date.now }
  }],
  social: {
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    guild: { type: String },
    chat_preferences: {
      global_chat: { type: Boolean, default: true },
      faction_chat: { type: Boolean, default: true },
      private_messages: { type: Boolean, default: true }
    }
  },
  achievements: [{
    achievement_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    unlocked_at: { type: Date, default: Date.now },
    points: { type: Number, default: 0 }
  }],
  last_active: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  is_banned: { type: Boolean, default: false },
  ban_reason: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('total_spent').get(function() {
  return this.premium_features.reduce((total, feature) => {
    return total + feature.monthly_price;
  }, 0);
});

userSchema.virtual('win_percentage').get(function() {
  const total = this.game_stats.wins + this.game_stats.losses;
  return total > 0 ? (this.game_stats.wins / total) * 100 : 0;
});

// Indexes for performance
userSchema.index({ 'game_stats.rank': 1 });
userSchema.index({ 'game_stats.level': -1 });
userSchema.index({ 'game_stats.wins': -1 });
userSchema.index({ created_at: -1 });
userSchema.index({ last_active: -1 });

// Methods
userSchema.methods.updateStats = function(won, experienceGained = 0) {
  if (won) {
    this.game_stats.wins += 1;
    this.game_stats.experience += experienceGained;
  } else {
    this.game_stats.losses += 1;
    this.game_stats.experience += Math.floor(experienceGained * 0.3);
  }
  
  this.game_stats.total_battles += 1;
  this.game_stats.win_rate = this.game_stats.wins / this.game_stats.total_battles;
  
  // Level up check
  const expNeeded = this.game_stats.level * 1000;
  if (this.game_stats.experience >= expNeeded) {
    this.game_stats.level += 1;
    this.game_stats.experience -= expNeeded;
    this.game_stats.max_energy += 10;
    this.game_stats.energy = this.game_stats.max_energy;
  }
  
  this.last_active = new Date();
  return this.save();
};

userSchema.methods.addPremiumFeature = function(featureId, name, monthlyPrice, duration = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration);
  
  this.premium_features.push({
    feature_id: featureId,
    name: name,
    monthly_price: monthlyPrice,
    expires_at: expiresAt,
    status: 'active'
  });
  
  return this.save();
};

userSchema.methods.hasActivePremiumFeature = function(featureId) {
  return this.premium_features.some(feature => 
    feature.feature_id === featureId && 
    feature.status === 'active' && 
    feature.expires_at > new Date()
  );
};

// Static methods
userSchema.statics.getLeaderboard = async (faction = null, limit = 100) => {
  const matchStage = faction ? { faction, is_banned: false } : { is_banned: false };
  
  return this.aggregate([
    { $match: matchStage },
    { $sort: { 'game_stats.rank': 1 } },
    { $limit: limit },
    {
      $project: {
        telegram_id: 1,
        username: 1,
        faction: 1,
        'game_stats.level': 1,
        'game_stats.wins': 1,
        'game_stats.losses': 1,
        'game_stats.rank': 1,
        'game_stats.win_rate': 1,
        last_active: 1
      }
    }
  ]);
};

userSchema.statics.getActiveUsers = async (timeframe = 24) => {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - timeframe);
  
  return this.countDocuments({
    last_active: { $gte: cutoff },
    is_active: true,
    is_banned: false
  });
};

module.exports = mongoose.model('User', userSchema);
