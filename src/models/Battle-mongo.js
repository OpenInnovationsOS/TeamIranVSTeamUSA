const mongoose = require('../database/mongodb-connection').mongoose;
const { Schema } = mongoose;

const battleSchema = new Schema({
  attacker_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  defender_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  stg_wager: {
    type: Number,
    required: true,
    min: 0
  },
  battle_type: {
    type: String,
    default: 'pvp',
    enum: ['pvp', 'territory', 'event']
  },
  battle_data: {
    type: Schema.Types.Mixed
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled']
  },
  completed_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
battleSchema.index({ attacker_id: 1 });
battleSchema.index({ defender_id: 1 });
battleSchema.index({ winner_id: 1 });
battleSchema.index({ status: 1 });
battleSchema.index({ created_at: -1 });

// Static methods
battleSchema.statics.createBattle = async function(battleData) {
  const battle = new this(battleData);
  return await battle.save();
};

battleSchema.statics.findActiveBattles = function(userId) {
  return this.find({
    $or: [{ attacker_id: userId }, { defender_id: userId }],
    status: 'active'
  }).populate('attacker_id defender_id');
};

battleSchema.statics.completeBattle = async function(battleId, winnerId) {
  const battle = await this.findById(battleId);
  if (!battle) throw new Error('Battle not found');

  battle.winner_id = winnerId;
  battle.status = 'completed';
  battle.completed_at = new Date();
  
  return await battle.save();
};

battleSchema.statics.getUserBattleHistory = function(userId, limit = 20) {
  return this.find({
    $or: [{ attacker_id: userId }, { defender_id: userId }]
  })
    .sort({ created_at: -1 })
    .limit(limit)
    .populate('attacker_id defender_id winner_id');
};

battleSchema.statics.getBattlesByType = function(battleType, limit = 50) {
  return this.find({ battle_type: battleType })
    .sort({ created_at: -1 })
    .limit(limit)
    .populate('attacker_id defender_id winner_id');
};

// Instance methods
battleSchema.methods.resolveBattle = async function(winnerId) {
  this.winner_id = winnerId;
  this.status = 'completed';
  this.completed_at = new Date();
  
  await this.save();

  // Update winner's balance
  const User = mongoose.model('User');
  const winner = await User.findById(winnerId);
  if (winner) {
    await User.updateBalance(winnerId, this.stg_wager, 'stg');
  }

  return this;
};

const Battle = mongoose.model('Battle', battleSchema);

module.exports = Battle;
