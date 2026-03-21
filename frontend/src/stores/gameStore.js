import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Game State Store for managing real-time game data
export const useGameStore = create(
  persist(
    (set, get) => ({
      // Battle state
      currentBattle: null,
      battleHistory: [],
      opponents: [],
      
      // Territory state
      territories: [],
      selectedTerritory: null,
      territoryControl: { iran: [], usa: [], neutral: [] },
      
      // Mission state
      missions: [],
      missionProgress: {},
      
      // Tournament state
      activeTournaments: [],
      tournamentBrackets: {},
      
      // Real-time updates
      lastUpdate: null,
      notifications: [],
      
      // UI state
      loadingStates: {},
      errors: {},
      
      // Battle actions
      setCurrentBattle: (battle) => set({ currentBattle: battle }),
      
      addToBattleHistory: (battle) => set(state => ({
        battleHistory: [battle, ...state.battleHistory.slice(0, 49)]
      })),
      
      updateOpponents: (opponents) => set({ opponents }),
      
      // Territory actions
      setTerritories: (territories) => set({ territories }),
      
      selectTerritory: (territory) => set({ selectedTerritory: territory }),
      
      updateTerritoryControl: (territoryId, newController) => {
        set(state => {
          const newControl = { ...state.territoryControl };
          
          // Remove from all controllers
          Object.keys(newControl).forEach(controller => {
            newControl[controller] = newControl[controller].filter(id => id !== territoryId);
          });
          
          // Add to new controller
          if (newController && newControl[newController]) {
            newControl[newController].push(territoryId);
          }
          
          return { territoryControl: newControl };
        });
      },
      
      // Mission actions
      setMissions: (missions) => set({ missions }),
      
      updateMissionProgress: (missionId, progress) => {
        set(state => ({
          missionProgress: {
            ...state.missionProgress,
            [missionId]: progress
          }
        }));
      },
      
      completeMission: (missionId) => {
        set(state => ({
          missions: state.missions.map(mission =>
            mission.id === missionId
              ? { ...mission, completed: true, claimed: true }
              : mission
          )
        }));
      },
      
      // Tournament state
      activeTournaments: [],
      tournamentBrackets: {},
      tournamentParticipants: {},
      
      // WebSocket state
      isConnected: false,
      wsConnection: null,
      
      // Tournament actions
      setActiveTournaments: (tournaments) => set({ activeTournaments: tournaments }),
      
      // WebSocket actions
      connect: (wsUrl) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          set({ isConnected: true, wsConnection: ws });
        };
        
        ws.onclose = () => {
          set({ isConnected: false, wsConnection: null });
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Handle real-time updates here
            console.log('WebSocket message:', data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      },
      
      disconnect: () => {
        const { wsConnection } = get();
        if (wsConnection) {
          wsConnection.close();
          set({ isConnected: false, wsConnection: null });
        }
      },
      
      sendMessage: (message) => {
        const { wsConnection } = get();
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(JSON.stringify(message));
        }
      },
      
      updateTournamentBracket: (tournamentId, bracket) => {
        set(state => ({
          tournamentBrackets: {
            ...state.tournamentBrackets,
            [tournamentId]: bracket
          }
        }));
      },
      
      // Real-time updates
      setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
      
      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications.slice(0, 19)]
        }));
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Loading states
      setLoading: (key, isLoading) => {
        set(state => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: isLoading
          }
        }));
      },
      
      // Error handling
      setError: (key, error) => {
        set(state => ({
          errors: {
            ...state.errors,
            [key]: error
          }
        }));
      },
      
      clearError: (key) => {
        set(state => {
          const newErrors = { ...state.errors };
          delete newErrors[key];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => set({ errors: {} }),
      
      // Reset state
      resetGameState: () => set({
        currentBattle: null,
        battleHistory: [],
        opponents: [],
        territories: [],
        selectedTerritory: null,
        territoryControl: { iran: [], usa: [], neutral: [] },
        missions: [],
        missionProgress: {},
        activeTournaments: [],
        tournamentBrackets: {},
        tournamentParticipants: {},
        isConnected: false,
        wsConnection: null,
        lastUpdate: null,
        notifications: [],
        loadingStates: {},
        errors: {}
      })
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        battleHistory: state.battleHistory,
        territoryControl: state.territoryControl,
        missionProgress: state.missionProgress
      })
    }
  )
);

// WebSocket Store for real-time connections
export const useWebSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  connectionAttempts: 0,
  
  connect: (url) => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        set({ socket: ws, isConnected: true, connectionAttempts: 0 });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          // Failed to parse WebSocket message
        }
      };
      
      ws.onclose = () => {
        set({ socket: null, isConnected: false });
        
        // Attempt reconnection
        const { connectionAttempts } = get();
        if (connectionAttempts < 5) {
          setTimeout(() => {
            set({ connectionAttempts: connectionAttempts + 1 });
            connect(url);
          }, 2000 * Math.pow(2, connectionAttempts));
        }
      };
      
      ws.onerror = (error) => {
        set({ socket: null, isConnected: false });
      };
      
      set({ socket: ws });
    } catch (error) {
      // Failed to create WebSocket connection
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
  },
  
  sendMessage: (message) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}));

// Handle WebSocket messages
const handleWebSocketMessage = (data) => {
  const gameStore = useGameStore.getState();
  
  switch (data.type) {
    case 'battle_update':
      if (data.battle) {
        gameStore.setCurrentBattle(data.battle);
      }
      break;
      
    case 'battle_result':
      if (data.battle) {
        gameStore.addToBattleHistory(data.battle);
        gameStore.setCurrentBattle(null);
      }
      break;
      
    case 'territory_update':
      if (data.territoryId && data.newController) {
        gameStore.updateTerritoryControl(data.territoryId, data.newController);
      }
      break;
      
    case 'mission_update':
      if (data.mission) {
        gameStore.updateMissionProgress(data.mission.id, data.progress);
      }
      break;
      
    case 'tournament_update':
      if (data.tournamentId && data.bracket) {
        gameStore.updateTournamentBracket(data.tournamentId, data.bracket);
      }
      break;
      
    case 'notification':
      if (data.notification) {
        gameStore.addNotification(data.notification);
      }
      break;
      
    default:
      // Unknown WebSocket message type
  }
};

export default useGameStore;
