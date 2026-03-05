const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Battle = require('../models/Battle');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  const clients = new Map(); // clientId -> client data
  const userConnections = new Map(); // userId -> Set of clientIds

  // Generate unique client ID
  const generateClientId = () => {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Broadcast to specific user
  const broadcastToUser = (userId, message) => {
    const userClientIds = userConnections.get(userId);
    if (userClientIds) {
      userClientIds.forEach(clientId => {
        const client = clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      });
    }
  };

  // Broadcast to all clients
  const broadcastToAll = (message) => {
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  };

  // Handle WebSocket connection
  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    
    const client = {
      id: clientId,
      ws,
      userId: null,
      authenticated: false,
      rooms: new Set(),
      lastPing: Date.now()
    };

    clients.set(clientId, client);

    console.log(`🔌 WebSocket client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId: clientId,
      timestamp: new Date().toISOString()
    }));

    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleMessage(client, data);
      } catch (error) {
        console.error(`❌ WebSocket message error from ${clientId}:`, error);
        sendError(client, 'Invalid message format');
      }
    });

    // Handle close
    ws.on('close', () => {
      handleDisconnect(client);
    });

    // Handle error
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${clientId}:`, error);
      handleDisconnect(client);
    });

    // Ping/Pong for connection health
    ws.on('pong', () => {
      client.lastPing = Date.now();
    });
  });

  // Periodic ping to check connections
  const pingInterval = setInterval(() => {
    const now = Date.now();
    clients.forEach((client, clientId) => {
      if (now - client.lastPing > 30000) { // 30 seconds timeout
        console.log(`⏰ WebSocket client timeout: ${clientId}`);
        client.ws.terminate();
        handleDisconnect(client);
      } else {
        client.ws.ping();
      }
    });
  }, 15000); // Ping every 15 seconds

  // Handle incoming messages
  const handleMessage = async (client, data) => {
    const { type, ...payload } = data;

    switch (type) {
      case 'authenticate':
        await handleAuthentication(client, payload);
        break;

      case 'join_room':
        handleJoinRoom(client, payload);
        break;

      case 'leave_room':
        handleLeaveRoom(client, payload);
        break;

      case 'battle_move':
        await handleBattleMove(client, payload);
        break;

      case 'chat_message':
        await handleChatMessage(client, payload);
        break;

      case 'ping':
        handlePing(client);
        break;

      default:
        sendError(client, 'Unknown message type');
    }
  };

  // Handle authentication
  const handleAuthentication = async (client, { token }) => {
    try {
      if (!token) {
        return sendError(client, 'Authentication token required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return sendError(client, 'User not found');
      }

      client.userId = user._id.toString();
      client.authenticated = true;

      // Add to user connections
      if (!userConnections.has(client.userId)) {
        userConnections.set(client.userId, new Set());
      }
      userConnections.get(client.userId).add(client.id);

      // Update user last active
      user.last_active = new Date();
      await user.save();

      console.log(`✅ WebSocket client authenticated: ${client.id} -> User ${user.username}`);

      // Send authentication success
      client.ws.send(JSON.stringify({
        type: 'authenticated',
        user: {
          id: user._id,
          username: user.username,
          faction: user.faction,
          level: user.game_stats.level
        },
        timestamp: new Date().toISOString()
      }));

      // Join user to their faction room
      handleJoinRoom(client, { room: `faction_${user.faction}` });

    } catch (error) {
      console.error('❌ WebSocket authentication error:', error);
      sendError(client, 'Invalid authentication token');
    }
  };

  // Handle room joining
  const handleJoinRoom = (client, { room }) => {
    if (!client.authenticated) {
      return sendError(client, 'Authentication required');
    }

    client.rooms.add(room);
    
    console.log(`📡 Client ${client.id} joined room: ${room}`);

    client.ws.send(JSON.stringify({
      type: 'room_joined',
      room: room,
      timestamp: new Date().toISOString()
    }));
  };

  // Handle room leaving
  const handleLeaveRoom = (client, { room }) => {
    client.rooms.delete(room);
    
    console.log(`📡 Client ${client.id} left room: ${room}`);

    client.ws.send(JSON.stringify({
      type: 'room_left',
      room: room,
      timestamp: new Date().toISOString()
    }));
  };

  // Handle battle moves
  const handleBattleMove = async (client, { battleId, move }) => {
    if (!client.authenticated) {
      return sendError(client, 'Authentication required');
    }

    try {
      const battle = await Battle.findById(battleId);
      if (!battle) {
        return sendError(client, 'Battle not found');
      }

      // Check if user is part of this battle
      const isParticipant = battle.players.some(p => 
        p.user_id.toString() === client.userId
      );

      if (!isParticipant) {
        return sendError(client, 'You are not a participant in this battle');
      }

      // Process the move
      const updatedBattle = await battle.makeMove(client.userId, move);

      // Broadcast move to both players
      battle.players.forEach(player => {
        broadcastToUser(player.user_id.toString(), {
          type: 'battle_move',
          battle: {
            id: battle._id,
            battle_id: battle.battle_id,
            current_turn: updatedBattle.current_turn,
            players: updatedBattle.players,
            total_turns: updatedBattle.result.total_turns,
            status: updatedBattle.status
          },
          move: {
            player_id: client.userId,
            move: move,
            timestamp: new Date().toISOString()
          }
        });
      });

      // Check if battle ended
      if (updatedBattle.status === 'completed') {
        // Update user stats
        const winner = await User.findById(updatedBattle.result.winner);
        const loser = await User.findById(updatedBattle.result.loser);

        await Promise.all([
          winner.updateStats(true, updatedBattle.result.experience_gained.winner),
          loser.updateStats(false, updatedBattle.result.experience_gained.loser)
        ]);

        // Broadcast battle completion
        battle.players.forEach(player => {
          broadcastToUser(player.user_id.toString(), {
            type: 'battle_completed',
            battle: {
              id: battle._id,
              battle_id: battle.battle_id,
              winner: updatedBattle.result.winner,
              loser: updatedBattle.result.loser,
              outcome: updatedBattle.result.outcome,
              duration_seconds: updatedBattle.result.duration_seconds,
              experience_gained: updatedBattle.result.experience_gained,
              stg_tokens_transferred: updatedBattle.result.stg_tokens_transferred,
              completed_at: updatedBattle.completed_at
            }
          });
        });

        // Update leaderboard
        broadcastToAll({
          type: 'leaderboard_updated',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Battle move error:', error);
      sendError(client, error.message);
    }
  };

  // Handle chat messages
  const handleChatMessage = async (client, { room, message }) => {
    if (!client.authenticated) {
      return sendError(client, 'Authentication required');
    }

    try {
      const user = await User.findById(client.userId);
      if (!user) {
        return sendError(client, 'User not found');
      }

      const chatMessage = {
        type: 'chat_message',
        room: room,
        message: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user._id,
          username: user.username,
          faction: user.faction,
          message: message,
          timestamp: new Date().toISOString()
        }
      };

      // Broadcast to room members
      clients.forEach((otherClient) => {
        if (otherClient.authenticated && 
            otherClient.rooms.has(room) && 
            otherClient.ws.readyState === WebSocket.OPEN) {
          otherClient.ws.send(JSON.stringify(chatMessage));
        }
      });

    } catch (error) {
      console.error('❌ Chat message error:', error);
      sendError(client, 'Failed to send message');
    }
  };

  // Handle ping
  const handlePing = (client) => {
    client.lastPing = Date.now();
    client.ws.send(JSON.stringify({
      type: 'pong',
      timestamp: new Date().toISOString()
    }));
  };

  // Handle disconnect
  const handleDisconnect = (client) => {
    console.log(`🔌 WebSocket client disconnected: ${client.id}`);

    // Remove from user connections
    if (client.userId && userConnections.has(client.userId)) {
      userConnections.get(client.userId).delete(client.id);
      if (userConnections.get(client.userId).size === 0) {
        userConnections.delete(client.userId);
      }
    }

    // Remove client
    clients.delete(client.id);
  };

  // Send error message
  const sendError = (client, message) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: message,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Cleanup on server shutdown
  const cleanup = () => {
    clearInterval(pingInterval);
    wss.close();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Make broadcast functions available globally
  global.broadcastToUser = broadcastToUser;
  global.broadcastToAll = broadcastToAll;

  console.log('🔌 WebSocket server initialized');
  return wss;
};

module.exports = setupWebSocket;
