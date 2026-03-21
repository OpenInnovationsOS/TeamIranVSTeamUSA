// Advanced Battle Engine
class BattleEngine {
  constructor(player1, player2, weapon1, weapon2, territory) {
    this.players = [
      this.initializePlayer(player1, weapon1, 'player1'),
      this.initializePlayer(player2, weapon2, 'player2')
    ];
    
    this.territory = territory;
    this.currentTurn = 0;
    this.activePlayer = 0;
    this.turnCount = 0;
    this.battleLog = [];
    this.status = 'active';
    this.winner = null;
    this.battleQuality = 'normal';
    this.startTime = Date.now();
    
    // Apply territory bonuses
    this.applyTerritoryBonuses();
    
    // Determine first player (higher speed)
    this.activePlayer = this.players[0].speed >= this.players[1].speed ? 0 : 1;
    
    console.log(`⚔️ Battle started: ${player1.username} vs ${player2.username}`);
  }
  
  initializePlayer(player, weapon, playerId) {
    return {
      id: player.id,
      username: player.username,
      faction: player.faction,
      level: player.level,
      
      // Base stats
      maxHealth: 100 + (player.level * 10),
      maxMana: 50 + (player.level * 5),
      health: 100 + (player.level * 10),
      mana: 50 + (player.level * 5),
      attack: 10 + (player.level * 2),
      defense: 5 + (player.level * 1),
      speed: 10 + Math.floor(player.level / 2),
      critical: 0.05,
      
      // Weapon bonuses
      weapon: weapon,
      weaponAttack: weapon.power,
      weaponDefense: weapon.defense,
      weaponCritical: weapon.critical,
      
      // Status effects
      statusEffects: [],
      buffs: [],
      debuffs: [],
      
      // Battle state
      defending: false,
      stunned: false,
      poisoned: false,
      burning: false,
      frozen: false,
      
      // Position
      position: playerId === 'player1' ? 'left' : 'right',
      
      // Experience and rewards
      experience: 0,
      damageDealt: 0,
      damageTaken: 0,
      criticalHits: 0,
      skillsUsed: 0
    };
  }
  
  applyTerritoryBonuses() {
    this.players.forEach(player => {
      const isHomeTerritory = this.territory.controller === player.faction;
      const homeBonus = isHomeTerritory ? 1.5 : 1.0;
      
      player.attack = (player.attack + player.weaponAttack) * homeBonus;
      player.defense = (player.defense + player.weaponDefense) * homeBonus;
      player.critical = player.critical + player.weaponCritical;
      
      // Territory-specific bonuses
      player.attack += this.territory.attack_bonus;
      player.defense += this.territory.defense_bonus;
      
      // Faction bonuses
      if (player.faction === 'iran') {
        player.defense *= 1.2; // Iran gets defense bonus
      } else if (player.faction === 'usa') {
        player.attack *= 1.2; // USA gets attack bonus
      }
      
      // Weapon faction bonuses
      const weaponBonus = player.weapon.faction_bonus[player.faction] || 1.0;
      player.attack *= weaponBonus;
    });
  }
  
  getCurrentPlayer() {
    return this.players[this.activePlayer];
  }
  
  getOpponent() {
    const opponentIndex = this.activePlayer === 0 ? 1 : 0;
    return this.players[opponentIndex];
  }
  
  executeAction(action) {
    if (this.status !== 'active') {
      return { error: 'Battle is not active' };
    }
    
    const player = this.getCurrentPlayer();
    const opponent = this.getOpponent();
    
    // Check if player is stunned
    if (player.stunned) {
      this.addToBattleLog(`${player.username} is stunned and skips their turn!`, 'status');
      player.stunned = false;
      return this.switchTurn();
    }
    
    let result = {};
    
    switch (action.type) {
      case 'attack':
        result = this.executeAttack(player, opponent, action.weaponId);
        break;
        
      case 'skill':
        result = this.executeSkill(player, opponent, action.skillId);
        break;
        
      case 'defend':
        result = this.executeDefend(player);
        break;
        
      case 'item':
        result = this.executeItem(player, action.itemId);
        break;
        
      case 'surrender':
        result = this.executeSurrender(player);
        break;
        
      default:
        result = { error: 'Unknown action type' };
    }
    
    // Process status effects
    this.processStatusEffects(player);
    this.processStatusEffects(opponent);
    
    // Check for battle end
    if (this.checkBattleEnd()) {
      return this.endBattle();
    }
    
    // Switch turns
    return this.switchTurn();
  }
  
  executeAttack(attacker, defender, weaponId) {
    // Calculate hit chance
    const accuracy = 0.85 + (attacker.level * 0.01);
    const evasion = 0.05 + (defender.level * 0.01);
    const hitChance = accuracy - evasion;
    
    if (Math.random() > hitChance) {
      this.addToBattleLog(`${attacker.username} attacks but misses!`, 'miss');
      return {
        type: 'attack',
        hit: false,
        attacker: attacker.id,
        defender: defender.id
      };
    }
    
    // Calculate damage
    const baseDamage = attacker.attack;
    const defense = defender.defending ? defender.defense * 1.5 : defender.defense;
    const damageReduction = defense / (defense + 100);
    let damage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
    
    // Check for critical hit
    const criticalChance = attacker.critical;
    const isCritical = Math.random() < criticalChance;
    if (isCritical) {
      damage *= 2;
      attacker.criticalHits++;
    }
    
    // Apply damage
    defender.health = Math.max(0, defender.health - damage);
    defender.damageTaken += damage;
    attacker.damageDealt += damage;
    
    // Reset defending state
    defender.defending = false;
    
    // Log the action
    const critText = isCritical ? ' (CRITICAL!)' : '';
    this.addToBattleLog(
      `${attacker.username} attacks ${defender.username} for ${damage} damage${critText}`,
      'damage'
    );
    
    return {
      type: 'attack',
      hit: true,
      damage,
      isCritical,
      attacker: attacker.id,
      defender: defender.id,
      newHealth: defender.health,
      effects: []
    };
  }
  
  executeSkill(attacker, defender, skillId) {
    const skill = this.getSkill(skillId);
    
    if (!skill) {
      return { error: 'Skill not found' };
    }
    
    if (attacker.mana < skill.manaCost) {
      return { error: 'Insufficient mana' };
    }
    
    // Deduct mana
    attacker.mana -= skill.manaCost;
    attacker.skillsUsed++;
    
    let result = {
      type: 'skill',
      skillId,
      attacker: attacker.id,
      defender: defender.id,
      effects: []
    };
    
    switch (skill.type) {
      case 'damage':
        const damage = Math.floor(attacker.attack * skill.multiplier);
        defender.health = Math.max(0, defender.health - damage);
        defender.damageTaken += damage;
        attacker.damageDealt += damage;
        
        result.damage = damage;
        result.newHealth = defender.health;
        result.effects.push('damage');
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} on ${defender.username} for ${damage} damage`,
          'skill'
        );
        break;
        
      case 'heal':
        const healing = Math.floor(attacker.maxHealth * skill.healing);
        const oldHealth = attacker.health;
        attacker.health = Math.min(attacker.maxHealth, attacker.health + healing);
        
        result.healing = healing;
        result.newHealth = attacker.health;
        result.actualHealing = attacker.health - oldHealth;
        result.effects.push('heal');
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} and heals ${result.actualHealing} HP`,
          'heal'
        );
        break;
        
      case 'buff':
        attacker.buffs.push({
          type: skill.buffType,
          value: skill.buffValue,
          duration: skill.duration,
          source: skill.name
        });
        
        result.buff = skill.buffType;
        result.effects.push('buff');
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} and gains ${skill.buffType}`,
          'buff'
        );
        break;
        
      case 'debuff':
        defender.debuffs.push({
          type: skill.debuffType,
          value: skill.debuffValue,
          duration: skill.duration,
          source: skill.name
        });
        
        result.debuff = skill.debuffType;
        result.effects.push('debuff');
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} on ${defender.username}`,
          'debuff'
        );
        break;
        
      case 'control':
        if (skill.effect === 'stun') {
          defender.stunned = true;
          result.effects.push('stun');
        } else if (skill.effect === 'freeze') {
          defender.frozen = true;
          result.effects.push('freeze');
        }
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} on ${defender.username}`,
          'control'
        );
        break;
        
      case 'dot':
        if (skill.effect === 'poison') {
          defender.poisoned = true;
          defender.poisonDamage = skill.damage;
          result.effects.push('poison');
        } else if (skill.effect === 'burn') {
          defender.burning = true;
          defender.burnDamage = skill.damage;
          result.effects.push('burn');
        }
        
        this.addToBattleLog(
          `${attacker.username} uses ${skill.name} on ${defender.username}`,
          'dot'
        );
        break;
    }
    
    return result;
  }
  
  executeDefend(player) {
    player.defending = true;
    
    this.addToBattleLog(`${player.username} takes a defensive stance`, 'defend');
    
    return {
      type: 'defend',
      player: player.id,
      defense: player.defense * 1.5,
      effects: ['defending']
    };
  }
  
  executeItem(player, itemId) {
    const item = this.getItem(itemId);
    
    if (!item) {
      return { error: 'Item not found' };
    }
    
    // Check if player has item
    if (!player.inventory || !player.inventory.includes(itemId)) {
      return { error: 'Item not in inventory' };
    }
    
    // Remove item from inventory
    player.inventory = player.inventory.filter(id => id !== itemId);
    
    let result = {
      type: 'item',
      itemId,
      player: player.id,
      effects: []
    };
    
    switch (item.type) {
      case 'potion':
        const oldHealth = player.health;
        player.health = Math.min(player.maxHealth, player.health + item.healing);
        result.healing = player.health - oldHealth;
        result.newHealth = player.health;
        result.effects.push('heal');
        
        this.addToBattleLog(
          `${player.username} uses ${item.name} and heals ${result.healing} HP`,
          'item'
        );
        break;
        
      case 'elixir':
        const oldMana = player.mana;
        player.mana = Math.min(player.maxMana, player.mana + item.manaRestore);
        result.manaRestore = player.mana - oldMana;
        result.newMana = player.mana;
        result.effects.push('mana');
        
        this.addToBattleLog(
          `${player.username} uses ${item.name} and restores ${result.manaRestore} MP`,
          'item'
        );
        break;
        
      case 'bomb':
        const damage = item.damage;
        const opponent = this.getOpponent();
        opponent.health = Math.max(0, opponent.health - damage);
        opponent.damageTaken += damage;
        player.damageDealt += damage;
        
        result.damage = damage;
        result.newHealth = opponent.health;
        result.target = opponent.id;
        result.effects.push('damage');
        
        this.addToBattleLog(
          `${player.username} throws ${item.name} at ${opponent.username} for ${damage} damage`,
          'item'
        );
        break;
    }
    
    return result;
  }
  
  executeSurrender(player) {
    this.status = 'surrendered';
    this.winner = this.getOpponent().id;
    
    this.addToBattleLog(`${player.username} surrenders!`, 'surrender');
    
    return {
      type: 'surrender',
      player: player.id,
      winner: this.winner
    };
  }
  
  processStatusEffects(player) {
    // Process buffs
    player.buffs = player.buffs.filter(buff => {
      buff.duration--;
      
      if (buff.duration <= 0) {
        this.addToBattleLog(`${player.username}'s ${buff.type} buff wears off`, 'status');
        return false;
      }
      
      return true;
    });
    
    // Process debuffs
    player.debuffs = player.debuffs.filter(debuff => {
      debuff.duration--;
      
      if (debuff.duration <= 0) {
        this.addToBattleLog(`${player.username}'s ${debuff.type} debuff wears off`, 'status');
        return false;
      }
      
      return true;
    });
    
    // Process damage over time
    if (player.poisoned) {
      const damage = player.poisonDamage || 5;
      player.health = Math.max(0, player.health - damage);
      player.damageTaken += damage;
      
      this.addToBattleLog(`${player.username} takes ${damage} poison damage`, 'dot');
    }
    
    if (player.burning) {
      const damage = player.burnDamage || 3;
      player.health = Math.max(0, player.health - damage);
      player.damageTaken += damage;
      
      this.addToBattleLog(`${player.username} takes ${damage} burn damage`, 'dot');
    }
    
    // Regenerate mana
    player.mana = Math.min(player.maxMana, player.mana + 2);
  }
  
  checkBattleEnd() {
    const player1 = this.players[0];
    const player2 = this.players[1];
    
    if (player1.health <= 0 || player2.health <= 0) {
      this.status = 'completed';
      this.winner = player1.health > 0 ? player1.id : player2.id;
      return true;
    }
    
    return false;
  }
  
  switchTurn() {
    // Regenerate some mana
    this.getCurrentPlayer().mana = Math.min(
      this.getCurrentPlayer().maxMana,
      this.getCurrentPlayer().mana + 5
    );
    
    // Switch active player
    this.activePlayer = this.activePlayer === 0 ? 1 : 0;
    this.turnCount++;
    
    return {
      type: 'turn_switch',
      nextPlayer: this.players[this.activePlayer].id,
      turnCount: this.turnCount
    };
  }
  
  endBattle() {
    const winner = this.players.find(p => p.id === this.winner);
    const loser = this.players.find(p => p.id !== this.winner);
    
    // Calculate battle quality
    this.calculateBattleQuality(winner, loser);
    
    // Calculate rewards
    const rewards = this.calculateRewards(winner, loser);
    
    // Award experience
    winner.experience = rewards.winner.experience;
    loser.experience = rewards.loser.experience;
    
    this.addToBattleLog(`Battle ended! ${winner.username} is victorious!`, 'victory');
    
    return {
      type: 'battle_end',
      winner: this.winner,
      loser: loser.id,
      battleQuality: this.battleQuality,
      rewards,
      duration: Date.now() - this.startTime,
      turnCount: this.turnCount,
      battleStats: this.getBattleStats()
    };
  }
  
  calculateBattleQuality(winner, loser) {
    const winnerHealthPercent = winner.health / winner.maxHealth;
    const turnCount = this.turnCount;
    
    if (winnerHealthPercent > 0.8 && turnCount < 5) {
      this.battleQuality = 'domination';
    } else if (winnerHealthPercent > 0.6 && turnCount < 8) {
      this.battleQuality = 'victory';
    } else if (winnerHealthPercent > 0.3) {
      this.battleQuality = 'win';
    } else {
      this.battleQuality = 'struggle';
    }
  }
  
  calculateRewards(winner, loser) {
    const baseReward = 100; // Base wager
    const qualityMultipliers = {
      domination: 2.0,
      victory: 1.5,
      win: 1.2,
      struggle: 1.0
    };
    
    const multiplier = qualityMultipliers[this.battleQuality] || 1.0;
    
    return {
      winner: {
        stg: Math.round(baseReward * multiplier),
        experience: Math.round(50 * multiplier),
        battleQuality: this.battleQuality
      },
      loser: {
        stg: 0,
        experience: Math.round(10 * multiplier),
        battleQuality: this.battleQuality
      }
    };
  }
  
  getBattleStats() {
    return this.players.map(player => ({
      id: player.id,
      username: player.username,
      damageDealt: player.damageDealt,
      damageTaken: player.damageTaken,
      criticalHits: player.criticalHits,
      skillsUsed: player.skillsUsed,
      finalHealth: player.health,
      maxHealth: player.maxHealth
    }));
  }
  
  addToBattleLog(message, type = 'info') {
    const logEntry = {
      message,
      type,
      timestamp: new Date().toISOString(),
      turn: this.turnCount
    };
    
    this.battleLog.push(logEntry);
    
    // Keep log size manageable
    if (this.battleLog.length > 100) {
      this.battleLog = this.battleLog.slice(-50);
    }
  }
  
  getBattleState() {
    return {
      id: this.battleId,
      players: this.players.map(player => ({
        id: player.id,
        username: player.username,
        faction: player.faction,
        health: player.health,
        maxHealth: player.maxHealth,
        mana: player.mana,
        maxMana: player.maxMana,
        attack: player.attack,
        defense: player.defense,
        speed: player.speed,
        critical: player.critical,
        statusEffects: player.statusEffects,
        buffs: player.buffs,
        debuffs: player.debuffs,
        defending: player.defending,
        stunned: player.stunned,
        poisoned: player.poisoned,
        burning: player.burning
      })),
      currentTurn: this.activePlayer,
      turnCount: this.turnCount,
      status: this.status,
      winner: this.winner,
      battleQuality: this.battleQuality,
      battleLog: this.battleLog,
      territory: this.territory,
      startTime: this.startTime
    };
  }
  
  // Helper methods to get game data
  getSkill(skillId) {
    const skills = {
      power_strike: {
        id: 'power_strike',
        name: 'Power Strike',
        type: 'damage',
        manaCost: 20,
        multiplier: 1.5,
        description: 'A powerful attack that deals 150% damage'
      },
      heal: {
        id: 'heal',
        name: 'Heal',
        type: 'heal',
        manaCost: 15,
        healing: 0.3,
        description: 'Restore 30% of max health'
      },
      defend: {
        id: 'defend',
        name: 'Defend',
        type: 'buff',
        manaCost: 10,
        buffType: 'defense',
        buffValue: 1.5,
        duration: 2,
        description: 'Increase defense by 50% for 2 turns'
      },
      stun: {
        id: 'stun',
        name: 'Stun',
        type: 'control',
        manaCost: 25,
        effect: 'stun',
        description: 'Stun opponent for 1 turn'
      },
      poison: {
        id: 'poison',
        name: 'Poison',
        type: 'dot',
        manaCost: 15,
        effect: 'poison',
        damage: 5,
        description: 'Poison opponent for 5 damage per turn'
      },
      burn: {
        id: 'burn',
        name: 'Burn',
        type: 'dot',
        manaCost: 15,
        effect: 'burn',
        damage: 3,
        description: 'Burn opponent for 3 damage per turn'
      }
    };
    
    return skills[skillId];
  }
  
  getItem(itemId) {
    const items = {
      health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'potion',
        healing: 50,
        description: 'Restore 50 HP'
      },
      mana_elixir: {
        id: 'mana_elixir',
        name: 'Mana Elixir',
        type: 'elixir',
        manaRestore: 30,
        description: 'Restore 30 MP'
      },
      smoke_bomb: {
        id: 'smoke_bomb',
        name: 'Smoke Bomb',
        type: 'bomb',
        damage: 20,
        description: 'Deal 20 damage to opponent'
      }
    };
    
    return items[itemId];
  }
}

module.exports = BattleEngine;
