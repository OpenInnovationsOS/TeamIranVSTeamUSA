const mongoose = require('mongoose');

const weaponBoostSchema = new mongoose.Schema({
  boost_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  weapon_id: { 
    type: String, 
    required: true,
    ref: 'Weapon',
    index: true
  },
  boost_level: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 10,
    default: 1
  },
  boost_type: { 
    type: String, 
    enum: ['damage', 'accuracy', 'fire_rate', 'all_stats', 'special_ability'],
    required: true
  },
  boost_multiplier: { 
    type: Number, 
    required: true, 
    min: 1.0, 
    max: 3.0,
    default: 1.2
  },
  duration_hours: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 720, // 30 days
    default: 24
  },
  cost: {
    stg_tokens: { type: Number, required: true, min: 0 },
    usd_equivalent: { type: Number, required: true, min: 0 }
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'used', 'pending'],
    default: 'pending',
    index: true
  },
  activation_time: { 
    type: Date,
    default: null
  },
  expiry_time: { 
    type: Date,
    default: null
  },
  purchase_details: {
    transaction_id: { type: String, required: true },
    payment_method: { 
      type: String, 
      enum: ['stg_tokens', 'ton', 'stripe', 'coinbase'],
      required: true
    },
    wallet_address: { type: String },
    blockchain_tx_hash: { type: String }
  },
  effects: {
    visual_effects: [{
      type: { 
        type: String, 
        enum: ['glow', 'particle_trail', 'color_change', 'aura', 'lightning']
      },
      intensity: { type: Number, min: 1, max: 10, default: 5 },
      color: { type: String, enum: ['gold', 'blue', 'red', 'green', 'purple', 'rainbow'] }
    }],
    special_abilities: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      cooldown_seconds: { type: Number, min: 1, max: 300 },
      duration_seconds: { type: Number, min: 1, max: 60 }
    }]
  },
  metadata: {
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    version: { type: String, default: '1.0' },
    is_permanent: { type: Boolean, default: false },
    stackable: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  collection: 'weapon_boosts'
});

// Indexes for performance
weaponBoostSchema.index({ user_id: 1, status: 1 });
weaponBoostSchema.index({ weapon_id: 1, status: 1 });
weaponBoostSchema.index({ expiry_time: 1 });
weaponBoostSchema.index({ 'metadata.created_at': -1 });

// Virtual for checking if boost is active
weaponBoostSchema.virtual('is_active').get(function() {
  if (this.status !== 'active') return false;
  if (!this.expiry_time) return false;
  return new Date() < this.expiry_time;
});

// Virtual for time remaining
weaponBoostSchema.virtual('time_remaining').get(function() {
  if (!this.expiry_time) return 0;
  const now = new Date();
  const remaining = this.expiry_time - now;
  return Math.max(0, Math.floor(remaining / 1000)); // Return in seconds
});

// Static methods
weaponBoostSchema.statics = {
  // Get active boosts for user
  async getActiveForUser(userId) {
    return this.find({
      user_id: userId,
      status: 'active',
      expiry_time: { $gt: new Date() }
    }).populate('weapon_id').sort({ 'metadata.created_at': -1 });
  },

  // Get boost history for user
  async getHistoryForUser(userId, limit = 20) {
    return this.find({
      user_id: userId
    }).populate('weapon_id').sort({ 'metadata.created_at': -1 }).limit(limit);
  },

  // Create new boost
  async createBoost(userId, weaponId, boostData) {
    const boost = new this({
      boost_id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      weapon_id: weaponId,
      ...boostData,
      status: 'pending'
    });

    return boost.save();
  },

  // Activate boost
  async activateBoost(boostId) {
    const boost = await this.findOne({ boost_id: boostId });
    if (!boost) throw new Error('Boost not found');
    if (boost.status !== 'pending') throw new Error('Boost cannot be activated');

    const now = new Date();
    const expiry = new Date(now.getTime() + (boost.duration_hours * 60 * 60 * 1000));

    boost.status = 'active';
    boost.activation_time = now;
    boost.expiry_time = expiry;
    boost.metadata.updated_at = now;

    return boost.save();
  },

  // Expire boosts
  async expireBoosts() {
    const expiredBoosts = await this.find({
      status: 'active',
      expiry_time: { $lte: new Date() }
    });

    for (const boost of expiredBoosts) {
      boost.status = 'expired';
      boost.metadata.updated_at = new Date();
      await boost.save();
    }

    return expiredBoosts.length;
  }
};

// Instance methods
weaponBoostSchema.methods = {
  // Check if boost can be stacked
  canStackWith(otherBoost) {
    if (this.weapon_id !== otherBoost.weapon_id) return true;
    if (this.boost_type !== otherBoost.boost_type) return true;
    return this.metadata.stackable && otherBoost.metadata.stackable;
  },

  // Calculate total boost effect
  calculateTotalEffect() {
    const baseMultiplier = this.boost_multiplier;
    const levelBonus = 1 + (this.boost_level - 1) * 0.1; // 10% per level
    return baseMultiplier * levelBonus;
  },

  // Get boost display info
  getDisplayInfo() {
    return {
      boost_id: this.boost_id,
      weapon_name: this.weapon_id.name || 'Unknown Weapon',
      boost_type: this.boost_type,
      boost_level: this.boost_level,
      multiplier: this.calculateTotalEffect(),
      duration: this.duration_hours,
      status: this.status,
      is_active: this.is_active,
      time_remaining: this.time_remaining,
      cost: this.cost,
      effects: this.effects
    };
  }
};

module.exports = mongoose.model('WeaponBoost', weaponBoostSchema);
