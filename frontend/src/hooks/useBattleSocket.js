// React Hook for Battle WebSocket Integration
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const useBattleSocket = (battleId, onBattleUpdate, onBattleEnd) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const connect = useCallback(() => {
    if (!user || !battleId) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `ws://localhost:3000/battle?token=${token}&battleId=${battleId}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔗 Battle WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Request initial battle state
        ws.send(JSON.stringify({
          type: 'get_state',
          battleId
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 Battle WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        setSocket(null);
        
        // Attempt reconnection if not intentional
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          setTimeout(connect, 2000 * reconnectAttempts.current);
        }
      };
      
      ws.onerror = (event) => {
        console.error('❌ Battle WebSocket error:', event);
        setError('WebSocket connection error');
        setConnected(false);
      };
      
      setSocket(ws);
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setError('Failed to connect to battle server');
    }
  }, [user, battleId]);
  
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'battle_state':
        if (onBattleUpdate) {
          onBattleUpdate(data.data);
        }
        break;
        
      case 'battle_update':
        if (onBattleUpdate) {
          onBattleUpdate(data.data.battleState);
        }
        break;
        
      case 'battle_ended':
        if (onBattleEnd) {
          onBattleEnd(data.data);
        }
        break;
        
      case 'error':
        console.error('❌ Battle error:', data.message);
        setError(data.message);
        break;
        
      case 'spectating':
        console.log('👁️ Started spectating battle');
        break;
        
      default:
        console.log('📨 Unknown battle message:', data.type);
    }
  }, [onBattleUpdate, onBattleEnd]);
  
  const sendAction = useCallback((action) => {
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'battle_action',
        data: action
      }));
    } else {
      console.warn('⚠️ Cannot send action - WebSocket not connected');
    }
  }, [socket, connected]);
  
  const surrender = useCallback(() => {
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'surrender'
      }));
    }
  }, [socket, connected]);
  
  const spectate = useCallback((targetBattleId) => {
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'spectate',
        data: { battleId: targetBattleId }
      }));
    }
  }, [socket, connected]);
  
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'User disconnected');
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);
  
  // Auto-connect on mount
  useEffect(() => {
    if (battleId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [battleId, connect, disconnect]);
  
  // Handle connection status changes
  useEffect(() => {
    if (connected) {
      setError(null);
    }
  }, [connected]);
  
  return {
    socket,
    connected,
    error,
    sendAction,
    surrender,
    spectate,
    disconnect,
    reconnect: connect
  };
};

export default useBattleSocket;
