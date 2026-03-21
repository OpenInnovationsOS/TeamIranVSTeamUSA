/**
 * Real-time WebSocket Battle System
 * Handles live battles, matchmaking, and real-time updates
 */

import { WS_URL } from '../config/api';

class WebSocketBattleSystem {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.battleCallbacks = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
  }

  // Connect to WebSocket server
  connect(userId) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${WS_URL}?userId=${userId}`);
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('🚨 WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.handleReconnect();
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Handle incoming messages
  handleMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'battle_match_found':
        this.triggerCallback('battle_match_found', payload);
        break;
      case 'battle_update':
        this.triggerCallback('battle_update', payload);
        break;
      case 'battle_action':
        this.triggerCallback('battle_action', payload);
        break;
      case 'battle_end':
        this.triggerCallback('battle_end', payload);
        break;
      case 'leaderboard_update':
        this.triggerCallback('leaderboard_update', payload);
        break;
      case 'tournament_update':
        this.triggerCallback('tournament_update', payload);
        break;
      case 'heartbeat':
        // Respond to server heartbeat
        this.send({ type: 'heartbeat_response' });
        break;
      default:
        console.log('📨 Unknown message type:', type);
    }
  }

  // Send message to server
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // Register callback for event type
  on(eventType, callback) {
    if (!this.battleCallbacks.has(eventType)) {
      this.battleCallbacks.set(eventType, []);
    }
    this.battleCallbacks.get(eventType).push(callback);
  }

  // Remove callback for event type
  off(eventType, callback) {
    if (this.battleCallbacks.has(eventType)) {
      const callbacks = this.battleCallbacks.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Trigger callbacks for event type
  triggerCallback(eventType, payload) {
    if (this.battleCallbacks.has(eventType)) {
      this.battleCallbacks.get(eventType).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('🚨 Callback error:', error);
        }
      });
    }
  }

  // Battle system methods
  findOpponent(user, preferences = {}) {
    return this.send({
      type: 'find_opponent',
      payload: {
        user,
        preferences: {
          minLevel: preferences.minLevel || 1,
          maxLevel: preferences.maxLevel || 100,
          faction: preferences.faction || 'any',
          gameMode: preferences.gameMode || 'classic'
        }
      }
    });
  }

  joinBattle(battleId) {
    return this.send({
      type: 'join_battle',
      payload: { battleId }
    });
  }

  leaveBattle(battleId) {
    return this.send({
      type: 'leave_battle',
      payload: { battleId }
    });
  }

  sendBattleAction(battleId, action) {
    return this.send({
      type: 'battle_action',
      payload: {
        battleId,
        action: {
          ...action,
          timestamp: Date.now()
        }
      }
    });
  }

  // Tournament methods
  registerTournament(tournamentId, userId) {
    return this.send({
      type: 'tournament_register',
      payload: { tournamentId, userId }
    });
  }

  // Leaderboard methods
  subscribeToLeaderboard(category = 'global') {
    return this.send({
      type: 'subscribe_leaderboard',
      payload: { category }
    });
  }

  // Reconnection handling
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        const userId = localStorage.getItem('user_id') || 'player123';
        this.connect(userId).catch(error => {
          console.error('🚨 Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('🚨 Max reconnection attempts reached');
    }
  }

  // Heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, 30000); // 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Disconnect WebSocket
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Get connection status
  getReadyState() {
    if (!this.ws) return WebSocket.CLOSED;
    return this.ws.readyState;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsBattleSystem = new WebSocketBattleSystem();

export default wsBattleSystem;
