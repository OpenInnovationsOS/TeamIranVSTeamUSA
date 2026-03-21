const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  telegram_id: { type: Number, required: true },
  username: { type: String, required: true },
  faction: { type: String, enum: ['iran', 'usa'], required: true },
  level: { type: Number, required: true },
  
  // Ranking metrics
  stats: {
    total_battles: { type: Number, default: 0 },
    battles_won: { type: Number, default: 0 },
    battles_lost: { type: Number, default: 0 },
    win_rate: { type: Number, default: 0 },
    win_streak: { type: Number, default: 0 },
    best_win_streak: { type: Number, default: 0 },
    current_streak: { type: Number, default: 0 },
    
    // Performance metrics
    total_damage_dealt: { type: Number, default: 0 },
    total_damage_taken: { type: Number, default: 0 },
    average_damage_per_battle: { type: Number, default: 0 },
    kda_ratio: { type: Number, default: 0 },
    
    // Economic metrics
    stg_balance: { type: Number, default: 0 },
    total_stg_earned: { type: Number, default: 0 },
    total_stg_spent: { type: Number, default: 0 },
    net_stg_profit: { type: Number, default: 0 },
    
    // Experience and progression
    experience: { type: Number, default: 0 },
    experience_to_next_level: { type: Number, default: 100 },
    achievements_completed: { type: Number, default: 0 },
    achievements_points: { type: Number, default: 0 },
    
    // Social metrics
    guild_contributions: { type: Number, default: 0 },
    tournaments_won: { type: Number, default: 0 },
    tournament_points: { type: Number, default: 0 },
    territory_captures: { type: Number, default: 0 },
    
    // Weapon metrics
    weapons_owned: { type: Number, default: 0 },
    weapon_level: { type: Number, default: 0 },
    favorite_weapon_category: { type: String },
    
    // Time-based metrics
    play_time_hours: { type: Number, default: 0 },
    battles_per_hour: { type: Number, default: 0 },
    last_battle_date: { type: Date },
    last_active_date: { type: Date, default: Date.now }
  },
  
  // Ranking calculations
  rankings: {
    global_rank: { type: Number, default: 0 },
    faction_rank: { type: Number, default: 0 },
    level_rank: { type: Number, default: 0 },
    wealth_rank: { type: Number, default: 0 },
    battle_rank: { type: Number, default: 0 },
    achievement_rank: { type: Number, default: 0 },
    
    // Score calculations for different categories
    overall_score: { type: Number, default: 0 },
    battle_score: { type: Number, default: 0 },
    economic_score: { type: Number, default: 0 },
    social_score: { type: Number, default: 0 },
    progression_score: { type: Number, default: 0 }
  },
  
  // Historical data
  history: [{
    date: { type: Date, required: true },
    rank: { type: Number, required: true },
    score: { type: Number, required: true },
    level: { type: Number, required: true },
    battles_won: { type: Number, required: true },
    stg_balance: { type: Number, required: true }
  }],
  
  // Badges and titles
  badges: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    earned_date: { type: Date, required: true },
    icon: { type: String }
  }],
  
  titles: [{
    name: { type: String, required: true },
    description: { type: String },
    earned_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false }
  }],
  
  last_updated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
leaderboardEntrySchema.virtual('winPercentage').get(function() {
  return this.stats.total_battles > 0 ? 
    (this.stats.battles_won / this.stats.total_battles) * 100 : 0;
});

leaderboardEntrySchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.stats.last_active_date > fiveMinutesAgo;
});

leaderboardEntrySchema.virtual('powerLevel').get(function() {
  return Math.floor(
    (this.level * 100) +
    (this.stats.win_rate * 10) +
    (this.stats.stg_balance / 1000) +
    (this.stats.achievements_completed * 50) +
    (this.stats.weapons_owned * 25)
  );
});

// Indexes for performance
leaderboardEntrySchema.index({ 'rankings.global_rank': 1 });
leaderboardEntrySchema.index({ 'rankings.faction_rank': 1 });
leaderboardEntrySchema.index({ 'rankings.overall_score': -1 });
leaderboardEntrySchema.index({ faction: 1 });
leaderboardEntrySchema.index({ level: -1 });
leaderboardEntrySchema.index({ 'stats.stg_balance': -1 });
leaderboardEntrySchema.index({ 'stats.battles_won': -1 });
leaderboardEntrySchema.index({ 'stats.last_active_date': -1 });

// Methods
leaderboardEntrySchema.methods.updateStats = function(battleResult) {
  // Update battle stats
  this.stats.total_battles++;
  if (battleResult.won) {
    this.stats.battles_won++;
    this.stats.current_streak++;
    this.stats.best_win_streak = Math.max(this.stats.best_win_streak, this.stats.current_streak);
  } else {
    this.stats.battles_lost++;
    this.stats.current_streak = 0;
  }
  
  this.stats.win_rate = (this.stats.battles_won / this.stats.total_battles) * 100;
  this.stats.win_streak = this.stats.current_streak;
  
  // Update damage stats
  this.stats.total_damage_dealt += battleResult.damage_dealt || 0;
  this.stats.total_damage_taken += battleResult.damage_taken || 0;
  this.stats.average_damage_per_battle = this.stats.total_damage_dealt / this.stats.total_battles;
  
  // Update KDA ratio
  const kills = battleResult.kills || 0;
  const deaths = battleResult.deaths || 0;
  const assists = battleResult.assists || 0;
  this.stats.kda_ratio = deaths > 0 ? (kills + assists * 0.5) / deaths : kills + assists * 0.5;
  
  // Update economic stats
  if (battleResult.stg_change) {
    this.stats.stg_balance += battleResult.stg_change;
    if (battleResult.stg_change > 0) {
      this.stats.total_stg_earned += battleResult.stg_change;
    } else {
      this.stats.total_stg_spent += Math.abs(battleResult.stg_change);
    }
    this.stats.net_stg_profit = this.stats.total_stg_earned - this.stats.total_stg_spent;
  }
  
  // Update experience
  if (battleResult.experience_gained) {
    this.stats.experience += battleResult.experience_gained;
  }
  
  // Update last battle date
  this.stats.last_battle_date = new Date();
  this.stats.last_active_date = new Date();
  
  // Calculate scores
  this.calculateScores();
  
  return this.save();
};

leaderboardEntrySchema.methods.calculateScores = function() {
  // Battle score (40% weight)
  const battleScore = (
    (this.stats.battles_won * 10) +
    (this.stats.win_rate * 5) +
    (this.stats.best_win_streak * 2) +
    (this.stats.kda_ratio * 3)
  );
  
  // Economic score (25% weight)
  const economicScore = (
    (this.stats.stg_balance / 1000) +
    (this.stats.net_stg_profit / 500) +
    (this.stats.weapons_owned * 25)
  );
  
  // Social score (20% weight)
  const socialScore = (
    (this.stats.guild_contributions / 100) +
    (this.stats.tournaments_won * 100) +
    (this.stats.tournament_points) +
    (this.stats.territory_captures * 50)
  );
  
  // Progression score (15% weight)
  const progressionScore = (
    (this.level * 20) +
    (this.stats.experience / 100) +
    (this.stats.achievements_completed * 50) +
    (this.stats.achievements_points)
  );
  
  this.rankings.battle_score = Math.floor(battleScore);
  this.rankings.economic_score = Math.floor(economicScore);
  this.rankings.social_score = Math.floor(socialScore);
  this.rankings.progression_score = Math.floor(progressionScore);
  
  // Overall score (weighted sum)
  this.rankings.overall_score = Math.floor(
    battleScore * 0.4 +
    economicScore * 0.25 +
    socialScore * 0.2 +
    progressionScore * 0.15
  );
  
  return this;
};

leaderboardEntrySchema.methods.addBadge = function(type, name, description, icon) {
  // Check if badge already exists
  const existingBadge = this.badges.find(badge => badge.type === type);
  if (!existingBadge) {
    this.badges.push({
      type,
      name,
      description,
      earned_date: new Date(),
      icon
    });
  }
  return this;
};

leaderboardEntrySchema.methods.addTitle = function(name, description) {
  // Check if title already exists
  const existingTitle = this.titles.find(title => title.name === name);
  if (!existingTitle) {
    // Deactivate all other titles
    this.titles.forEach(title => title.is_active = false);
    
    this.titles.push({
      name,
      description,
      earned_date: new Date(),
      is_active: true
    });
  }
  return this;
};

leaderboardEntrySchema.methods.recordHistory = function() {
  this.history.push({
    date: new Date(),
    rank: this.rankings.global_rank,
    score: this.rankings.overall_score,
    level: this.level,
    battles_won: this.stats.battles_won,
    stg_balance: this.stats.stg_balance
  });
  
  // Keep only last 30 days of history
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.history = this.history.filter(entry => entry.date > thirtyDaysAgo);
  
  return this;
};

// Static methods
leaderboardEntrySchema.statics.getGlobalLeaderboard = function(limit = 100, offset = 0) {
  return this.find({})
    .sort({ 'rankings.overall_score': -1 })
    .limit(limit)
    .skip(offset)
    .select('user_id telegram_id username faction level stats rankings badges titles');
};

leaderboardEntrySchema.statics.getFactionLeaderboard = function(faction, limit = 50) {
  return this.find({ faction })
    .sort({ 'rankings.overall_score': -1 })
    .limit(limit)
    .select('user_id telegram_id username level stats rankings badges titles');
};

leaderboardEntrySchema.statics.getLevelLeaderboard = function(limit = 50) {
  return this.find({})
    .sort({ level: -1, 'rankings.overall_score': -1 })
    .limit(limit)
    .select('user_id telegram_id username faction level stats rankings');
};

leaderboardEntrySchema.statics.getWealthLeaderboard = function(limit = 50) {
  return this.find({})
    .sort({ 'stats.stg_balance': -1 })
    .limit(limit)
    .select('user_id telegram_id username faction level stats rankings');
};

leaderboardEntrySchema.statics.getBattleLeaderboard = function(limit = 50) {
  return this.find({})
    .sort({ 'stats.battles_won': -1, 'stats.win_rate': -1 })
    .limit(limit)
    .select('user_id telegram_id username faction level stats rankings');
};

leaderboardEntrySchema.statics.getAchievementLeaderboard = function(limit = 50) {
  return this.find({})
    .sort({ 'stats.achievements_completed': -1, 'stats.achievements_points': -1 })
    .limit(limit)
    .select('user_id telegram_id username faction level stats rankings badges');
};

leaderboardEntrySchema.statics.getUserRank = function(userId) {
  return this.findOne({ user_id: userId })
    .select('rankings stats badges titles');
};

leaderboardEntrySchema.statics.updateRanks = async function() {
  // Update global ranks
  const globalEntries = await this.find({})
    .sort({ 'rankings.overall_score': -1 });
  
  globalEntries.forEach((entry, index) => {
    entry.rankings.global_rank = index + 1;
  });
  
  // Update faction ranks
  const iranEntries = await this.find({ faction: 'iran' })
    .sort({ 'rankings.overall_score': -1 });
  
  iranEntries.forEach((entry, index) => {
    entry.rankings.faction_rank = index + 1;
  });
  
  const usaEntries = await this.find({ faction: 'usa' })
    .sort({ 'rankings.overall_score': -1 });
  
  usaEntries.forEach((entry, index) => {
    entry.rankings.faction_rank = index + 1;
  });
  
  // Update other category ranks
  const levelEntries = await this.find({})
    .sort({ level: -1 });
  
  levelEntries.forEach((entry, index) => {
    entry.rankings.level_rank = index + 1;
  });
  
  const wealthEntries = await this.find({})
    .sort({ 'stats.stg_balance': -1 });
  
  wealthEntries.forEach((entry, index) => {
    entry.rankings.wealth_rank = index + 1;
  });
  
  const battleEntries = await this.find({})
    .sort({ 'stats.battles_won': -1, 'stats.win_rate': -1 });
  
  battleEntries.forEach((entry, index) => {
    entry.rankings.battle_rank = index + 1;
  });
  
  const achievementEntries = await this.find({})
    .sort({ 'stats.achievements_completed': -1, 'stats.achievements_points': -1 });
  
  achievementEntries.forEach((entry, index) => {
    entry.rankings.achievement_rank = index + 1;
  });
  
  // Save all updated entries
  await Promise.all([
    ...globalEntries.map(entry => entry.save()),
    ...iranEntries.map(entry => entry.save()),
    ...usaEntries.map(entry => entry.save()),
    ...levelEntries.map(entry => entry.save()),
    ...wealthEntries.map(entry => entry.save()),
    ...battleEntries.map(entry => entry.save()),
    ...achievementEntries.map(entry => entry.save())
  ]);
};

leaderboardEntrySchema.statics.getLeaderboardStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total_players: { $sum: 1 },
        iran_players: {
          $sum: { $cond: [{ $eq: ['$faction', 'iran'] }, 1, 0] }
        },
        usa_players: {
          $sum: { $cond: [{ $eq: ['$faction', 'usa'] }, 1, 0] }
        },
        average_level: { $avg: '$level' },
        average_stg_balance: { $avg: '$stats.stg_balance' },
        total_battles: { $sum: '$stats.total_battles' },
        total_stg_in_circulation: { $sum: '$stats.stg_balance' }
      }
    }
  ]);
};

leaderboardEntrySchema.statics.getTopPerformers = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$faction',
        top_player: { $first: '$$ROOT' },
        average_score: { $avg: '$rankings.overall_score' },
        total_players: { $sum: 1 }
      }
    },
    { $sort: { average_score: -1 } }
  ]);
};

// Update ranks periodically
setInterval(async () => {
  try {
    await leaderboardEntrySchema.updateRanks();
    console.log('Leaderboard ranks updated successfully');
  } catch (error) {
    console.error('Error updating leaderboard ranks:', error);
  }
}, 5 * 60 * 1000); // Update every 5 minutes

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
