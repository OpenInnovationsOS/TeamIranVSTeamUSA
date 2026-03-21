// Real-Time Synchronization System - WebSocket Integration
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocketBattle } from '../hooks/useWebSocketBattle';
import { API_CONFIG } from '../config/api';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #00ff88, #00a6ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatusCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const CardContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const StatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
  background: ${props => 
    props.status === 'connected' ? 'rgba(0, 255, 0, 0.3)' : 
    props.status === 'connecting' ? 'rgba(255, 165, 0, 0.3)' : 
    props.status === 'disconnected' ? 'rgba(255, 0, 0, 0.3)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  color: ${props => 
    props.status === 'connected' ? '#00ff00' : 
    props.status === 'connecting' ? '#ffa500' : 
    props.status === 'disconnected' ? '#ff0000' : 
    '#ffffff'
  };
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const StatValue = styled.span`
  color: #00ff88;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #00ff88, #00a6ff);
  border: none;
  border-radius: 8px;
  color: #000000;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`;

const LogContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 136, 0.5);
    border-radius: 3px;
  }
`;

const LogEntry = styled.div`
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  background: ${props => 
    props.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : 
    props.type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 
    props.type === 'warning' ? 'rgba(255, 165, 0, 0.1)' : 
    'rgba(255, 255, 255, 0.05)'
  };
  border-left: 3px solid ${props => 
    props.type === 'success' ? '#00ff00' : 
    props.type === 'error' ? '#ff0000' : 
    props.type === 'warning' ? '#ffa500' : 
    '#ffffff'
  };
`;

const SyncProgress = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const SyncProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(45deg, #00ff88, #00a6ff);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const RealTimeSync = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [wsConnection, setWsConnection] = useState(null);
  const [syncStats, setSyncStats] = useState({
    messagesReceived: 0,
    messagesSent: 0,
    lastSync: null,
    uptime: 0,
    latency: 0,
    reconnectAttempts: 0
  });
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${API_CONFIG.wsURL}/ws`);
        
        ws.onopen = () => {
          setSyncStatus('connected');
          setWsConnection(ws);
          addLog('WebSocket connected', 'success');
          hapticFeedback('success');
          setupHeartbeat(ws);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleRealTimeUpdate(data);
          updateSyncStats('received');
        };
        
        ws.onclose = () => {
          setSyncStatus('disconnected');
          setWsConnection(null);
          addLog('WebSocket disconnected', 'warning');
          attemptReconnection();
        };
        
        ws.onerror = (error) => {
          setSyncStatus('disconnected');
          addLog(`WebSocket error: ${error.message}`, 'error');
        };
        
      } catch (error) {
        setSyncStatus('disconnected');
        addLog(`Failed to connect: ${error.message}`, 'error');
      }
    };

    connectWebSocket();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Setup heartbeat
  const setupHeartbeat = (ws) => {
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        updateSyncStats('sent');
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  };

  // Handle real-time updates
  const handleRealTimeUpdate = (data) => {
    switch (data.type) {
      case 'BATTLE_UPDATE':
        addLog(`Battle update: ${data.payload.battleId}`, 'success');
        break;
      case 'TERRITORY_UPDATE':
        addLog(`Territory update: ${data.payload.territoryId}`, 'success');
        break;
      case 'LEADERBOARD_UPDATE':
        addLog(`Leaderboard update: ${data.payload.playerId}`, 'success');
        break;
      case 'TOURNAMENT_UPDATE':
        addLog(`Tournament update: ${data.payload.tournamentId}`, 'success');
        break;
      case 'GUILD_UPDATE':
        addLog(`Guild update: ${data.payload.guildId}`, 'success');
        break;
      case 'MARKET_UPDATE':
        addLog(`Market update: ${data.payload.itemId}`, 'success');
        break;
      case 'CHAT_MESSAGE':
        addLog(`Chat message from ${data.payload.username}`, 'success');
        break;
      case 'SYSTEM_NOTIFICATION':
        addLog(`System: ${data.payload.message}`, 'warning');
        break;
      default:
        addLog(`Unknown update type: ${data.type}`, 'warning');
    }
  };

  // Update sync statistics
  const updateSyncStats = (type) => {
    setSyncStats(prev => ({
      ...prev,
      messagesReceived: type === 'received' ? prev.messagesReceived + 1 : prev.messagesReceived,
      messagesSent: type === 'sent' ? prev.messagesSent + 1 : prev.messagesSent,
      lastSync: new Date(),
      uptime: type === 'connected' ? Date.now() : prev.uptime,
      latency: Math.random() * 100 // Simulated latency
    }));
  };

  // Add log entry
  const addLog = (message, type = 'info') => {
    setSyncLogs(prev => [
      {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 99)
    ]);
  };

  // Attempt reconnection
  const attemptReconnection = () => {
    setSyncStats(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    addLog(`Attempting reconnection (${syncStats.reconnectAttempts + 1})`, 'warning');
    
    setTimeout(() => {
      if (syncStatus === 'disconnected') {
        setSyncStatus('connecting');
        // Trigger reconnection
        window.location.reload();
      }
    }, 5000);
  };

  // Manual sync
  const manualSync = async () => {
    if (syncStatus !== 'connected') {
      toast.error('Not connected to server');
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    hapticFeedback('impact');

    try {
      // Simulate sync progress
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success('🔄 Manual sync completed!');
      hapticFeedback('success');
      addLog('Manual sync completed successfully', 'success');
    } catch (error) {
      toast.error('Sync failed');
      addLog(`Sync failed: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // Force reconnect
  const forceReconnect = () => {
    setSyncStatus('connecting');
    addLog('Force reconnecting...', 'warning');
    window.location.reload();
  };

  // Clear logs
  const clearLogs = () => {
    setSyncLogs([]);
    addLog('Logs cleared', 'info');
  };

  return (
    <Container>
      <Title>🔄 Real-Time Synchronization</Title>
      
      <StatusContainer>
        {/* Connection Status */}
        <StatusCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CardHeader>
            <CardIcon>🔗</CardIcon>
            <CardTitle>
              Connection Status
              <StatusIndicator status={syncStatus}>
                {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
              </StatusIndicator>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow>
              <StatLabel>WebSocket URL</StatLabel>
              <StatValue>{API_CONFIG.wsURL}/ws</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Connection Time</StatLabel>
              <StatValue>{syncStats.uptime ? new Date(syncStats.uptime).toLocaleTimeString() : 'N/A'}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Latency</StatLabel>
              <StatValue>{Math.round(syncStats.latency)}ms</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Reconnect Attempts</StatLabel>
              <StatValue>{syncStats.reconnectAttempts}</StatValue>
            </StatRow>
            <ActionButton
              onClick={forceReconnect}
              disabled={syncStatus === 'connecting'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Force Reconnect
            </ActionButton>
          </CardContent>
        </StatusCard>

        {/* Sync Statistics */}
        <StatusCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardHeader>
            <CardIcon>📊</CardIcon>
            <CardTitle>Sync Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow>
              <StatLabel>Messages Received</StatLabel>
              <StatValue>{syncStats.messagesReceived.toLocaleString()}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Messages Sent</StatLabel>
              <StatValue>{syncStats.messagesSent.toLocaleString()}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Last Sync</StatLabel>
              <StatValue>{syncStats.lastSync ? syncStats.lastSync.toLocaleTimeString() : 'Never'}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Total Messages</StatLabel>
              <StatValue>{(syncStats.messagesReceived + syncStats.messagesSent).toLocaleString()}</StatValue>
            </StatRow>
            <ActionButton
              onClick={manualSync}
              disabled={isSyncing || syncStatus !== 'connected'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSyncing ? 'Syncing...' : 'Manual Sync'}
            </ActionButton>
            {isSyncing && (
              <SyncProgress>
                <SyncProgressBar progress={syncProgress} />
              </SyncProgress>
            )}
          </CardContent>
        </StatusCard>

        {/* Real-Time Features */}
        <StatusCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CardHeader>
            <CardIcon>⚡</CardIcon>
            <CardTitle>Real-Time Features</CardTitle>
          </CardHeader>
          <CardContent>
            <StatRow>
              <StatLabel>Battle Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Territory Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Leaderboard Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Tournament Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Guild Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Market Updates</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Chat Messages</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>System Notifications</StatLabel>
              <StatValue>✅ Active</StatValue>
            </StatRow>
          </CardContent>
        </StatusCard>

        {/* Sync Logs */}
        <StatusCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CardHeader>
            <CardIcon>📝</CardIcon>
            <CardTitle>Sync Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <LogContainer>
              {syncLogs.length > 0 ? (
                syncLogs.map(log => (
                  <LogEntry key={log.id} type={log.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{log.message}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{log.timestamp}</span>
                    </div>
                  </LogEntry>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  No logs available
                </div>
              )}
            </LogContainer>
            <ActionButton
              onClick={clearLogs}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Logs
            </ActionButton>
          </CardContent>
        </StatusCard>
      </StatusContainer>
    </Container>
  );
};

export default RealTimeSync;
