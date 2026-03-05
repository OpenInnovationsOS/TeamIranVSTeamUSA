const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  battle_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  players: [{
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    telegram_id: { type: Number, required: true },
    username: { type: String, required: true },
    faction: { type: String, enum: ['iran', 'usa'], required: true },
    level: { type: Number, required: true },
    deck: [{ type: String }],
    current_health: { type: Number, default: 100 },
    max_health: { type: Number, default: 100 },
    energy: { type: Number, default: 50 },
    max_energy: { type: Number, default: 50 },
    moves: [{
      turn: { type: Number, required: true },
      action: { 
        type: String, 
        enum: ['attack', 'defend', 'special', 'heal'], 
        required: true 
      },
      target: { type: String },
      damage: { type: Number, default: 0 },
      healing: { type: Number, default: 0 },
      energy_cost: { type: Number, default: 0 },
      timestamp: { type: Date, default: Date.now }
    }],
    total_damage_dealt: { type: Number, default: 0 },
    total_damage_taken: { type: Number, default: 0 },
    total_healing: { type: Number, default: 0 }
  }],
  battle_config: {
    stake_amount: { type: Number, required: true, min: 100 },
    battle_type: { 
      type: String, 
      enum: ['normal', 'tournament', 'quick'], 
      default: 'normal' 
    },
    fee_amount: { type: Number, default: 0 },
    tournament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    special_rules: [{ type: String }],
    max_turns: { type: Number, default: 50 },
    time_limit_per_turn: { type: Number, default: 300 } // 5 minutes
  },
  result: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    outcome: { 
      type: String, 
      enum: ['player1_win', 'player2_win', 'draw', 'timeout'], 
      default: null 
    },
    duration_seconds: { type: Number },
    total_turns: { type: Number, default: 0 },
    experience_gained: {
      winner: { type: Number, default: 0 },
      loser: { type: Number, default: 0 }
    },
    stg_tokens_transferred: { type: Number, default: 0 },
    fee_collected: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'timeout'], 
    default: 'pending' 
  },
  current_turn: { type: Number, default: 0 },
  turn_time_limit: { type: Date },
  created_at: { type: Date, default: Date.now },
  started_at: { type: Date },
  completed_at: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
battleSchema.virtual('isPlayerTurn').get(function() {
  return this.current_turn === 0 || this.current_turn === 1;
});

battleSchema.virtual('currentPlayer').get(function() {
  return this.players[this.current_turn];
});

battleSchema.virtual('opponentPlayer').get(function() {
  return this.players[1 - this.current_turn];
});

// Indexes for performance
battleSchema.index({ 'players.user_id': 1 });
battleSchema.index({ status: 1 });
battleSchema.index({ created_at: -1 });
battleSchema.index({ completed_at: -1 });
battleSchema.index({ 'battle_config.battle_type': 1 });
battleSchema.index({ 'result.winner': 1 });

// Methods
battleSchema.methods.startBattle = function() {
  this.status = 'in_progress';
  this.started_at = new Date();
  this.current_turn = 0;
  this.resetTurnTimer();
  return this.save();
};

battleSchema.methods.makeMove = function(playerId, moveData) {
  const playerIndex = this.players.findIndex(p => p.user_id.toString() === playerId.toString());
  if (playerIndex !== this.current_turn) {
    throw new Error('Not your turn');
  }

  const player = this.players[playerIndex];
  const opponent = this.players[1 - playerIndex];

  // Validate move
  if (moveData.energy_cost > player.energy) {
    throw new Error('Not enough energy');
  }

  // Process move
  const move = {
    turn: this.current_turn,
    action: moveData.action,
    target: moveData.target,
    damage: 0,
    healing: 0,
    energy_cost: moveData.energy_cost,
    timestamp: new Date()
  };

  switch (moveData.action) {
    case 'attack':
      move.damage = moveData.damage || 25;
      opponent.current_health = Math.max(0, opponent.current_health - move.damage);
      opponent.total_damage_taken += move.damage;
      player.total_damage_dealt += move.damage;
      break;
    case 'heal':
      move.healing = moveData.healing || 20;
      player.current_health = Math.min(player.max_health, player.current_health + move.healing);
      player.total_healing += move.healing;
      break;
    case 'defend':
      // Reduce next damage taken
      break;
    case 'special':
      move.damage = moveData.damage || 40;
      opponent.current_health = Math.max(0, opponent.current_health - move.damage);
      opponent.total_damage_taken += move.damage;
      player.total_damage_dealt += move.damage;
      break;
  }

  player.energy -= move.energy_cost;
  player.moves.push(move);
  this.current_turn = 1 - this.current_turn;
  this.result.total_turns += 1;

  // Check for battle end
  if (opponent.current_health <= 0) {
    return this.completeBattle(player.user_id);
  }

  this.resetTurnTimer();
  return this.save();
};

battleSchema.methods.completeBattle = function(winnerId) {
  this.status = 'completed';
  this.completed_at = new Date();
  
  const winner = this.players.find(p => p.user_id.toString() === winnerId.toString());
  const loser = this.players.find(p => p.user_id.toString() !== winnerId.toString());
  
  this.result.winner = winner.user_id;
  this.result.loser = loser.user_id;
  this.result.outcome = winnerId.toString() === this.players[0].user_id.toString() ? 'player1_win' : 'player2_win';
  this.result.duration_seconds = Math.floor((this.completed_at - this.started_at) / 1000);
  
  // Calculate experience and rewards
  const baseExp = 50;
  const levelBonus = Math.floor(loser.level * 10);
  const winnerExp = baseExp + levelBonus;
  const loserExp = Math.floor(baseExp * 0.3);
  
  this.result.experience_gained = {
    winner: winnerExp,
    loser: loserExp
  };
  
  // Handle stake transfer
  const netStake = this.battle_config.stake_amount - this.battle_config.fee_amount;
  this.result.stg_tokens_transferred = netStake;
  this.result.fee_collected = this.battle_config.fee_amount;
  
  return this.save();
};

battleSchema.methods.resetTurnTimer = function() {
  const timeLimit = this.battle_config.time_limit_per_turn * 1000; // Convert to milliseconds
  this.turn_time_limit = new Date(Date.now() + timeLimit);
};

battleSchema.methods.checkTimeout = function() {
  if (this.turn_time_limit && new Date() > this.turn_time_limit) {
    // Current player loses due to timeout
    const timeoutLoser = this.players[this.current_turn];
    const winner = this.players[1 - this.current_turn];
    
    this.status = 'timeout';
    this.result.outcome = 'timeout';
    return this.completeBattle(winner.user_id);
  }
  return this;
};

// Static methods
battleSchema.statics.getActiveBattles = function() {
  return this.find({ 
    status: { $in: ['pending', 'in_progress'] } 
  }).populate('players.user_id', 'username telegram_id faction level');
};

battleSchema.statics.getBattlesByUser = function(userId, limit = 20) {
  return this.find({ 
    'players.user_id': userId 
  }).populate('players.user_id', 'username telegram_id faction level')
    .populate('result.winner', 'username')
    .sort({ created_at: -1 })
    .limit(limit);
};

battleSchema.statics.getBattleStats = function(timeframe = 24) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - timeframe);
  
  return this.aggregate([
    { $match: { completed_at: { $gte: cutoff } } },
    {
      $group: {
        _id: null,
        total_battles: { $sum: 1 },
        average_duration: { $avg: '$result.duration_seconds' },
        total_fees_collected: { $sum: '$result.fee_collected' },
        battles_by_type: {
          $push: '$battle_config.battle_type'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Battle', battleSchema);
