// WebSocket Battle Integration
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class BattleWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.battles = new Map(); // battleId -> battle data
    this.connections = new Map(); // userId -> websocket connection
    this.waitingPlayers = new Map(); // userId -> matchmaking data
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    console.log('🔗 Battle WebSocket Server initialized');
  }
  
  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const battleId = url.searchParams.get('battleId');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      ws.userId = userId;
      ws.battleId = battleId;
      
      this.connections.set(userId, ws);
      
      console.log(`👤 User ${userId} connected to battle ${battleId}`);
      
      ws.on('message', (data) => {
        this.handleMessage(userId, battleId, JSON.parse(data));
      });
      
      ws.on('close', () => {
        this.handleDisconnection(userId, battleId);
      });
      
      // Send initial battle state if battle exists
      if (battleId && this.battles.has(battleId)) {
        ws.send(JSON.stringify({
          type: 'battle_state',
          data: this.battles.get(battleId)
        }));
      }
      
    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }
  
  handleMessage(userId, battleId, message) {
    switch (message.type) {
      case 'battle_action':
        this.handleBattleAction(userId, battleId, message.data);
        break;
        
      case 'join_queue':
        this.handleJoinQueue(userId, message.data);
        break;
        
      case 'leave_queue':
        this.handleLeaveQueue(userId);
        break;
        
      case 'spectate':
        this.handleSpectate(userId, message.data.battleId);
        break;
        
      default:
        console.log(`📨 Unknown message type: ${message.type}`);
    }
  }
  
  handleBattleAction(userId, battleId, actionData) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      console.error(`❌ Battle ${battleId} not found`);
      return;
    }
    
    // Validate it's the player's turn
    if (battle.currentTurn !== userId) {
      this.sendToUser(userId, {
        type: 'error',
        message: 'Not your turn'
      });
      return;
    }
    
    // Execute action
    const result = this.executeBattleAction(battle, actionData);
    
    // Update battle state
    this.battles.set(battleId, battle);
    
    // Broadcast to all battle participants
    this.broadcastToBattle(battleId, {
      type: 'battle_update',
      data: {
        action: actionData,
        result,
        battleState: battle
      }
    });
    
    // Check for battle end
    if (battle.isOver) {
      this.endBattle(battleId);
    }
  }
  
  executeBattleAction(battle, action) {
    const attacker = battle.players.find(p => p.id === battle.currentTurn);
    const defender = battle.players.find(p => p.id !== battle.currentTurn);
    
    let result = {};
    
    switch (action.type) {
      case 'attack':
        result = this.executeAttack(attacker, defender, action.weaponId);
        break;
        
      case 'skill':
        result = this.executeSkill(attacker, defender, action.skillId);
        break;
        
      case 'defend':
        result = this.executeDefend(attacker);
        break;
        
      case 'item':
        result = this.executeItem(attacker, action.itemId);
        break;
        
      default:
        result = { error: 'Unknown action type' };
    }
    
    // Switch turns
    battle.currentTurn = defender.id;
    battle.turnCount++;
    
    return result;
  }
  
  executeAttack(attacker, defender, weaponId) {
    const weapon = this.getWeapon(weaponId);
    const baseDamage = attacker.attack + weapon.power;
    const defense = defender.defense;
    const damageReduction = defense / (defense + 100);
    const damage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
    
    const criticalChance = attacker.critical + weapon.critical;
    const isCritical = Math.random() < criticalChance;
    const finalDamage = Math.floor(damage * (isCritical ? 2 : 1));
    
    defender.health = Math.max(0, defender.health - finalDamage);
    
    return {
      type: 'damage',
      damage: finalDamage,
      isCritical,
      attackerId: attacker.id,
      defenderId: defender.id,
      weaponId,
      newHealth: defender.health
    };
  }
  
  executeSkill(attacker, defender, skillId) {
    const skill = this.getSkill(skillId);
    
    if (attacker.mana < skill.manaCost) {
      return { error: 'Insufficient mana' };
    }
    
    attacker.mana -= skill.manaCost;
    
    let result = {
      type: 'skill',
      skillId,
      attackerId: attacker.id,
      defenderId: defender.id
    };
    
    switch (skill.type) {
      case 'damage':
        const damage = Math.floor(attacker.attack * skill.multiplier);
        defender.health = Math.max(0, defender.health - damage);
        result.damage = damage;
        result.newHealth = defender.health;
        break;
        
      case 'heal':
        const healing = Math.floor(attacker.maxHealth * skill.healing);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + healing);
        result.healing = healing;
        result.newHealth = attacker.health;
        result.targetId = attacker.id;
        break;
        
      case 'buff':
        attacker.buffs = attacker.buffs || [];
        attacker.buffs.push({
          type: skill.buffType,
          value: skill.buffValue,
          duration: skill.duration
        });
        result.buff = skill.buffType;
        result.targetId = attacker.id;
        break;
        
      case 'debuff':
        defender.debuffs = defender.debuffs || [];
        defender.debuffs.push({
          type: skill.debuffType,
          value: skill.debuffValue,
          duration: skill.duration
        });
        result.debuff = skill.debuffType;
        result.targetId = defender.id;
        break;
    }
    
    return result;
  }
  
  executeDefend(attacker) {
    attacker.defending = true;
    attacker.defense *= 1.5;
    
    return {
      type: 'defend',
      attackerId: attacker.id,
      defense: attacker.defense
    };
  }
  
  executeItem(attacker, itemId) {
    const item = this.getItem(itemId);
    
    if (!attacker.inventory || !attacker.inventory.includes(itemId)) {
      return { error: 'Item not found in inventory' };
    }
    
    // Remove item from inventory
    attacker.inventory = attacker.inventory.filter(id => id !== itemId);
    
    let result = {
      type: 'item',
      itemId,
      attackerId: attacker.id
    };
    
    switch (item.type) {
      case 'potion':
        const healing = item.healing;
        attacker.health = Math.min(attacker.maxHealth, attacker.health + healing);
        result.healing = healing;
        result.newHealth = attacker.health;
        break;
        
      case 'elixir':
        const manaRestore = item.manaRestore;
        attacker.mana = Math.min(attacker.maxMana, attacker.mana + manaRestore);
        result.manaRestore = manaRestore;
        result.newMana = attacker.mana;
        break;
        
      case 'bomb':
        const damage = item.damage;
        // Apply to all opponents (for team battles)
        result.damage = damage;
        result.targets = 'all_opponents';
        break;
    }
    
    return result;
  }
  
  handleJoinQueue(userId, data) {
    const { gameMode, wager, weaponId, territoryId } = data;
    
    this.waitingPlayers.set(userId, {
      userId,
      gameMode,
      wager,
      weaponId,
      territoryId,
      joinedAt: Date.now()
    });
    
    console.log(`👤 User ${userId} joined ${gameMode} queue`);
    
    // Try to match players
    this.tryMatchmaking();
  }
  
  handleLeaveQueue(userId) {
    this.waitingPlayers.delete(userId);
    console.log(`👤 User ${userId} left queue`);
  }
  
  handleSpectate(userId, battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      this.sendToUser(userId, {
        type: 'error',
        message: 'Battle not found'
      });
      return;
    }
    
    // Add to spectators
    battle.spectators = battle.spectators || [];
    battle.spectators.push(userId);
    
    this.sendToUser(userId, {
      type: 'spectating',
      battleId,
      battleState: battle
    });
    
    console.log(`👁️ User ${userId} started spectating battle ${battleId}`);
  }
  
  tryMatchmaking() {
    const queue = Array.from(this.waitingPlayers.values());
    
    // Simple matchmaking: match first two players with similar criteria
    for (let i = 0; i < queue.length - 1; i++) {
      for (let j = i + 1; j < queue.length; j++) {
        const player1 = queue[i];
        const player2 = queue[j];
        
        if (this.isMatch(player1, player2)) {
          this.createBattle(player1, player2);
          this.waitingPlayers.delete(player1.userId);
          this.waitingPlayers.delete(player2.userId);
          return;
        }
      }
    }
  }
  
  isMatch(player1, player2) {
    // Basic matching criteria
    return (
      player1.gameMode === player2.gameMode &&
      Math.abs(player1.wager - player2.wager) <= player1.wager * 0.2 // Within 20% wager difference
    );
  }
  
  async createBattle(player1Data, player2Data) {
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get player data from database
    const player1 = await this.getPlayerData(player1Data.userId);
    const player2 = await this.getPlayerData(player2Data.userId);
    
    // Initialize battle state
    const battle = {
      id: battleId,
      gameMode: player1Data.gameMode,
      wager: player1Data.wager,
      territoryId: player1Data.territoryId,
      players: [
        { ...player1, weaponId: player1Data.weaponId, currentHealth: player1.health, currentMana: player1.mana },
        { ...player2, weaponId: player2Data.weaponId, currentHealth: player2.health, currentMana: player2.mana }
      ],
      currentTurn: player1.speed >= player2.speed ? player1.id : player2.id,
      turnCount: 0,
      status: 'active',
      startedAt: Date.now(),
      spectators: []
    };
    
    this.battles.set(battleId, battle);
    
    // Notify both players
    this.sendToUser(player1.id, {
      type: 'battle_found',
      battleId,
      opponent: {
        id: player2.id,
        username: player2.username,
        faction: player2.faction,
        level: player2.level
      }
    });
    
    this.sendToUser(player2.id, {
      type: 'battle_found',
      battleId,
      opponent: {
        id: player1.id,
        username: player1.username,
        faction: player1.faction,
        level: player1.level
      }
    });
    
    console.log(`⚔️ Battle ${battleId} created: ${player1.username} vs ${player2.username}`);
  }
  
  endBattle(battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) return;
    
    const winner = battle.players.find(p => p.currentHealth > 0);
    const loser = battle.players.find(p => p.currentHealth <= 0);
    
    battle.status = 'finished';
    battle.endedAt = Date.now();
    battle.winner = winner.id;
    
    // Calculate rewards
    const rewards = this.calculateRewards(battle, winner, loser);
    
    // Update player stats
    await this.updatePlayerStats(winner.id, loser.id, rewards);
    
    // Notify all participants
    this.broadcastToBattle(battleId, {
      type: 'battle_ended',
      data: {
        winner: winner.id,
        loser: loser.id,
        rewards,
        battleStats: {
          duration: battle.endedAt - battle.startedAt,
          turnCount: battle.turnCount
        }
      }
    });
    
    // Remove battle after delay
    setTimeout(() => {
      this.battles.delete(battleId);
    }, 30000); // Keep for 30 seconds for post-battle viewing
    
    console.log(`🏆 Battle ${battleId} ended. Winner: ${winner.username}`);
  }
  
  calculateRewards(battle, winner, loser) {
    const baseReward = battle.wager * 2;
    const experience = Math.round(battle.wager * 0.5);
    
    // Quality multipliers
    const qualityMultiplier = this.getBattleQualityMultiplier(battle);
    
    return {
      winner: {
        stg: Math.round(baseReward * qualityMultiplier),
        experience: Math.round(experience * qualityMultiplier),
        battleQuality: this.getBattleQuality(battle)
      },
      loser: {
        stg: 0,
        experience: Math.round(experience * 0.1), // 10% XP for losing
        battleQuality: this.getBattleQuality(battle)
      }
    };
  }
  
  getBattleQualityMultiplier(battle) {
    const winner = battle.players.find(p => p.currentHealth > 0);
    const healthPercent = winner.currentHealth / winner.health;
    
    if (healthPercent > 0.8 && battle.turnCount < 5) return 2.0; // Domination
    if (healthPercent > 0.6 && battle.turnCount < 8) return 1.5; // Victory
    if (healthPercent > 0.3) return 1.2; // Win
    return 1.0; // Struggle
  }
  
  getBattleQuality(battle) {
    const winner = battle.players.find(p => p.currentHealth > 0);
    const healthPercent = winner.currentHealth / winner.health;
    
    if (healthPercent > 0.8 && battle.turnCount < 5) return 'domination';
    if (healthPercent > 0.6 && battle.turnCount < 8) return 'victory';
    if (healthPercent > 0.3) return 'win';
    return 'struggle';
  }
  
  async updatePlayerStats(winnerId, loserId, rewards) {
    // Update database with battle results
    // This would integrate with your existing database
    console.log(`📊 Updating stats - Winner: ${winnerId}, Loser: ${loserId}`);
  }
  
  handleDisconnection(userId, battleId) {
    this.connections.delete(userId);
    
    // Handle battle disconnection
    if (battleId && this.battles.has(battleId)) {
      const battle = this.battles.get(battleId);
      
      // Remove from spectators
      if (battle.spectators) {
        battle.spectators = battle.spectators.filter(id => id !== userId);
      }
      
      // Handle player disconnection (count as loss)
      const player = battle.players.find(p => p.id === userId);
      if (player && battle.status === 'active') {
        player.currentHealth = 0; // Count as loss
        this.endBattle(battleId);
      }
    }
    
    // Remove from queue
    this.waitingPlayers.delete(userId);
    
    console.log(`👋 User ${userId} disconnected`);
  }
  
  sendToUser(userId, message) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  broadcastToBattle(battleId, message) {
    const battle = this.battles.get(battleId);
    if (!battle) return;
    
    // Send to all players
    battle.players.forEach(player => {
      this.sendToUser(player.id, message);
    });
    
    // Send to all spectators
    if (battle.spectators) {
      battle.spectators.forEach(spectatorId => {
        this.sendToUser(spectatorId, message);
      });
    }
  }
  
  // Helper methods (would integrate with your existing game data)
  getWeapon(weaponId) {
    // Return weapon data from your database
    return { id: weaponId, power: 10, defense: 5, critical: 0.05 };
  }
  
  getSkill(skillId) {
    // Return skill data from your database
    return { id: skillId, manaCost: 20, type: 'damage', multiplier: 1.5 };
  }
  
  getItem(itemId) {
    // Return item data from your database
    return { id: itemId, type: 'potion', healing: 50 };
  }
  
  async getPlayerData(userId) {
    // Return player data from your database
    return {
      id: userId,
      username: `Player${userId}`,
      faction: 'iran',
      level: 1,
      health: 100,
      mana: 50,
      attack: 10,
      defense: 5,
      speed: 10,
      critical: 0.05,
      inventory: []
    };
  }
  
  getBattleStats() {
    return {
      activeBattles: this.battles.size,
      queuedPlayers: this.waitingPlayers.size,
      connectedUsers: this.connections.size
    };
  }
}

module.exports = BattleWebSocketServer;
