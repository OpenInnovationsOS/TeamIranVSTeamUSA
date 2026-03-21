const mongoose = require('mongoose');

const territorySchema = new mongoose.Schema({
  territory_id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String },
  
  // Geographic information
  location: {
    region: { type: String, required: true }, // e.g., "Middle East", "North America"
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    adjacent_territories: [{ type: String }] // territory_ids
  },
  
  // Territory characteristics
  characteristics: {
    terrain_type: { 
      type: String, 
      enum: ['urban', 'desert', 'mountain', 'coastal', 'forest', 'industrial'], 
      required: true 
    },
    strategic_value: { 
      type: Number, 
      min: 1, 
      max: 10, 
      default: 5 
    },
    population: { type: Number, default: 0 },
    resources: [{
      type: { 
        type: String, 
        enum: ['oil', 'gas', 'minerals', 'food', 'technology', 'military'] 
      },
      abundance: { type: Number, min: 1, max: 10, default: 5 }
    }],
    defenses: {
      fortifications: { type: Number, default: 0 },
      natural_barriers: { type: Number, default: 0 },
      military_presence: { type: Number, default: 0 }
    }
  },
  
  // Control information
  control: {
    current_controller: { 
      type: String, 
      enum: ['iran', 'usa', 'neutral', 'contested'], 
      default: 'neutral' 
    },
    original_controller: { 
      type: String, 
      enum: ['iran', 'usa', 'neutral'], 
      default: 'neutral' 
    },
    control_since: { type: Date },
    control_strength: { type: Number, default: 0, min: 0, max: 100 },
    guild_controller: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild' }
  },
  
  // Battle bonuses for fights in this territory
  battle_bonuses: {
    attacker_bonus: { type: Number, default: 0 },
    defender_bonus: { type: Number, default: 0 },
    faction_bonuses: {
      iran: { attack: { type: Number, default: 0 }, defense: { type: Number, default: 0 }, experience: { type: Number, default: 0 } },
      usa: { attack: { type: Number, default: 0 }, defense: { type: Number, default: 0 }, experience: { type: Number, default: 0 } }
    },
    terrain_bonuses: {
      urban: { attack: { type: Number, default: 0 }, defense: { type: Number, default: 10 } },
      desert: { attack: { type: Number, default: 5 }, defense: { type: Number, default: 5 } },
      mountain: { attack: { type: Number, default: -5 }, defense: { type: Number, default: 15 } },
      coastal: { attack: { type: Number, default: 5 }, defense: { type: Number, default: 5 } },
      forest: { attack: { type: Number, default: -5 }, defense: { type: Number, default: 10 } },
      industrial: { attack: { type: Number, default: 10 }, defense: { type: Number, default: 0 } }
    }
  },
  
  // Economic information
  economy: {
    stg_generation_rate: { type: Number, default: 0 }, // STG per hour
    resource_generation: [{
      resource_type: String,
      generation_rate: Number,
      last_collected: Date
    }],
    tax_rate: { type: Number, default: 0.05 }, // 5% tax on battles
    daily_income: { type: Number, default: 0 }
  },
  
  // Conflict history
  conflict_history: [{
    battle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },
    date: { type: Date, required: true },
    attacker: { type: String, enum: ['iran', 'usa'], required: true },
    defender: { type: String, enum: ['iran', 'usa'], required: true },
    result: { type: String, enum: ['attacker_win', 'defender_win', 'draw'], required: true },
    control_change: { type: Boolean, default: false },
    casualties: {
      attacker: { type: Number, default: 0 },
      defender: { type: Number, default: 0 }
    }
  }],
  
  // Territory status
  status: {
    is_active: { type: Boolean, default: true },
    is_contested: { type: Boolean, default: false },
    conflict_cooldown: { type: Date }, // Time until next conflict can start
    last_battle: { type: Date },
    next_battle_available: { type: Date },
    occupation_level: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  // Territory upgrades
  upgrades: {
    level: { type: Number, default: 1, min: 1, max: 5 },
    fortifications: { type: Number, default: 0, min: 0, max: 10 },
    resource_extraction: { type: Number, default: 0, min: 0, max: 10 },
    military_base: { type: Boolean, default: false },
    research_facility: { type: Boolean, default: false },
    trade_hub: { type: Boolean, default: false }
  },
  
  // Visual information
  visual: {
    icon: { type: String },
    color_scheme: {
      iran: { type: String, default: '#008000' },
      usa: { type: String, default: '#002868' },
      neutral: { type: String, default: '#808080' },
      contested: { type: String, default: '#FF0000' }
    },
    map_marker: { type: String }
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
territorySchema.virtual('isControlled').get(function() {
  return this.control.current_controller !== 'neutral' && this.control.current_controller !== 'contested';
});

territorySchema.virtual('canBeAttacked').get(function() {
  return this.status.is_active && 
         !this.status.is_contested && 
         (!this.status.conflict_cooldown || new Date() > this.status.conflict_cooldown);
});

territorySchema.virtual('totalBonus').get(function() {
  const terrainBonus = this.battle_bonuses.terrain_bonuses[this.characteristics.terrain_type] || { attack: 0, defense: 0 };
  const factionBonus = this.control.current_controller !== 'neutral' ? 
    this.battle_bonuses.faction_bonuses[this.control.current_controller] || { attack: 0, defense: 0, experience: 0 } :
    { attack: 0, defense: 0, experience: 0 };
  
  return {
    attack: terrainBonus.attack + factionBonus.attack,
    defense: terrainBonus.defense + factionBonus.defense,
    experience: factionBonus.experience
  };
});

// Indexes for performance
territorySchema.index({ 'control.current_controller': 1 });
territorySchema.index({ 'location.region': 1 });
territorySchema.index({ 'characteristics.strategic_value': -1 });
territorySchema.index({ 'status.is_active': 1 });
territorySchema.index({ 'status.is_contested': 1 });
territorySchema.index({ 'control.guild_controller': 1 });

// Methods
territorySchema.methods.changeControl = function(newController, guildId = null) {
  const oldController = this.control.current_controller;
  
  this.control.current_controller = newController;
  this.control.control_since = new Date();
  this.control.guild_controller = guildId;
  this.control.control_strength = 50; // Start at 50% control strength
  
  // Reset occupation level
  this.status.occupation_level = 0;
  
  // Add to conflict history
  this.conflict_history.push({
    date: new Date(),
    attacker: newController,
    defender: oldController,
    result: 'attacker_win',
    control_change: true
  });
  
  // Update economic generation based on new controller
  this.updateEconomicGeneration();
  
  return this.save();
};

territorySchema.methods.startConflict = function(attacker, defender) {
  if (!this.canBeAttacked) {
    throw new Error('Territory cannot be attacked at this time');
  }
  
  this.status.is_contested = true;
  this.status.last_battle = new Date();
  
  // Set conflict cooldown (1 hour)
  const cooldown = new Date();
  cooldown.setHours(cooldown.getHours() + 1);
  this.status.conflict_cooldown = cooldown;
  
  return this.save();
};

territorySchema.methods.resolveConflict = function(winner, loser, battleId) {
  const wasControlChange = this.control.current_controller === loser;
  
  if (wasControlChange) {
    this.changeControl(winner);
  }
  
  // Add to conflict history
  this.conflict_history.push({
    battle_id: battleId,
    date: new Date(),
    attacker: attacker,
    defender: loser,
    result: attacker === winner ? 'attacker_win' : 'defender_win',
    control_change: wasControlChange
  });
  
  this.status.is_contested = false;
  
  return this.save();
};

territorySchema.methods.updateControlStrength = function(strength) {
  this.control.control_strength = Math.max(0, Math.min(100, strength));
  
  // Update occupation level based on control strength
  this.status.occupation_level = this.control.control_strength;
  
  // Update economic generation based on control strength
  this.updateEconomicGeneration();
  
  return this.save();
};

territorySchema.methods.updateEconomicGeneration = function() {
  if (this.control.current_controller === 'neutral' || this.control.current_controller === 'contested') {
    this.economy.stg_generation_rate = 0;
    this.economy.daily_income = 0;
    return;
  }
  
  const baseGeneration = this.characteristics.strategic_value * 10;
  const controlMultiplier = this.control.control_strength / 100;
  const upgradeMultiplier = 1 + (this.upgrades.level * 0.2);
  const resourceMultiplier = this.upgrades.resource_extraction * 0.1;
  
  this.economy.stg_generation_rate = Math.floor(
    baseGeneration * controlMultiplier * upgradeMultiplier * (1 + resourceMultiplier)
  );
  
  this.economy.daily_income = this.economy.stg_generation_rate * 24;
  
  return this;
};

territorySchema.methods.collectResources = function() {
  const collected = [];
  
  this.economy.resource_generation.forEach(resource => {
    const now = new Date();
    const hoursSinceLastCollection = (now - resource.last_collected) / (1000 * 60 * 60);
    const amount = Math.floor(resource.generation_rate * hoursSinceLastCollection);
    
    if (amount > 0) {
      collected.push({
        type: resource.resource_type,
        amount: amount
      });
      
      resource.last_collected = now;
    }
  });
  
  return collected;
};

territorySchema.methods.upgrade = function(upgradeType) {
  switch (upgradeType) {
    case 'level':
      if (this.upgrades.level < 5) {
        this.upgrades.level++;
        this.updateEconomicGeneration();
      }
      break;
    case 'fortifications':
      if (this.upgrades.fortifications < 10) {
        this.upgrades.fortifications++;
        this.characteristics.defenses.fortifications++;
      }
      break;
    case 'resource_extraction':
      if (this.upgrades.resource_extraction < 10) {
        this.upgrades.resource_extraction++;
        this.updateEconomicGeneration();
      }
      break;
    case 'military_base':
      this.upgrades.military_base = true;
      this.characteristics.defenses.military_presence += 5;
      break;
    case 'research_facility':
      this.upgrades.research_facility = true;
      break;
    case 'trade_hub':
      this.upgrades.trade_hub = true;
      this.economy.stg_generation_rate *= 1.5;
      break;
  }
  
  return this.save();
};

territorySchema.methods.getBattleBonuses = function(attackerFaction, defenderFaction) {
  const terrainBonus = this.battle_bonuses.terrain_bonuses[this.characteristics.terrain_type] || { attack: 0, defense: 0 };
  const attackerFactionBonus = this.battle_bonuses.faction_bonuses[attackerFaction] || { attack: 0, defense: 0, experience: 0 };
  const defenderFactionBonus = this.battle_bonuses.faction_bonuses[defenderFaction] || { attack: 0, defense: 0, experience: 0 };
  
  return {
    attacker: {
      attack: terrainBonus.attack + attackerFactionBonus.attack,
      defense: terrainBonus.defense + attackerFactionBonus.defense,
      experience: attackerFactionBonus.experience
    },
    defender: {
      attack: terrainBonus.attack + defenderFactionBonus.attack,
      defense: terrainBonus.defense + defenderFactionBonus.defense,
      experience: defenderFactionBonus.experience
    }
  };
};

// Static methods
territorySchema.statics.getByController = function(controller) {
  return this.find({ 'control.current_controller': controller, 'status.is_active': true })
    .sort({ 'characteristics.strategic_value': -1 });
};

territorySchema.statics.getByRegion = function(region) {
  return this.find({ 'location.region': region, 'status.is_active': true })
    .sort({ 'characteristics.strategic_value': -1 });
};

territorySchema.statics.getContestedTerritories = function() {
  return this.find({ 'status.is_contested': true })
    .sort({ 'status.last_battle': -1 });
};

territorySchema.statics.getAttackableTerritories = function(faction) {
  return this.find({
    'status.is_active': true,
    'status.is_contested': false,
    $or: [
      { 'control.current_controller': { $ne: faction } },
      { 'control.current_controller': 'neutral' }
    ],
    $or: [
      { 'status.conflict_cooldown': { $exists: false } },
      { 'status.conflict_cooldown': { $lt: new Date() } }
    ]
  }).sort({ 'characteristics.strategic_value': -1 });
};

territorySchema.statics.getTerritoryStats = function() {
  return this.aggregate([
    { $match: { 'status.is_active': true } },
    {
      $group: {
        _id: '$control.current_controller',
        count: { $sum: 1 },
        total_strategic_value: { $sum: '$characteristics.strategic_value' },
        average_control_strength: { $avg: '$control.control_strength' },
        total_stg_generation: { $sum: '$economy.stg_generation_rate' }
      }
    }
  ]);
};

territorySchema.statics.getWorldMap = function() {
  return this.find({ 'status.is_active': true })
    .select('territory_id name location control characteristics visual')
    .sort({ 'location.coordinates.x': 1, 'location.coordinates.y': 1 });
};

// Pre-save middleware
territorySchema.pre('save', function(next) {
  if (this.isModified('control.current_controller') || this.isModified('control.control_strength')) {
    this.updateEconomicGeneration();
  }
  next();
});

// Initialize default territories
territorySchema.statics.initializeTerritories = async function() {
  const defaultTerritories = [
    // Iran territories
    {
      territory_id: 'tehran',
      name: 'Tehran',
      location: { region: 'Middle East', coordinates: { x: 300, y: 200 } },
      characteristics: { terrain_type: 'urban', strategic_value: 10 },
      control: { current_controller: 'iran', original_controller: 'iran' },
      battle_bonuses: {
        faction_bonuses: {
          iran: { attack: 5, defense: 10, experience: 20 },
          usa: { attack: -5, defense: -5, experience: 0 }
        }
      }
    },
    {
      territory_id: 'isfahan',
      name: 'Isfahan',
      location: { region: 'Middle East', coordinates: { x: 320, y: 250 } },
      characteristics: { terrain_type: 'desert', strategic_value: 7 },
      control: { current_controller: 'iran', original_controller: 'iran' },
      battle_bonuses: {
        faction_bonuses: {
          iran: { attack: 3, defense: 12, experience: 15 },
          usa: { attack: -3, defense: -3, experience: 0 }
        }
      }
    },
    {
      territory_id: 'mashhad',
      name: 'Mashhad',
      location: { region: 'Middle East', coordinates: { x: 380, y: 180 } },
      characteristics: { terrain_type: 'mountain', strategic_value: 6 },
      control: { current_controller: 'iran', original_controller: 'iran' },
      battle_bonuses: {
        faction_bonuses: {
          iran: { attack: 4, defense: 11, experience: 12 },
          usa: { attack: -4, defense: -4, experience: 0 }
        }
      }
    },
    // USA territories
    {
      territory_id: 'new_york',
      name: 'New York',
      location: { region: 'North America', coordinates: { x: 100, y: 150 } },
      characteristics: { terrain_type: 'urban', strategic_value: 10 },
      control: { current_controller: 'usa', original_controller: 'usa' },
      battle_bonuses: {
        faction_bonuses: {
          usa: { attack: 10, defense: 5, experience: 20 },
          iran: { attack: -5, defense: -5, experience: 0 }
        }
      }
    },
    {
      territory_id: 'los_angeles',
      name: 'Los Angeles',
      location: { region: 'North America', coordinates: { x: 50, y: 200 } },
      characteristics: { terrain_type: 'coastal', strategic_value: 8 },
      control: { current_controller: 'usa', original_controller: 'usa' },
      battle_bonuses: {
        faction_bonuses: {
          usa: { attack: 8, defense: 7, experience: 15 },
          iran: { attack: -3, defense: -3, experience: 0 }
        }
      }
    },
    {
      territory_id: 'chicago',
      name: 'Chicago',
      location: { region: 'North America', coordinates: { x: 120, y: 170 } },
      characteristics: { terrain_type: 'industrial', strategic_value: 7 },
      control: { current_controller: 'usa', original_controller: 'usa' },
      battle_bonuses: {
        faction_bonuses: {
          usa: { attack: 12, defense: 4, experience: 12 },
          iran: { attack: -4, defense: -4, experience: 0 }
        }
      }
    }
  ];
  
  for (const territoryData of defaultTerritories) {
    const existing = await this.findOne({ territory_id: territoryData.territory_id });
    if (!existing) {
      await this.create(territoryData);
    }
  }
};

module.exports = mongoose.model('Territory', territorySchema);
