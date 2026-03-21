/**
 * Real-time Battle System
 * Handles battle matchmaking, execution, and real-time updates
 */

import { API_CONFIG } from '../config/api';
import wsManager from './websocketManager';

class BattleSystem {
  constructor() {
    this.activeBattles = new Map();
    this.battleQueue = [];
    this.matchmakingTimeout = null;
    this.battleCallbacks = new Map();
  }

  // Find opponent for battle
  async findOpponent(user, preferences = {}) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/battle/matchmaking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          preferences: {
            minLevel: preferences.minLevel || 1,
            maxLevel: preferences.maxLevel || 100,
            faction: preferences.faction || 'any',
            gameMode: preferences.gameMode || 'classic'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.opponent) {
          return this.createBattle(user, data.opponent);
        } else {
          return this.addToQueue(user);
        }
      } else {
        throw new Error(data.error || 'Matchmaking failed');
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      throw error;
    }
  }

  // Create new battle
  async createBattle(player1, player2) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/battle/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          player1: {
            id: player1.id,
            username: player1.username,
            faction: player1.faction,
            level: player1.level
          },
          player2: {
            id: player2.id,
            username: player2.username,
            faction: player2.faction,
            level: player2.level
          },
          settings: {
            gameMode: 'classic',
            timeLimit: 300, // 5 minutes
            stakeAmount: 100 // STG
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const battle = {
          id: data.battle.id,
          player1,
          player2,
          status: 'active',
          startTime: Date.now(),
          settings: data.battle.settings,
          currentTurn: 1,
          turnTimeLimit: 30, // 30 seconds per turn
          actions: []
        };

        this.activeBattles.set(battle.id, battle);
        this.connectToBattleRoom(battle.id);
        
        return battle;
      } else {
        throw new Error(data.error || 'Battle creation failed');
      }
    } catch (error) {
      console.error('Battle creation error:', error);
      throw error;
    }
  }

  // Add user to matchmaking queue
  addToQueue(user) {
    const queueEntry = {
      userId: user.id,
      username: user.username,
      faction: user.faction,
      level: user.level,
      timestamp: Date.now(),
      preferences: {
        minLevel: 1,
        maxLevel: 100,
        faction: 'any',
        gameMode: 'classic'
      }
    };

    this.battleQueue.push(queueEntry);
    this.startMatchmaking();
    
    return {
      success: true,
      message: 'Added to matchmaking queue',
      queuePosition: this.battleQueue.length
    };
  }

  // Start matchmaking process
  startMatchmaking() {
    if (this.matchmakingTimeout) {
      clearTimeout(this.matchmakingTimeout);
    }

    this.matchmakingTimeout = setTimeout(() => {
      this.processQueue();
    }, 5000); // Check every 5 seconds
  }

  // Process matchmaking queue
  processQueue() {
    if (this.battleQueue.length < 2) {
      return; // Need at least 2 players
    }

    // Find compatible matches
    const matches = this.findMatches();
    
    matches.forEach(match => {
      this.createBattle(match.player1, match.player2);
      
      // Remove from queue
      this.battleQueue = this.battleQueue.filter(
        entry => entry.userId !== match.player1.id && entry.userId !== match.player2.id
      );
    });
  }

  // Find compatible matches in queue
  findMatches() {
    const matches = [];
    const processedUsers = new Set();

    for (let i = 0; i < this.battleQueue.length; i++) {
      const player1 = this.battleQueue[i];
      
      if (processedUsers.has(player1.userId)) continue;
      
      for (let j = i + 1; j < this.battleQueue.length; j++) {
        const player2 = this.battleQueue[j];
        
        if (processedUsers.has(player2.userId)) continue;
        
        // Check compatibility
        if (this.isCompatible(player1, player2)) {
          matches.push({ player1, player2 });
          processedUsers.add(player1.userId);
          processedUsers.add(player2.userId);
          break;
        }
      }
    }

    return matches;
  }

  // Check if two players are compatible for battle
  isCompatible(player1, player2) {
    // Level difference should be within 5 levels
    const levelDiff = Math.abs(player1.level - player2.level);
    if (levelDiff > 5) return false;

    // Same faction battles allowed, but cross-faction encouraged
    if (player1.faction === player2.faction) {
      return Math.random() > 0.3; // 70% chance for same faction
    }

    return true;
  }

  // Connect to battle room for real-time updates
  connectToBattleRoom(battleId) {
    wsManager.send('join_battle', { battleId });
    
    // Listen for battle updates
    wsManager.on('battle_action', (data) => {
      this.handleBattleAction(data);
    });

    wsManager.on('battle_end', (data) => {
      this.handleBattleEnd(data);
    });
  }

  // Handle battle actions (moves, attacks, etc.)
  handleBattleAction(data) {
    const { battleId, playerId, action, timestamp } = data;
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) return;

    // Validate action
    if (!this.isValidAction(battle, playerId, action)) {
      wsManager.send('battle_error', {
        battleId,
        playerId,
        error: 'Invalid action'
      });
      return;
    }

    // Add action to battle history
    battle.actions.push({
      playerId,
      action,
      timestamp,
      turn: battle.currentTurn
    });

    // Process action effects
    this.processAction(battle, playerId, action);

    // Check win conditions
    if (this.checkWinCondition(battle)) {
      this.endBattle(battleId);
    } else {
      // Switch turns
      battle.currentTurn = battle.currentTurn === 1 ? 2 : 1;
      this.notifyTurnChange(battle);
    }
  }

  // Validate battle action
  isValidAction(battle, playerId, action) {
    // Check if it's player's turn
    const currentPlayer = battle.currentTurn === 1 ? battle.player1.id : battle.player2.id;
    if (currentPlayer !== playerId) return false;

    // Check action type
    const validActions = ['attack', 'defend', 'special', 'skip'];
    if (!validActions.includes(action.type)) return false;

    // Check timing (within turn time limit)
    const lastAction = battle.actions.filter(a => a.playerId === playerId).pop();
    if (lastAction && Date.now() - lastAction.timestamp < 1000) return false; // 1 second cooldown

    return true;
  }

  // Process battle action effects
  processAction(battle, playerId, action) {
    const player = playerId === battle.player1.id ? battle.player1 : battle.player2;
    const opponent = playerId === battle.player1.id ? battle.player2 : battle.player1;

    switch (action.type) {
      case 'attack':
        const damage = this.calculateDamage(player, opponent, action);
        opponent.health = Math.max(0, opponent.health - damage);
        
        // Notify clients
        wsManager.send('battle_damage', {
          battleId: battle.id,
          targetId: opponent.id,
          damage,
          newHealth: opponent.health
        });
        break;

      case 'defend':
        player.defending = true;
        player.defenseBonus = 0.2; // 20% damage reduction
        break;

      case 'special':
        this.processSpecialAttack(battle, playerId, action);
        break;

      case 'skip':
        // Player skips turn
        break;
    }

    // Update battle state
    this.notifyBattleUpdate(battle);
  }

  // Calculate damage for attacks
  calculateDamage(attacker, defender, action) {
    const baseDamage = attacker.level * 10 + Math.random() * 20;
    const defense = defender.defending ? defender.level * 5 : 0;
    const specialMultiplier = action.special ? 1.5 : 1;
    
    const totalDamage = Math.max(1, (baseDamage - defense) * specialMultiplier);
    
    return Math.round(totalDamage);
  }

  // Process special attacks
  processSpecialAttack(battle, playerId, action) {
    const player = playerId === battle.player1.id ? battle.player1 : battle.player2;
    
    // Check cooldowns
    if (player.specialCooldown && player.specialCooldown > Date.now()) {
      return; // Still on cooldown
    }

    // Set cooldown (30 seconds)
    player.specialCooldown = Date.now() + 30000;

    // Process special effect based on faction
    switch (player.faction) {
      case 'iran':
        // Persian special: "Desert Storm"
        wsManager.send('battle_effect', {
          battleId: battle.id,
          type: 'desert_storm',
          playerId,
          effect: 'Reduces opponent accuracy by 30%'
        });
        break;

      case 'usa':
        // American special: "Air Strike"
        wsManager.send('battle_effect', {
          battleId: battle.id,
          type: 'air_strike',
          playerId,
          effect: 'Guaranteed critical hit'
        });
        break;
    }
  }

  // Check win conditions
  checkWinCondition(battle) {
    // Health-based win
    if (battle.player1.health <= 0) {
      battle.winner = battle.player2.id;
      battle.winReason = 'knockout';
      return true;
    }
    
    if (battle.player2.health <= 0) {
      battle.winner = battle.player1.id;
      battle.winReason = 'knockout';
      return true;
    }

    // Time limit win
    const battleDuration = Date.now() - battle.startTime;
    if (battleDuration > battle.settings.timeLimit * 1000) {
      // Winner is player with more health
      battle.winner = battle.player1.health > battle.player2.health ? battle.player1.id : battle.player2.id;
      battle.winReason = 'time_out';
      return true;
    }

    return false;
  }

  // End battle
  endBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    battle.status = 'completed';
    battle.endTime = Date.now();
    battle.duration = battle.endTime - battle.startTime;

    // Calculate rewards
    const rewards = this.calculateRewards(battle);
    
    // Notify all clients
    wsManager.send('battle_end', {
      battleId,
      winner: battle.winner,
      reason: battle.winReason,
      duration: battle.duration,
      rewards
    });

    // Update player stats
    this.updatePlayerStats(battle.winner, battle, true);
    this.updatePlayerStats(battle.winner === battle.player1.id ? battle.player2.id : battle.player1.id, battle, false);

    // Remove from active battles
    this.activeBattles.delete(battleId);
  }

  // Calculate battle rewards
  calculateRewards(battle) {
    const baseReward = 100; // STG
    const duration = battle.endTime - battle.startTime;
    const timeBonus = Math.max(0, 300 - duration / 1000) * 2; // Bonus for quick battles
    
    const winner = battle.winner === battle.player1.id ? battle.player1 : battle.player2;
    const levelBonus = winner.level * 10;

    return {
      winner: {
        stg: baseReward + timeBonus + levelBonus,
        experience: winner.level * 50,
        reputation: 10
      },
      loser: {
        stg: Math.floor(baseReward * 0.3), // 30% of winner reward
        experience: winner.level * 10,
        reputation: -5
      }
    };
  }

  // Update player statistics
  async updatePlayerStats(playerId, battle, isWinner) {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/user/stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': playerId
        },
        body: JSON.stringify({
          battleId: battle.id,
          isWinner,
          duration: battle.duration,
          actions: battle.actions.length,
          winReason: battle.winReason
        })
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to update player stats:', data.error);
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  // Notify battle state changes
  notifyBattleUpdate(battle) {
    wsManager.send('battle_update', {
      battleId: battle.id,
      state: {
        currentTurn: battle.currentTurn,
        player1: {
          id: battle.player1.id,
          health: battle.player1.health,
          defending: battle.player1.defending
        },
        player2: {
          id: battle.player2.id,
          health: battle.player2.health,
          defending: battle.player2.defending
        },
        timeRemaining: Math.max(0, battle.settings.timeLimit * 1000 - (Date.now() - battle.startTime))
      }
    });
  }

  // Notify turn change
  notifyTurnChange(battle) {
    const currentPlayer = battle.currentTurn === 1 ? battle.player1.id : battle.player2.id;
    
    wsManager.send('turn_change', {
      battleId: battle.id,
      currentPlayerId: currentPlayer,
      turnNumber: battle.currentTurn,
      timeLimit: battle.turnTimeLimit
    });
  }

  // Get active battles
  getActiveBattles() {
    return Array.from(this.activeBattles.values());
  }

  // Get battle by ID
  getBattle(battleId) {
    return this.activeBattles.get(battleId);
  }

  // Leave battle queue
  leaveQueue(userId) {
    this.battleQueue = this.battleQueue.filter(entry => entry.userId !== userId);
  }
}

// Create singleton instance
const battleSystem = new BattleSystem();

import React from 'react';

// React hook for battle system
export const useBattleSystem = () => {
  const [activeBattles, setActiveBattles] = React.useState([]);
  const [queuePosition, setQueuePosition] = React.useState(null);
  const [currentBattle, setCurrentBattle] = React.useState(null);

  React.useEffect(() => {
    const handleBattleUpdate = (battle) => {
      setActiveBattles(battleSystem.getActiveBattles());
      
      const userBattle = battleSystem.getBattle(battle.id);
      if (userBattle) {
        setCurrentBattle(userBattle);
      }
    };

    wsManager.on('battle_update', handleBattleUpdate);
    wsManager.on('battle_end', handleBattleUpdate);

    return () => {
      wsManager.off('battle_update', handleBattleUpdate);
      wsManager.off('battle_end', handleBattleUpdate);
    };
  }, []);

  const findOpponent = React.useCallback(async (user, preferences) => {
    try {
      const result = await battleSystem.findOpponent(user, preferences);
      if (result.battle) {
        setCurrentBattle(result.battle);
      } else {
        setQueuePosition(result.queuePosition);
      }
      return result;
    } catch (error) {
      console.error('Find opponent error:', error);
      throw error;
    }
  }, []);

  const leaveQueue = React.useCallback((userId) => {
    battleSystem.leaveQueue(userId);
    setQueuePosition(null);
  }, []);

  return {
    activeBattles,
    queuePosition,
    currentBattle,
    findOpponent,
    leaveQueue,
    getBattle: battleSystem.getBattle.bind(battleSystem)
  };
};
