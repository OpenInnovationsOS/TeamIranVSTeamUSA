const mongoose = require('mongoose');

const weaponSchema = new mongoose.Schema({
  weapon_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  category: { 
    type: String, 
    enum: ['pistol', 'rifle', 'sniper', 'shotgun', 'smg', 'lmg', 'explosive', 'melee', 'special'],
    required: true,
    index: true
  },
  faction: { 
    type: String, 
    enum: ['iran', 'usa', 'neutral'],
    required: true,
    index: true
  },
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true,
    index: true
  },
  base_stats: {
    damage: { type: Number, required: true, min: 1, max: 1000 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    fire_rate: { type: Number, required: true, min: 1, max: 1000 },
    range: { type: Number, required: true, min: 1, max: 500 },
    reload_speed: { type: Number, required: true, min: 0.1, max: 10 },
    magazine_size: { type: Number, required: true, min: 1, max: 200 }
  },
  unlock_requirements: {
    level: { type: Number, required: true, min: 1, max: 100 },
    experience: { type: Number, required: true, min: 0 },
    stg_tokens: { type: Number, required: true, min: 0 },
    achievements: [{ type: String }]
  },
  visual_effects: {
    animation_type: { 
      type: String, 
      enum: ['slide_up', 'fade_in', 'rotate_360', 'bounce', 'glow', 'particle_burst'],
      default: 'slide_up'
    },
    animation_duration: { type: Number, default: 0.5, min: 0.1, max: 3 },
    color_scheme: { 
      type: String, 
      enum: ['gold', 'silver', 'bronze', 'blue', 'red', 'green', 'purple', 'rainbow'],
      default: 'gold'
    },
    particle_effects: [{ 
      type: { type: String, enum: ['spark', 'smoke', 'flash', 'glow', 'trail'] },
      intensity: { type: Number, min: 1, max: 10 }
    }]
  },
  boost_info: {
    can_be_boosted: { type: Boolean, default: true },
    max_boost_level: { type: Number, default: 5, min: 1, max: 10 },
    boost_multipliers: {
      damage: { type: Number, default: 1.2, min: 1.0, max: 3.0 },
      accuracy: { type: Number, default: 1.1, min: 1.0, max: 2.0 },
      fire_rate: { type: Number, default: 1.15, min: 1.0, max: 2.5 }
    }
  },
  pricing: {
    base_price: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['STG', 'USD'], default: 'STG' },
    discount_tiers: [{
      quantity: { type: Number, min: 1 },
      discount_percent: { type: Number, min: 0, max: 100 }
    }]
  },
  availability: {
    is_active: { type: Boolean, default: true },
    is_limited: { type: Boolean, default: false },
    limited_quantity: { type: Number, min: 1 },
    start_date: { type: Date },
    end_date: { type: Date }
  },
  metadata: {
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    created_by: { type: String },
    version: { type: String, default: '1.0' },
    tags: [{ type: String }],
    popularity_score: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'weapons'
});

// Indexes for performance
weaponSchema.index({ category: 1, faction: 1 });
weaponSchema.index({ rarity: 1, is_active: 1 });
weaponSchema.index({ 'unlock_requirements.level': 1 });
weaponSchema.index({ 'pricing.base_price': 1 });

// Virtual for total power calculation
weaponSchema.virtual('total_power').get(function() {
  const base = this.base_stats.damage * this.base_stats.accuracy;
  const fireRateBonus = this.base_stats.fire_rate / 100;
  return Math.round(base * (1 + fireRateBonus));
});

// Virtual for display name with rarity
weaponSchema.virtual('display_name').get(function() {
  const rarityEmojis = {
    common: '⚪',
    uncommon: '🟢', 
    rare: '🔵',
    epic: '🟣',
    legendary: '🟡'
  };
  return `${rarityEmojis[this.rarity] || ''} ${this.name}`;
});

// Static methods
weaponSchema.statics = {
  // Get weapons by category and faction
  async getByCategoryAndFaction(category, faction) {
    return this.find({ 
      category, 
      faction: faction || { $in: ['iran', 'usa'] },
      'availability.is_active': true 
    }).sort({ 'metadata.popularity_score': -1 });
  },

  // Get weapons by rarity
  async getByRarity(rarity) {
    return this.find({ 
      rarity, 
      'availability.is_active': true 
    }).sort({ 'pricing.base_price': 1 });
  },

  // Get unlockable weapons for user level
  async getUnlockableForLevel(userLevel) {
    return this.find({
      'unlock_requirements.level': { $lte: userLevel },
      'availability.is_active': true
    }).sort({ 'unlock_requirements.level': 1, 'pricing.base_price': 1 });
  },

  // Search weapons
  async searchWeapons(query, filters = {}) {
    const searchQuery = {
      $and: [
        { 'availability.is_active': true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'metadata.tags': { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    };

    if (filters.category) searchQuery.$and.push({ category: filters.category });
    if (filters.faction) searchQuery.$and.push({ faction: filters.faction });
    if (filters.rarity) searchQuery.$and.push({ rarity: filters.rarity });
    if (filters.maxPrice) searchQuery.$and.push({ 'pricing.base_price': { $lte: filters.maxPrice } });

    return this.find(searchQuery).sort({ 'metadata.popularity_score': -1 });
  }
};

// Instance methods
weaponSchema.methods = {
  // Check if user can unlock this weapon
  canUserUnlock(user) {
    const userLevel = user.game_stats.level;
    const userExp = user.game_stats.experience;
    const userTokens = user.game_stats.stg_tokens;

    return (
      userLevel >= this.unlock_requirements.level &&
      userExp >= this.unlock_requirements.experience &&
      userTokens >= this.unlock_requirements.stg_tokens
    );
  },

  // Calculate boost cost
  calculateBoostCost(boostLevel) {
    if (!this.boost_info.can_be_boosted || boostLevel <= 0) return 0;
    if (boostLevel > this.boost_info.max_boost_level) return null;

    const baseCost = this.pricing.base_price * 0.1; // 10% of base price per level
    const multiplier = Math.pow(1.5, boostLevel - 1); // Exponential scaling
    return Math.round(baseCost * multiplier);
  },

  // Get boosted stats
  getBoostedStats(boostLevel = 1) {
    if (!this.boost_info.can_be_boosted || boostLevel <= 0) return this.base_stats;

    const multipliers = this.boost_info.boost_multipliers;
    return {
      damage: Math.round(this.base_stats.damage * Math.pow(multipliers.damage, boostLevel)),
      accuracy: Math.min(100, this.base_stats.accuracy * Math.pow(multipliers.accuracy, boostLevel)),
      fire_rate: Math.round(this.base_stats.fire_rate * Math.pow(multipliers.fire_rate, boostLevel)),
      range: this.base_stats.range,
      reload_speed: this.base_stats.reload_speed,
      magazine_size: this.base_stats.magazine_size
    };
  },

  // Get animation configuration
  getAnimationConfig() {
    return {
      type: this.visual_effects.animation_type,
      duration: this.visual_effects.animation_duration,
      color_scheme: this.visual_effects.color_scheme,
      particle_effects: this.visual_effects.particle_effects
    };
  }
};

module.exports = mongoose.model('Weapon', weaponSchema);
