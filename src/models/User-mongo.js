const mongoose = require('../database/mongodb-connection').mongoose;
const { Schema } = mongoose;

const userSchema = new Schema({
  telegram_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    sparse: true
  },
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  faction: {
    type: String,
    enum: ['iran', 'usa'],
    required: true
  },
  stg_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  win_claimable: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  referral_code: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  referred_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  ton_wallet_address: {
    type: String,
    sparse: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
userSchema.index({ faction: 1 });
userSchema.index({ stg_balance: -1 });
userSchema.index({ created_at: -1 });

// Static methods
userSchema.statics.create = async function(telegramUser) {
  const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const user = new this({
    telegram_id: telegramUser.id,
    username: telegramUser.username,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    faction: telegramUser.faction,
    referral_code: referralCode,
    stg_balance: 100 // Welcome bonus
  });

  await user.save();

  // Create initial transaction record
  await mongoose.model('Transaction').create({
    user_id: user._id,
    type: 'stg',
    amount: 100,
    balance_after: 100,
    description: 'Welcome bonus'
  });

  return user;
};

userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegram_id: telegramId });
};

userSchema.statics.findById = function(id) {
  return this.findById(id);
};

userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referral_code: referralCode });
};

userSchema.statics.updateBalance = async function(userId, amount, type = 'stg') {
  const user = await this.findById(userId);
  if (!user) throw new Error('User not found');

  const balanceField = type === 'stg' ? 'stg_balance' : 'win_claimable';
  user[balanceField] += amount;
  await user.save();

  // Create transaction record
  await mongoose.model('Transaction').create({
    user_id: user._id,
    type: type,
    amount: amount,
    balance_after: user[balanceField],
    description: `${type.toUpperCase()} balance update`
  });

  return user[balanceField];
};

userSchema.statics.setFaction = function(userId, faction) {
  return this.findByIdAndUpdate(userId, { faction }, { new: true });
};

userSchema.statics.setTonWallet = function(userId, walletAddress) {
  return this.findByIdAndUpdate(userId, { ton_wallet_address: walletAddress }, { new: true });
};

userSchema.statics.addExperience = async function(userId, experience) {
  const user = await this.findById(userId);
  if (!user) throw new Error('User not found');

  user.experience += experience;
  user.level = Math.floor(user.experience / 1000) + 1;
  await user.save();

  return user;
};

userSchema.statics.getLeaderboard = function(limit = 50, faction = null) {
  const query = faction ? { faction } : {};
  return this.find(query)
    .sort({ stg_balance: -1, experience: -1 })
    .limit(limit)
    .select('telegram_id username first_name faction stg_balance level experience');
};

userSchema.statics.getReferrals = function(userId) {
  return this.find({ referred_by: userId })
    .sort({ created_at: -1 })
    .select('id username first_name created_at stg_balance level');
};

userSchema.statics.getStats = async function(userId) {
  const user = await this.findById(userId);
  if (!user) return null;

  const battlesTotal = await mongoose.model('Battle').countDocuments({
    $or: [{ attacker_id: userId }, { defender_id: userId }]
  });

  const battlesWon = await mongoose.model('Battle').countDocuments({
    winner_id: userId
  });

  const missionsCompleted = await mongoose.model('UserMission').countDocuments({
    user_id: userId,
    is_completed: true
  });

  const referralsCount = await this.countDocuments({
    referred_by: userId
  });

  return {
    id: user._id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    faction: user.faction,
    stg_balance: user.stg_balance,
    win_claimable: user.win_claimable,
    level: user.level,
    experience: user.experience,
    referral_code: user.referral_code,
    ton_wallet_address: user.ton_wallet_address,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
    battles_total: battlesTotal,
    battles_won: battlesWon,
    missions_completed: missionsCompleted,
    referrals_count: referralsCount
  };
};

userSchema.statics.deactivate = function(userId) {
  return this.findByIdAndUpdate(userId, { is_active: false }, { new: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
