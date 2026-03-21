import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await api.post('/auth/refresh', {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        const { token } = response.data;
        localStorage.setItem('auth_token', token);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear token and redirect to login
        localStorage.removeItem('auth_token');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Enhanced Auth Store with new features
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      
      // Premium state
      premiumStatus: null,
      premiumFeatures: [],
      activeBoosts: [],
      
      // Marketplace state
      inventory: [],
      balance: 0,
      
      // Tournament state
      registeredTournaments: [],
      
      // Staking state
      stakingPositions: [],
      
      // Guild state
      guild: null,
      guildMembers: [],
      
      // Actions
      initializeAuth: async () => {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            set({
              token,
              user: parsedUser,
              isAuthenticated: true,
              isLoading: false
            });
            
            // Load additional user data
            await loadUserProfile(parsedUser.id);
          } catch (error) {
            // Failed to parse user data
            set({ isAuthenticated: false, user: null, token: null, isLoading: false });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        } else {
          // Generate mock user for demo
          const mockUser = {
            id: 'player123',
            username: `Player${Math.floor(Math.random() * 10000)}`,
            display_name: null,
            bio: null,
            faction: 'iran', // or 'usa'
            level: 1,
            experience: 0,
            stg_balance: 5000,
            win_claimable: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            favorite_weapon: 'basic_sword',
            preferred_territory: 'tehran',
            public_profile: true,
            stats: {
              wins: 0,
              losses: 0,
              battles_fought: 0,
              territories_conquered: 0,
              critical_hits: 0,
              highest_wager: 0,
              total_earned: 0,
              missions_completed: 0,
              streak_best: 0,
              faction_contributions: 0
            },
            equipment: {
              weapons_owned: ['basic_sword'],
              current_weapon: 'basic_sword',
              armor_level: 1,
              boosters: []
            },
            social: {
              friends: [],
              faction_mates: [],
              rivals: [],
              reputation: 50
            }
          };
          
          localStorage.setItem('user_data', JSON.stringify(mockUser));
          localStorage.setItem('auth_token', 'mock_token_' + Date.now());
          
          set({
            user: mockUser,
            token: localStorage.getItem('auth_token'),
            isAuthenticated: true,
            isLoading: false
          });
          
          // Load additional data
          await loadUserProfile(mockUser.id);
        }
        
        set({ isLoading: false });
      },
      
      // Load comprehensive user profile
      loadUserProfile: async (userId) => {
        try {
          const response = await api.get('/profile', {
            headers: {
              'x-user-id': userId
            }
          });
          
          if (response.data.success) {
            const profile = response.data.profile;
            set({
              user: profile,
              balance: profile.stg_balance || 0,
              inventory: profile.equipment?.boosters || []
            });
          }
        } catch (error) {
          // Failed to load user profile
        }
      },
      
      // Load premium status
      loadPremiumStatus: async () => {
        try {
          const response = await api.get('/premium/status', {
            headers: {
              'x-user-id': get().user?.id || 'player123'
            }
          });
          
          if (response.data.success) {
            set({
              premiumStatus: response.data.status,
              premiumFeatures: response.data.active_features || [],
              activeBoosts: response.data.active_boosts || []
            });
          }
        } catch (error) {
          // Failed to load premium status
        }
      },
      
      // Load tournament registrations
      loadTournamentRegistrations: async () => {
        try {
          const response = await api.get('/tournaments', {
            headers: {
              'x-user-id': get().user?.id || 'player123'
            }
          });
          
          if (response.data.success) {
            const registered = response.data.tournaments
              .filter(t => t.user_registered)
              .map(t => t.id);
            
            set({ registeredTournaments: registered });
          }
        } catch (error) {
          // Failed to load tournament registrations
        }
      },
      
      // Load staking positions
      loadStakingPositions: async () => {
        try {
          const response = await api.get('/staking/positions', {
            headers: {
              'x-user-id': get().user?.id || 'player123'
            }
          });
          
          if (response.data.success) {
            set({ stakingPositions: response.data.positions || [] });
          }
        } catch (error) {
          // Failed to load staking positions
        }
      },
      
      // Load guild information
      loadGuildInfo: async () => {
        try {
          const response = await api.get('/guilds', {
            headers: {
              'x-user-faction': get().user?.faction || 'iran'
            }
          });
          
          if (response.data.success) {
            const userGuild = response.data.guilds.find(g => 
              g.members.includes(get().user?.id || 'player123')
            );
            
            if (userGuild) {
              set({
                guild: userGuild,
                guildMembers: userGuild.members || []
              });
            }
          }
        } catch (error) {
          // Failed to load guild info
        }
      },
      
      // Update user balance
      updateBalance: (newBalance) => {
        set(state => ({
          balance: newBalance,
          user: state.user ? { ...state.user, stg_balance: newBalance } : null
        }));
      },
      
      // Add item to inventory
      addToInventory: (item) => {
        set(state => ({
          inventory: [...state.inventory, item]
        }));
      },
      
      // Remove item from inventory
      removeFromInventory: (itemId) => {
        set(state => ({
          inventory: state.inventory.filter(item => item.id !== itemId)
        }));
      },
      
      // Update user stats
      updateUserStats: (statsUpdate) => {
        set(state => ({
          user: state.user ? {
            ...state.user,
            stats: { ...state.user.stats, ...statsUpdate }
          } : null
        }));
      },
      
      // Add experience and level up
      addExperience: (exp) => {
        set(state => {
          if (!state.user) return state;
          
          const newExperience = state.user.experience + exp;
          const newLevel = Math.floor(newExperience / 1000) + 1;
          
          return {
            user: {
              ...state.user,
              experience: newExperience,
              level: newLevel
            }
          };
        });
      },
      
      // Set premium status
      setPremiumStatus: (status, features = [], boosts = []) => {
        set({
          premiumStatus: status,
          premiumFeatures: features,
          activeBoosts: boosts
        });
      },
      
      // Register for tournament
      registerForTournament: (tournamentId) => {
        set(state => ({
          registeredTournaments: [...state.registeredTournaments, tournamentId]
        }));
      },
      
      // Add staking position
      addStakingPosition: (position) => {
        set(state => ({
          stakingPositions: [...state.stakingPositions, position]
        }));
      },
      
      // Update staking position
      updateStakingPosition: (positionId, updates) => {
        set(state => ({
          stakingPositions: state.stakingPositions.map(pos =>
            pos.id === positionId ? { ...pos, ...updates } : pos
          )
        }));
      },
      
      // Join guild
      joinGuild: (guild) => {
        set({
          guild,
          guildMembers: guild.members || []
        });
      },
      
      // Leave guild
      leaveGuild: () => {
        set({
          guild: null,
          guildMembers: []
        });
      },
      
      // Logout
      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          premiumStatus: null,
          premiumFeatures: [],
          activeBoosts: [],
          inventory: [],
          balance: 0,
          registeredTournaments: [],
          stakingPositions: [],
          guild: null,
          guildMembers: []
        });
      },
      
      // Clear auth
      clearAuth: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Helper function to load all user data
const loadUserProfile = async (userId) => {
  const { loadPremiumStatus, loadTournamentRegistrations, loadStakingPositions, loadGuildInfo } = useAuthStore.getState();
  
  await Promise.all([
    loadPremiumStatus(),
    loadTournamentRegistrations(),
    loadStakingPositions(),
    loadGuildInfo()
  ]);
};

export { api };
export default useAuthStore;
