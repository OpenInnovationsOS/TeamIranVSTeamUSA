/**
 * WebSocket Manager
 * Handles real-time updates for battles, leaderboard, and game events
 */

import { WS_URL } from '../config/api';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.url = WS_URL;
  }

  // Connect to WebSocket server
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send authentication
        this.send('auth', {
          token: localStorage.getItem('auth_token'),
          userId: localStorage.getItem('user_id')
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.handleReconnect();
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    const { type, payload } = data;
    
    // Call registered listeners
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    }

    // Handle built-in event types
    switch (type) {
      case 'battle_update':
        this.handleBattleUpdate(payload);
        break;
      case 'leaderboard_update':
        this.handleLeaderboardUpdate(payload);
        break;
      case 'territory_update':
        this.handleTerritoryUpdate(payload);
        break;
      case 'tournament_update':
        this.handleTournamentUpdate(payload);
        break;
      case 'user_update':
        this.handleUserUpdate(payload);
        break;
      case 'system_notification':
        this.handleSystemNotification(payload);
        break;
    }
  }

  // Handle reconnection logic
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    } else {
      console.error('❌ Maximum reconnection attempts reached');
      this.notifyConnectionLost();
    }
  }

  // Send message to server
  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      this.ws.send(message);
      return true;
    }
    return false;
  }

  // Register event listener
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  // Remove event listener
  off(type, callback) {
    if (this.listeners.has(type)) {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Handle specific event types
  handleBattleUpdate(payload) {
    console.log('⚔️ Battle update:', payload);
    
    // Update battle state in real-time
    if (payload.battleId && payload.status) {
      window.dispatchEvent(new CustomEvent('battleUpdate', {
        detail: payload
      }));
    }
  }

  handleLeaderboardUpdate(payload) {
    console.log('🏆 Leaderboard update:', payload);
    
    // Update leaderboard in real-time
    if (payload.rankings) {
      window.dispatchEvent(new CustomEvent('leaderboardUpdate', {
        detail: payload
      }));
    }
  }

  handleTerritoryUpdate(payload) {
    console.log('🗺️ Territory update:', payload);
    
    // Update territory control in real-time
    if (payload.territoryId && payload.controller) {
      window.dispatchEvent(new CustomEvent('territoryUpdate', {
        detail: payload
      }));
    }
  }

  handleTournamentUpdate(payload) {
    console.log('🏅 Tournament update:', payload);
    
    // Update tournament status in real-time
    if (payload.tournamentId) {
      window.dispatchEvent(new CustomEvent('tournamentUpdate', {
        detail: payload
      }));
    }
  }

  handleUserUpdate(payload) {
    console.log('👤 User update:', payload);
    
    // Update user stats in real-time
    if (payload.userId && payload.stats) {
      window.dispatchEvent(new CustomEvent('userUpdate', {
        detail: payload
      }));
    }
  }

  handleSystemNotification(payload) {
    console.log('📢 System notification:', payload);
    
    // Show system notifications
    if (payload.message) {
      // Use toast or notification system
      if (window.toast) {
        window.toast(payload.message, {
          type: payload.type || 'info',
          duration: payload.duration || 5000
        });
      }
    }
  }

  notifyConnectionLost() {
    window.dispatchEvent(new CustomEvent('connectionLost', {
      detail: {
        message: 'Connection to server lost. Please check your internet connection.',
        canReconnect: true
      }
    }));
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Get connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Get connection state
  getConnectionState() {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
const wsManager = new WebSocketManager();

import React from 'react';

// React hook for WebSocket
export const useWebSocket = () => {
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [lastMessage, setLastMessage] = React.useState(null);

  React.useEffect(() => {
    const handleConnectionChange = () => {
      setConnectionState(wsManager.getConnectionState());
    };

    const handleMessage = (message) => {
      setLastMessage(message);
    };

    // Listen for connection changes
    wsManager.on('connection_change', handleConnectionChange);
    wsManager.on('message', handleMessage);

    // Connect on mount
    wsManager.connect();

    return () => {
      wsManager.off('connection_change', handleConnectionChange);
      wsManager.off('message', handleMessage);
      wsManager.disconnect();
    };
  }, []);

  const send = React.useCallback((type, payload) => {
    return wsManager.send(type, payload);
  }, []);

  return {
    connectionState,
    lastMessage,
    send,
    isConnected: wsManager.isConnected(),
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect()
  };
};

export default wsManager;
