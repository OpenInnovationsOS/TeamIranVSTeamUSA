import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/enhancedAuthStore';

// WebSocket Hook for real-time functionality
export const useWebSocket = (url) => {
  const { connect, disconnect, sendMessage, isConnected } = useGameStore();
  const { user } = useAuthStore();
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (url && user) {
      // Build WebSocket URL with user ID
      const wsUrl = `${url}?userId=${user.id}&token=${localStorage.getItem('auth_token')}`;
      connect(wsUrl);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [url, user?.id, connect, disconnect]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!isConnected && user) {
      reconnectTimeoutRef.current = setTimeout(() => {
        const wsUrl = `${url}?userId=${user.id}&token=${localStorage.getItem('auth_token')}`;
        connect(wsUrl);
      }, 5000);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isConnected, user?.id, url, connect]);

  return {
    isConnected,
    sendMessage,
    disconnect
  };
};

// Real-time battle hook
export const useRealTimeBattle = () => {
  const { currentBattle, setCurrentBattle, addToBattleHistory } = useGameStore();
  const { sendMessage } = useWebSocketStore();

  const updateBattle = (battleData) => {
    setCurrentBattle(battleData);
    sendMessage({
      type: 'battle_action',
      data: battleData
    });
  };

  const finishBattle = (result) => {
    if (currentBattle) {
      const finalBattle = {
        ...currentBattle,
        result,
        completed_at: new Date().toISOString()
      };
      
      addToBattleHistory(finalBattle);
      setCurrentBattle(null);
      
      sendMessage({
        type: 'battle_complete',
        data: finalBattle
      });
    }
  };

  return {
    currentBattle,
    updateBattle,
    finishBattle
  };
};

// Real-time territory hook
export const useRealTimeTerritory = () => {
  const { territories, updateTerritoryControl } = useGameStore();
  const { sendMessage } = useWebSocketStore();

  const attackTerritory = (territoryId, attackData) => {
    sendMessage({
      type: 'territory_attack',
      data: {
        territoryId,
        ...attackData
      }
    });
  };

  const defendTerritory = (territoryId, defenseData) => {
    sendMessage({
      type: 'territory_defend',
      data: {
        territoryId,
        ...defenseData
      }
    });
  };

  return {
    territories,
    attackTerritory,
    defendTerritory,
    updateTerritoryControl
  };
};

// Real-time tournament hook
export const useRealTimeTournament = () => {
  const { activeTournaments, updateTournamentBracket } = useGameStore();
  const { sendMessage } = useWebSocketStore();

  const joinTournament = (tournamentId) => {
    sendMessage({
      type: 'tournament_join',
      data: { tournamentId }
    });
  };

  const submitTournamentAction = (tournamentId, action) => {
    sendMessage({
      type: 'tournament_action',
      data: {
        tournamentId,
        action
      }
    });
  };

  return {
    activeTournaments,
    joinTournament,
    submitTournamentAction,
    updateTournamentBracket
  };
};

// Real-time notifications hook
export const useRealTimeNotifications = () => {
  const { notifications, addNotification, clearNotifications } = useGameStore();
  const { sendMessage } = useWebSocketStore();

  const markNotificationAsRead = (notificationId) => {
    sendMessage({
      type: 'notification_read',
      data: { notificationId }
    });
  };

  const sendNotification = (userId, notification) => {
    sendMessage({
      type: 'send_notification',
      data: {
        userId,
        notification
      }
    });
  };

  return {
    notifications,
    addNotification,
    clearNotifications,
    markNotificationAsRead,
    sendNotification
  };
};

// Real-time chat hook (for guilds and global chat)
export const useRealTimeChat = () => {
  const { sendMessage } = useWebSocketStore();
  const [messages, setMessages] = useRef([]);
  const [typingUsers, setTypingUsers] = useRef([]);

  const joinChat = (chatId) => {
    sendMessage({
      type: 'chat_join',
      data: { chatId }
    });
  };

  const leaveChat = (chatId) => {
    sendMessage({
      type: 'chat_leave',
      data: { chatId }
    });
  };

  const sendChatMessage = (chatId, message) => {
    const chatMessage = {
      id: Date.now(),
      chatId,
      message,
      timestamp: new Date().toISOString(),
      sender: useAuthStore.getState().user
    };

    setMessages.current(prev => [...prev, chatMessage]);
    
    sendMessage({
      type: 'chat_message',
      data: chatMessage
    });
  };

  const sendTypingIndicator = (chatId, isTyping) => {
    sendMessage({
      type: 'typing_indicator',
      data: {
        chatId,
        isTyping,
        userId: useAuthStore.getState().user?.id
      }
    });
  };

  return {
    messages: messages.current,
    typingUsers: typingUsers.current,
    joinChat,
    leaveChat,
    sendChatMessage,
    sendTypingIndicator
  };
};

// Real-time leaderboard hook
export const useRealTimeLeaderboard = () => {
  const { sendMessage } = useWebSocketStore();
  const [leaderboard, setLeaderboard] = useRef([]);
  const [lastUpdate, setLastUpdate] = useRef(null);

  const subscribeToLeaderboard = (type = 'global') => {
    sendMessage({
      type: 'leaderboard_subscribe',
      data: { type }
    });
  };

  const unsubscribeFromLeaderboard = (type = 'global') => {
    sendMessage({
      type: 'leaderboard_unsubscribe',
      data: { type }
    });
  };

  return {
    leaderboard: leaderboard.current,
    lastUpdate: lastUpdate.current,
    subscribeToLeaderboard,
    unsubscribeFromLeaderboard
  };
};

// WebSocket connection status hook
export const useConnectionStatus = () => {
  const { isConnected, connectionAttempts } = useWebSocketStore();
  const [latency, setLatency] = useRef(null);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    if (isConnected) {
      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        const startTime = Date.now();
        
        // Send ping message
        const { sendMessage } = useWebSocketStore.getState();
        sendMessage({ type: 'ping', timestamp: startTime });
      }, 30000); // Ping every 30 seconds
    } else {
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    }

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [isConnected]);

  // Handle pong response (this would be handled in the WebSocket message handler)
  const handlePong = (timestamp) => {
    const latency = Date.now() - timestamp;
    setLatency.current(latency);
  };

  return {
    isConnected,
    connectionAttempts,
    latency: latency.current,
    handlePong
  };
};

// Real-time presence hook (for guilds, friends, etc.)
export const useRealTimePresence = () => {
  const { sendMessage } = useWebSocketStore();
  const [onlineUsers, setOnlineUsers] = useRef(new Set());
  const [userStatuses, setUserStatuses] = useRef({});

  const updatePresence = (status) => {
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      sendMessage({
        type: 'presence_update',
        data: {
          userId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const subscribeToUserPresence = (userIds) => {
    sendMessage({
      type: 'presence_subscribe',
      data: { userIds }
    });
  };

  const unsubscribeFromUserPresence = (userIds) => {
    sendMessage({
      type: 'presence_unsubscribe',
      data: { userIds }
    });
  };

  return {
    onlineUsers: onlineUsers.current,
    userStatuses: userStatuses.current,
    updatePresence,
    subscribeToUserPresence,
    unsubscribeFromUserPresence
  };
};

// Main WebSocket provider component
export const WebSocketProvider = ({ children }) => {
  const { user } = useAuthStore();
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';
  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    if (user) {
      const fullUrl = `${wsUrl}?userId=${user.id}`;
      connect(fullUrl);
    }

    return () => {
      disconnect();
    };
  }, [user?.id, wsUrl, connect, disconnect]);

  return children;
};

export default useWebSocket;
