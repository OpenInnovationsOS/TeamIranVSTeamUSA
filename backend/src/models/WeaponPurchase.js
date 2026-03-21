const mongoose = require('mongoose');

const weaponPurchaseSchema = new mongoose.Schema({
  purchase_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  weapon_id: { 
    type: String, 
    required: true 
  },
  weapon_name: { 
    type: String, 
    required: true 
  },
  
  // Purchase details
  purchase: {
    price: { type: Number, required: true },
    currency: { 
      type: String, 
      enum: ['STG', 'TON'], 
      required: true 
    },
    payment_method: { 
      type: String, 
      enum: ['wallet', 'stars', 'ton'], 
      required: true 
    },
    transaction_id: { type: String },
    discount_applied: { type: Number, default: 0 },
    final_price: { type: Number, required: true }
  },
  
  // Weapon details at time of purchase
  weapon_details: {
    category: { type: String, required: true },
    faction: { type: String, enum: ['iran', 'usa', 'neutral'], required: true },
    rarity: { 
      type: String, 
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], 
      required: true 
    },
    base_stats: {
      damage: { type: Number, required: true },
      accuracy: { type: Number, required: true },
      fire_rate: { type: Number, required: true },
      range: { type: Number, required: true },
      reload_speed: { type: Number, required: true },
      magazine_size: { type: Number, required: true }
    },
    special_abilities: [{ type: String }],
    faction_bonus: { type: Number, default: 0 }
  },
  
  // Purchase status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  
  // User inventory
  inventory: {
    weapon_slot: { type: Number }, // Which slot the weapon occupies
    is_equipped: { type: Boolean, default: false },
    durability: { type: Number, default: 100 },
    experience: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    customizations: {
      skin: { type: String },
      attachments: [{ type: String }],
      name_tag: { type: String }
    }
  },
  
  // Transaction details
  transaction: {
    payment_confirmed: { type: Boolean, default: false },
    payment_date: { type: Date },
    refund_requested: { type: Boolean, default: false },
    refund_date: { type: Date },
    refund_reason: { type: String },
    refund_amount: { type: Number }
  },
  
  // Purchase metadata
  metadata: {
    promotion_code: { type: String },
    referral_used: { type: String },
    bundle_purchase: { type: Boolean, default: false },
    bundle_items: [{ type: String }], // Other weapon_ids in bundle
    gift_purchase: { type: Boolean, default: false },
    gift_recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  purchase_date: { type: Date, default: Date.now },
  completed_date: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
weaponPurchaseSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

weaponPurchaseSchema.virtual('canRefund').get(function() {
  const refundWindow = 24 * 60 * 60 * 1000; // 24 hours
  return this.status === 'completed' && 
         !this.transaction.refund_requested &&
         (Date.now() - this.purchase_date.getTime()) < refundWindow;
});

// Indexes for performance
weaponPurchaseSchema.index({ user_id: 1 });
weaponPurchaseSchema.index({ weapon_id: 1 });
weaponPurchaseSchema.index({ status: 1 });
weaponPurchaseSchema.index({ purchase_date: -1 });
weaponPurchaseSchema.index({ 'inventory.is_equipped': 1 });

// Methods
weaponPurchaseSchema.methods.completePurchase = function() {
  this.status = 'completed';
  this.completed_date = new Date();
  this.transaction.payment_confirmed = true;
  this.transaction.payment_date = new Date();
  return this.save();
};

weaponPurchaseSchema.methods.failPurchase = function(reason) {
  this.status = 'failed';
  this.transaction.refund_requested = true;
  this.transaction.refund_date = new Date();
  this.transaction.refund_reason = reason;
  this.transaction.refund_amount = this.purchase.final_price;
  return this.save();
};

weaponPurchaseSchema.methods.equipWeapon = function(slot) {
  this.inventory.weapon_slot = slot;
  this.inventory.is_equipped = true;
  return this.save();
};

weaponPurchaseSchema.methods.unequipWeapon = function() {
  this.inventory.is_equipped = false;
  this.inventory.weapon_slot = undefined;
  return this.save();
};

weaponPurchaseSchema.methods.addExperience = function(exp) {
  this.inventory.experience += exp;
  
  // Level up logic (every 100 XP)
  const newLevel = Math.floor(this.inventory.experience / 100) + 1;
  if (newLevel > this.inventory.level) {
    this.inventory.level = newLevel;
    // Improve stats on level up
    this.weapon_details.base_stats.damage = Math.floor(this.weapon_details.base_stats.damage * 1.05);
    this.weapon_details.base_stats.accuracy = Math.min(100, this.weapon_details.base_stats.accuracy + 2);
  }
  
  return this.save();
};

weaponPurchaseSchema.methods.repairWeapon = function(amount) {
  this.inventory.durability = Math.min(100, this.inventory.durability + amount);
  return this.save();
};

weaponPurchaseSchema.methods.useWeapon = function() {
  this.inventory.durability = Math.max(0, this.inventory.durability - 1);
  return this.save();
};

weaponPurchaseSchema.methods.customizeWeapon = function(customizations) {
  this.inventory.customizations = { ...this.inventory.customizations, ...customizations };
  return this.save();
};

// Static methods
weaponPurchaseSchema.statics.getUserInventory = function(userId) {
  return this.find({ 
    user_id: userId, 
    status: 'completed' 
  }).sort({ purchase_date: -1 });
};

weaponPurchaseSchema.statics.getUserEquippedWeapons = function(userId) {
  return this.find({ 
    user_id: userId, 
    status: 'completed',
    'inventory.is_equipped': true 
  });
};

weaponPurchaseSchema.statics.getWeaponById = function(userId, weaponId) {
  return this.findOne({ 
    user_id: userId, 
    weapon_id: weaponId, 
    status: 'completed' 
  });
};

weaponPurchaseSchema.statics.getPurchaseStats = function(userId, timeframe = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeframe);
  
  return this.aggregate([
    { $match: { 
      user_id: userId, 
      status: 'completed',
      purchase_date: { $gte: cutoff }
    }},
    {
      $group: {
        _id: null,
        total_purchases: { $sum: 1 },
        total_spent: { $sum: '$purchase.final_price' },
        weapons_by_category: {
          $push: '$weapon_details.category'
        },
        weapons_by_faction: {
          $push: '$weapon_details.faction'
        },
        weapons_by_rarity: {
          $push: '$weapon_details.rarity'
        }
      }
    }
  ]);
};

weaponPurchaseSchema.statics.getPopularWeapons = function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$weapon_id',
        name: { $first: '$weapon_name' },
        category: { $first: '$weapon_details.category' },
        faction: { $first: '$weapon_details.faction' },
        rarity: { $first: '$weapon_details.rarity' },
        total_purchases: { $sum: 1 },
        total_revenue: { $sum: '$purchase.final_price' },
        average_price: { $avg: '$purchase.final_price' }
      }
    },
    { $sort: { total_purchases: -1 } },
    { $limit: limit }
  ]);
};

weaponPurchaseSchema.statics.getRevenueStats = function(timeframe = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeframe);
  
  return this.aggregate([
    { $match: { 
      status: 'completed',
      purchase_date: { $gte: cutoff }
    }},
    {
      $group: {
        _id: {
          currency: '$purchase.currency',
          category: '$weapon_details.category'
        },
        total_revenue: { $sum: '$purchase.final_price' },
        total_purchases: { $sum: 1 },
        average_price: { $avg: '$purchase.final_price' }
      }
    },
    { $sort: { total_revenue: -1 } }
  ]);
};

weaponPurchaseSchema.statics.processRefund = function(purchaseId, reason) {
  return this.findById(purchaseId).then(purchase => {
    if (!purchase) {
      throw new Error('Purchase not found');
    }
    
    if (!purchase.canRefund) {
      throw new Error('Purchase cannot be refunded');
    }
    
    return purchase.failPurchase(reason);
  });
};

// Pre-save middleware
weaponPurchaseSchema.pre('save', function(next) {
  if (this.isNew) {
    this.purchase_id = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('WeaponPurchase', weaponPurchaseSchema);
