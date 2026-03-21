/**
 * React Hook for WebSocket Battle System
 * Provides real-time battle functionality to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import wsBattleSystem from '../utils/websocketBattleSystem';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export const useWebSocketBattle = () => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [battleQueue, setBattleQueue] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [realtimeLeaderboard, setRealtimeLeaderboard] = useState([]);
  const [tournamentUpdates, setTournamentUpdates] = useState([]);
  const connectionAttempted = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!user || connectionAttempted.current) return;
    
    connectionAttempted.current = true;
    
    try {
      await wsBattleSystem.connect(user.id);
      setIsConnected(true);
      toast.success('🔌 Connected to battle server');
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnected(false);
      toast.error('❌ Failed to connect to battle server');
    }
  }, [user]);

  // Find opponent for battle
  const findOpponent = useCallback((preferences = {}) => {
    if (!isConnected) {
      toast.error('❌ Not connected to battle server');
      return false;
    }

    setBattleQueue({ status: 'searching', preferences });
    return wsBattleSystem.findOpponent(user, preferences);
  }, [isConnected, user]);

  // Join specific battle
  const joinBattle = useCallback((battleId) => {
    if (!isConnected) {
      toast.error('❌ Not connected to battle server');
      return false;
    }

    return wsBattleSystem.joinBattle(battleId);
  }, [isConnected]);

  // Leave battle
  const leaveBattle = useCallback((battleId) => {
    if (!isConnected) return false;

    const result = wsBattleSystem.leaveBattle(battleId);
    if (result) {
      setCurrentBattle(null);
      setOpponent(null);
      toast.success('👋 Left battle');
    }
    return result;
  }, [isConnected]);

  // Send battle action
  const sendBattleAction = useCallback((action) => {
    if (!isConnected || !currentBattle) {
      toast.error('❌ Not in active battle');
      return false;
    }

    return wsBattleSystem.sendBattleAction(currentBattle.id, action);
  }, [isConnected, currentBattle]);

  // Register for tournament
  const registerTournament = useCallback((tournamentId) => {
    if (!isConnected) {
      toast.error('❌ Not connected to battle server');
      return false;
    }

    return wsBattleSystem.registerTournament(tournamentId, user.id);
  }, [isConnected, user]);

  // Subscribe to leaderboard updates
  const subscribeToLeaderboard = useCallback((category = 'global') => {
    if (!isConnected) return false;

    return wsBattleSystem.subscribeToLeaderboard(category);
  }, [isConnected]);

  // Setup event listeners
  useEffect(() => {
    if (!user) return;

    // Battle events
    wsBattleSystem.on('battle_match_found', (payload) => {
      setBattleQueue(null);
      setOpponent(payload.opponent);
      setCurrentBattle(payload.battle);
      toast.success('⚔️ Opponent found!');
    });

    wsBattleSystem.on('battle_update', (payload) => {
      setCurrentBattle(prev => prev ? { ...prev, ...payload.battle } : null);
    });

    wsBattleSystem.on('battle_action', (payload) => {
      // Handle battle actions (damage, defense, etc.)
      setCurrentBattle(prev => {
        if (!prev) return null;
        
        const updatedBattle = { ...prev };
        // Update battle state based on action
        if (payload.action.type === 'damage') {
          // Update health, etc.
        }
        
        return updatedBattle;
      });
    });

    wsBattleSystem.on('battle_end', (payload) => {
      const { battle, winner, rewards } = payload;
      
      setBattleHistory(prev => [battle, ...prev.slice(0, 9)]); // Keep last 10 battles
      setCurrentBattle(null);
      setOpponent(null);
      
      // Show result
      if (winner === user.id) {
        toast.success(`🏆 Victory! +${rewards.stg} STG`);
      } else {
        toast.error(`💀 Defeat! +${rewards.stg} STG`);
      }
    });

    // Leaderboard events
    wsBattleSystem.on('leaderboard_update', (payload) => {
      setRealtimeLeaderboard(payload.leaderboard);
    });

    // Tournament events
    wsBattleSystem.on('tournament_update', (payload) => {
      setTournamentUpdates(prev => [payload, ...prev.slice(0, 4)]); // Keep last 5 updates
    });

    // Connection events
    wsBattleSystem.on('connection_status', (payload) => {
      setIsConnected(payload.connected);
    });

    return () => {
      // Cleanup listeners
      wsBattleSystem.off('battle_match_found');
      wsBattleSystem.off('battle_update');
      wsBattleSystem.off('battle_action');
      wsBattleSystem.off('battle_end');
      wsBattleSystem.off('leaderboard_update');
      wsBattleSystem.off('tournament_update');
      wsBattleSystem.off('connection_status');
    };
  }, [user]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !connectionAttempted.current) {
      connect();
    }
  }, [user, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsBattleSystem.disconnect();
    };
  }, []);

  // Battle action helpers
  const battleActions = {
    attack: (targetId) => sendBattleAction({ type: 'attack', targetId }),
    defend: () => sendBattleAction({ type: 'defend' }),
    special: (abilityId) => sendBattleAction({ type: 'special', abilityId }),
    skip: () => sendBattleAction({ type: 'skip' })
  };

  return {
    // Connection status
    isConnected,
    connect,
    
    // Battle state
    currentBattle,
    opponent,
    battleQueue,
    battleHistory,
    
    // Battle actions
    findOpponent,
    joinBattle,
    leaveBattle,
    sendBattleAction,
    battleActions,
    
    // Tournament actions
    registerTournament,
    tournamentUpdates,
    
    // Leaderboard
    realtimeLeaderboard,
    subscribeToLeaderboard,
    
    // Raw WebSocket system access
    wsSystem: wsBattleSystem
  };
};
