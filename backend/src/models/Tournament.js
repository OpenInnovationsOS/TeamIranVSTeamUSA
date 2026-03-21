const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  tournament_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String },
  tournament_type: { 
    type: String, 
    enum: ['elimination', 'round_robin', 'swiss', 'battle_royale'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['registration', 'ongoing', 'completed', 'cancelled'], 
    default: 'registration' 
  },
  
  // Registration settings
  registration: {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    min_participants: { type: Number, default: 8 },
    max_participants: { type: Number, default: 64 },
    entry_fee: { type: Number, default: 0 },
    level_requirement: { type: Number, default: 1 },
    faction_restriction: { type: String, enum: ['iran', 'usa', 'both'], default: 'both' },
    weapon_restrictions: [{ type: String }],
    prize_pool: { type: Number, default: 0 }
  },
  
  // Tournament settings
  settings: {
    battle_time_limit: { type: Number, default: 300 }, // 5 minutes
    stake_amount: { type: Number, default: 100 },
    rounds: { type: Number, default: 3 },
    matches_per_round: { type: Number, default: 1 },
    elimination_type: { type: String, enum: ['single', 'double'], default: 'single' },
    group_size: { type: Number, default: 4 } // for Swiss tournaments
  },
  
  // Participants
  participants: [{
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    telegram_id: { type: Number, required: true },
    username: { type: String, required: true },
    faction: { type: String, enum: ['iran', 'usa'], required: true },
    level: { type: Number, required: true },
    registration_date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['registered', 'active', 'eliminated', 'withdrawn'], 
      default: 'registered' 
    },
    current_round: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    total_damage_dealt: { type: Number, default: 0 },
    total_damage_taken: { type: Number, default: 0 },
    battles_fought: { type: Number, default: 0 }
  }],
  
  // Tournament bracket/structure
  bracket: {
    current_round: { type: Number, default: 0 },
    total_rounds: { type: Number, default: 0 },
    matches: [{
      round: { type: Number, required: true },
      match_number: { type: Number, required: true },
      player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      battle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
      status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed'], 
        default: 'pending' 
      },
      scheduled_time: { type: Date },
      completed_time: { type: Date }
    }]
  },
  
  // Results and prizes
  results: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    runner_up: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    third_place: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    final_standings: [{
      position: { type: Number, required: true },
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      faction: { type: String, required: true },
      prize_won: { type: Number, default: 0 },
      experience_gained: { type: Number, default: 0 }
    }],
    total_prize_pool: { type: Number, default: 0 },
    total_fees_collected: { type: Number, default: 0 }
  },
  
  // Timeline
  created_at: { type: Date, default: Date.now },
  start_date: { type: Date },
  end_date: { type: Date },
  completed_at: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
tournamentSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.status === 'registration' && 
         now >= this.registration.start_date && 
         now <= this.registration.end_date;
});

tournamentSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

tournamentSchema.virtual('prizePool').get(function() {
  const entryFees = this.participants.length * this.registration.entry_fee;
  return this.registration.prize_pool + entryFees;
});

// Indexes for performance
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ 'registration.start_date': 1 });
tournamentSchema.index({ 'registration.end_date': 1 });
tournamentSchema.index({ 'participants.user_id': 1 });
tournamentSchema.index({ created_at: -1 });

// Methods
tournamentSchema.methods.registerParticipant = function(user) {
  if (!this.isRegistrationOpen) {
    throw new Error('Registration is not open');
  }
  
  if (this.participants.length >= this.registration.max_participants) {
    throw new Error('Tournament is full');
  }
  
  if (user.level < this.registration.level_requirement) {
    throw new Error('Level requirement not met');
  }
  
  if (this.registration.faction_restriction !== 'both' && 
      user.faction !== this.registration.faction_restriction) {
    throw new Error('Faction restriction not met');
  }
  
  const isAlreadyRegistered = this.participants.some(p => 
    p.user_id.toString() === user._id.toString()
  );
  
  if (isAlreadyRegistered) {
    throw new Error('Already registered');
  }
  
  this.participants.push({
    user_id: user._id,
    telegram_id: user.telegram_id,
    username: user.username,
    faction: user.faction,
    level: user.level
  });
  
  return this.save();
};

tournamentSchema.methods.withdrawParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.user_id.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('Participant not found');
  }
  
  if (this.status !== 'registration') {
    throw new Error('Cannot withdraw after tournament has started');
  }
  
  this.participants.splice(participantIndex, 1);
  return this.save();
};

tournamentSchema.methods.startTournament = function() {
  if (this.status !== 'registration') {
    throw new Error('Tournament has already started');
  }
  
  if (this.participants.length < this.registration.min_participants) {
    throw new Error('Not enough participants');
  }
  
  this.status = 'ongoing';
  this.start_date = new Date();
  
  // Generate bracket based on tournament type
  this.generateBracket();
  
  return this.save();
};

tournamentSchema.methods.generateBracket = function() {
  const participants = [...this.participants];
  
  switch (this.tournament_type) {
    case 'elimination':
      this.generateEliminationBracket(participants);
      break;
    case 'round_robin':
      this.generateRoundRobinBracket(participants);
      break;
    case 'swiss':
      this.generateSwissBracket(participants);
      break;
    case 'battle_royale':
      this.generateBattleRoyaleBracket(participants);
      break;
  }
};

tournamentSchema.methods.generateEliminationBracket = function(participants) {
  // Shuffle participants for random seeding
  const shuffled = participants.sort(() => Math.random() - 0.5);
  
  // Calculate number of rounds needed
  const numParticipants = shuffled.length;
  const rounds = Math.ceil(Math.log2(numParticipants));
  
  this.bracket.total_rounds = rounds;
  this.bracket.current_round = 1;
  
  // Generate first round matches
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      this.bracket.matches.push({
        round: 1,
        match_number: Math.floor(i / 2) + 1,
        player1: shuffled[i].user_id,
        player2: shuffled[i + 1].user_id,
        status: 'pending'
      });
    } else {
      // Bye for odd number of participants
      shuffled[i].status = 'active';
      shuffled[i].current_round = 2;
    }
  }
};

tournamentSchema.methods.completeMatch = function(matchId, winnerId, battleId) {
  const match = this.bracket.matches.find(m => 
    m._id.toString() === matchId.toString()
  );
  
  if (!match) {
    throw new Error('Match not found');
  }
  
  match.winner = winnerId;
  match.battle_id = battleId;
  match.status = 'completed';
  match.completed_time = new Date();
  
  // Update participant stats
  const winner = this.participants.find(p => 
    p.user_id.toString() === winnerId.toString()
  );
  const loser = this.participants.find(p => 
    p.user_id.toString() !== winnerId.toString() && 
    (p.user_id.toString() === match.player1.toString() || 
     p.user_id.toString() === match.player2.toString())
  );
  
  if (winner) {
    winner.wins++;
    winner.points += 3;
    winner.status = 'active';
    winner.current_round = match.round + 1;
  }
  
  if (loser) {
    loser.losses++;
    loser.status = 'eliminated';
  }
  
  // Check if round is complete and generate next round
  this.checkRoundCompletion();
  
  return this.save();
};

tournamentSchema.methods.checkRoundCompletion = function() {
  const currentRoundMatches = this.bracket.matches.filter(m => 
    m.round === this.bracket.current_round
  );
  
  const allCompleted = currentRoundMatches.every(m => m.status === 'completed');
  
  if (allCompleted) {
    this.bracket.current_round++;
    
    if (this.bracket.current_round > this.bracket.total_rounds) {
      // Tournament complete
      this.completeTournament();
    } else {
      // Generate next round matches
      this.generateNextRoundMatches();
    }
  }
};

tournamentSchema.methods.completeTournament = function() {
  this.status = 'completed';
  this.end_date = new Date();
  this.completed_at = new Date();
  
  // Calculate final standings
  this.calculateFinalStandings();
  
  // Distribute prizes
  this.distributePrizes();
  
  return this.save();
};

tournamentSchema.methods.calculateFinalStandings = function() {
  // Sort participants by points, then by wins
  const sorted = this.participants.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.total_damage_dealt - a.total_damage_dealt;
  });
  
  this.results.final_standings = sorted.map((participant, index) => ({
    position: index + 1,
    user_id: participant.user_id,
    username: participant.username,
    faction: participant.faction,
    prize_won: 0, // Will be calculated in distributePrizes
    experience_gained: (sorted.length - index) * 100 // More XP for better placement
  }));
  
  // Set top 3
  if (sorted.length > 0) this.results.winner = sorted[0].user_id;
  if (sorted.length > 1) this.results.runner_up = sorted[1].user_id;
  if (sorted.length > 2) this.results.third_place = sorted[2].user_id;
};

tournamentSchema.methods.distributePrizes = function() {
  const totalPool = this.prizePool;
  const standings = this.results.final_standings;
  
  // Prize distribution (50% winner, 30% runner-up, 20% third place)
  const prizeDistribution = [0.5, 0.3, 0.2];
  
  standings.forEach((standing, index) => {
    if (index < prizeDistribution.length) {
      standing.prize_won = Math.floor(totalPool * prizeDistribution[index]);
    }
  });
  
  this.results.total_prize_pool = totalPool;
  this.results.total_fees_collected = this.participants.length * this.registration.entry_fee;
};

// Static methods
tournamentSchema.statics.getActiveTournaments = function() {
  return this.find({ 
    status: { $in: ['registration', 'ongoing'] } 
  }).populate('participants.user_id', 'username telegram_id faction level');
};

tournamentSchema.statics.getTournamentsByUser = function(userId) {
  return this.find({ 
    'participants.user_id': userId 
  }).populate('participants.user_id', 'username telegram_id faction level')
    .sort({ created_at: -1 });
};

tournamentSchema.statics.getUpcomingTournaments = function() {
  const now = new Date();
  return this.find({ 
    status: 'registration',
    'registration.start_date': { $gte: now }
  }).sort({ 'registration.start_date': 1 });
};

module.exports = mongoose.model('Tournament', tournamentSchema);
