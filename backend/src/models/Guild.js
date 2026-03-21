const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guild_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  tag: { type: String, uppercase: true, trim: true }, // 3-5 character tag
  
  // Guild settings
  faction: { 
    type: String, 
    enum: ['iran', 'usa', 'neutral'], 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['public', 'private', 'invite_only'], 
    default: 'public' 
  },
  
  // Membership settings
  membership: {
    min_level: { type: Number, default: 1 },
    max_members: { type: Number, default: 50 },
    auto_accept: { type: Boolean, default: false },
    require_approval: { type: Boolean, default: true },
    application_question: { type: String }
  },
  
  // Guild leadership
  leader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  officers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Guild members
  members: [{
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    telegram_id: { type: Number, required: true },
    username: { type: String, required: true },
    faction: { type: String, enum: ['iran', 'usa'], required: true },
    level: { type: Number, required: true },
    rank: { 
      type: String, 
      enum: ['leader', 'officer', 'veteran', 'member', 'recruit'], 
      default: 'member' 
    },
    joined_date: { type: Date, default: Date.now },
    last_active: { type: Date, default: Date.now },
    contribution: {
      battles_won: { type: Number, default: 0 },
      battles_lost: { type: Number, default: 0 },
      stg_contributed: { type: Number, default: 0 },
      territory_captured: { type: Number, default: 0 },
      events_participated: { type: Number, default: 0 }
    },
    permissions: {
      can_invite: { type: Boolean, default: false },
      can_kick: { type: Boolean, default: false },
      can_promote: { type: Boolean, default: false },
      can_manage_events: { type: Boolean, default: false },
      can_manage_territory: { type: Boolean, default: false }
    }
  }],
  
  // Guild resources
  resources: {
    stg_treasury: { type: Number, default: 0 },
    territory_control: { type: Number, default: 0 }, // Number of territories controlled
    power_level: { type: Number, default: 0 }, // Guild power for rankings
    influence_points: { type: Number, default: 0 }
  },
  
  // Guild statistics
  stats: {
    total_battles: { type: Number, default: 0 },
    battles_won: { type: Number, default: 0 },
    battles_lost: { type: Number, default: 0 },
    win_rate: { type: Number, default: 0 },
    average_member_level: { type: Number, default: 0 },
    territories_captured: { type: Number, default: 0 },
    territories_lost: { type: Number, default: 0 },
    tournaments_won: { type: Number, default: 0 },
    guild_wars_won: { type: Number, default: 0 }
  },
  
  // Guild activities
  activities: {
    last_battle: { type: Date },
    last_tournament: { type: Date },
    last_territory_capture: { type: Date },
    active_events: [{ type: mongoose.Schema.Types.ObjectId }],
    upcoming_events: [{ type: mongoose.Schema.Types.ObjectId }]
  },
  
  // Guild settings and preferences
  settings: {
    member_chat_enabled: { type: Boolean, default: true },
    officer_chat_enabled: { type: Boolean, default: true },
    announcements_enabled: { type: Boolean, default: true },
    auto_promote_threshold: { type: Number, default: 0 }, // STG contributed for auto-promotion
    inactive_kick_days: { type: Number, default: 30 },
    tax_rate: { type: Number, default: 0.05 }, // 5% tax on member earnings
    description: { type: String }
  },
  
  // Guild status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'disbanded', 'in_war'], 
    default: 'active' 
  },
  
  // Guild wars and alliances
  wars: [{
    enemy_guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild' },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date },
    status: { 
      type: String, 
      enum: ['active', 'won', 'lost', 'draw'], 
      default: 'active' 
    },
    prize_pool: { type: Number, default: 0 },
    territory_stakes: [{ type: String }]
  }],
  
  alliances: [{
    ally_guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild' },
    start_date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'ended'], 
      default: 'active' 
    }
  }],
  
  // Timeline
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  disbanded_at: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
guildSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

guildSchema.virtual('isFull').get(function() {
  return this.members.length >= this.membership.max_members;
});

guildSchema.virtual('averageMemberLevel').get(function() {
  if (this.members.length === 0) return 0;
  const totalLevel = this.members.reduce((sum, member) => sum + member.level, 0);
  return totalLevel / this.members.length;
});

guildSchema.virtual('canJoin').get(function() {
  return this.status === 'active' && 
         !this.isFull && 
         (this.type === 'public' || this.type === 'invite_only');
});

// Indexes for performance
guildSchema.index({ guild_id: 1 });
guildSchema.index({ faction: 1 });
guildSchema.index({ type: 1 });
guildSchema.index({ status: 1 });
guildSchema.index({ leader: 1 });
guildSchema.index({ 'members.user_id': 1 });
guildSchema.index({ 'resources.power_level': -1 });
guildSchema.index({ created_at: -1 });

// Methods
guildSchema.methods.addMember = function(user, rank = 'recruit') {
  if (this.isFull) {
    throw new Error('Guild is full');
  }
  
  if (user.level < this.membership.min_level) {
    throw new Error(`Level requirement: ${this.membership.min_level}`);
  }
  
  // Check faction requirements
  if (this.faction !== 'neutral' && user.faction !== this.faction) {
    throw new Error(`Faction requirement: ${this.faction}`);
  }
  
  const existingMember = this.members.find(m => 
    m.user_id.toString() === user._id.toString()
  );
  
  if (existingMember) {
    throw new Error('Already a member');
  }
  
  const newMember = {
    user_id: user._id,
    telegram_id: user.telegram_id,
    username: user.username,
    faction: user.faction,
    level: user.level,
    rank: rank,
    joined_date: new Date(),
    last_active: new Date()
  };
  
  // Set permissions based on rank
  switch (rank) {
    case 'leader':
      newMember.permissions = {
        can_invite: true,
        can_kick: true,
        can_promote: true,
        can_manage_events: true,
        can_manage_territory: true
      };
      break;
    case 'officer':
      newMember.permissions = {
        can_invite: true,
        can_kick: true,
        can_promote: false,
        can_manage_events: true,
        can_manage_territory: false
      };
      break;
    case 'veteran':
      newMember.permissions = {
        can_invite: true,
        can_kick: false,
        can_promote: false,
        can_manage_events: false,
        can_manage_territory: false
      };
      break;
  }
  
  this.members.push(newMember);
  this.updateStats();
  
  return this.save();
};

guildSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => 
    m.user_id.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('Member not found');
  }
  
  const member = this.members[memberIndex];
  
  // Cannot remove the leader
  if (member.rank === 'leader') {
    throw new Error('Cannot remove guild leader');
  }
  
  this.members.splice(memberIndex, 1);
  this.updateStats();
  
  return this.save();
};

guildSchema.methods.promoteMember = function(userId, newRank) {
  const member = this.members.find(m => 
    m.user_id.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('Member not found');
  }
  
  // Define rank hierarchy
  const rankHierarchy = {
    'recruit': 0,
    'member': 1,
    'veteran': 2,
    'officer': 3,
    'leader': 4
  };
  
  if (rankHierarchy[newRank] <= rankHierarchy[member.rank]) {
    throw new Error('New rank must be higher than current rank');
  }
  
  member.rank = newRank;
  
  // Update permissions based on new rank
  switch (newRank) {
    case 'officer':
      member.permissions = {
        can_invite: true,
        can_kick: true,
        can_promote: false,
        can_manage_events: true,
        can_manage_territory: false
      };
      break;
    case 'veteran':
      member.permissions = {
        can_invite: true,
        can_kick: false,
        can_promote: false,
        can_manage_events: false,
        can_manage_territory: false
      };
      break;
  }
  
  return this.save();
};

guildSchema.methods.updateMemberActivity = function(userId) {
  const member = this.members.find(m => 
    m.user_id.toString() === userId.toString()
  );
  
  if (member) {
    member.last_active = new Date();
    return this.save();
  }
  
  return this;
};

guildSchema.methods.updateStats = function() {
  this.stats.average_member_level = this.averageMemberLevel;
  this.stats.total_battles = this.members.reduce((sum, m) => 
    sum + m.contribution.battles_won + m.contribution.battles_lost, 0
  );
  this.stats.battles_won = this.members.reduce((sum, m) => 
    sum + m.contribution.battles_won, 0
  );
  this.stats.battles_lost = this.members.reduce((sum, m) => 
    sum + m.contribution.battles_lost, 0
  );
  
  if (this.stats.total_battles > 0) {
    this.stats.win_rate = (this.stats.battles_won / this.stats.total_battles) * 100;
  }
  
  // Update power level based on various factors
  this.resources.power_level = Math.floor(
    (this.memberCount * 10) + 
    (this.stats.average_member_level * 5) + 
    (this.stats.win_rate * 2) + 
    (this.resources.territory_control * 20) +
    (this.resources.stg_treasury / 1000)
  );
  
  this.last_updated = new Date();
};

guildSchema.methods.contributeResources = function(userId, amount, type = 'stg') {
  const member = this.members.find(m => 
    m.user_id.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('Member not found');
  }
  
  if (type === 'stg') {
    this.resources.stg_treasury += amount;
    member.contribution.stg_contributed += amount;
    
    // Check for auto-promotion
    if (this.settings.auto_promote_threshold > 0 && 
        member.contribution.stg_contributed >= this.settings.auto_promote_threshold &&
        member.rank === 'member') {
      this.promoteMember(userId, 'veteran');
    }
  }
  
  this.updateStats();
  return this.save();
};

guildSchema.methods.startWar = function(enemyGuildId, prizePool = 0) {
  if (this.status === 'in_war') {
    throw new Error('Already in a war');
  }
  
  this.wars.push({
    enemy_guild: enemyGuildId,
    start_date: new Date(),
    status: 'active',
    prize_pool: prizePool
  });
  
  this.status = 'in_war';
  return this.save();
};

guildSchema.methods.endWar = function(warIndex, result) {
  if (this.wars[warIndex]) {
    this.wars[warIndex].status = result;
    this.wars[warIndex].end_date = new Date();
    
    if (result === 'won') {
      this.stats.guild_wars_won += 1;
    }
    
    // Check if there are any active wars left
    const activeWars = this.wars.filter(w => w.status === 'active');
    this.status = activeWars.length > 0 ? 'in_war' : 'active';
    
    return this.save();
  }
  
  throw new Error('War not found');
};

// Static methods
guildSchema.statics.findByFaction = function(faction) {
  return this.find({ 
    faction, 
    status: 'active',
    type: { $in: ['public', 'invite_only'] }
  }).sort({ 'resources.power_level': -1 });
};

guildSchema.statics.findPublicGuilds = function(limit = 20) {
  return this.find({ 
    type: 'public', 
    status: 'active' 
  }).sort({ 'resources.power_level': -1 })
    .limit(limit);
};

guildSchema.statics.searchGuilds = function(query, faction = null) {
  const searchQuery = {
    status: 'active',
    type: { $in: ['public', 'invite_only'] }
  };
  
  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { tag: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  
  if (faction) {
    searchQuery.faction = faction;
  }
  
  return this.find(searchQuery)
    .sort({ 'resources.power_level': -1 })
    .limit(20);
};

guildSchema.statics.getTopGuilds = function(limit = 10, faction = null) {
  const query = { status: 'active' };
  if (faction) query.faction = faction;
  
  return this.find(query)
    .sort({ 'resources.power_level': -1 })
    .limit(limit);
};

guildSchema.statics.cleanupInactiveMembers = function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
  
  return this.updateMany(
    { 'members.last_active': { $lt: cutoffDate } },
    { $pull: { members: { last_active: { $lt: cutoffDate } } } }
  );
};

// Pre-save middleware
guildSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.updateStats();
  }
  next();
});

module.exports = mongoose.model('Guild', guildSchema);
