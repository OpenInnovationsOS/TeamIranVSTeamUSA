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

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      // Initialize authentication
      initializeAuth: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          
          if (!token) {
            // Try to authenticate via Telegram
            await get().authenticateWithTelegram();
          } else {
            // Verify existing token
            await get().verifyToken(token);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('auth_token');
          set({ isLoading: false, isAuthenticated: false, user: null, token: null });
        }
      },

      // Authenticate with Telegram
      authenticateWithTelegram: async () => {
        try {
          // Get Telegram user data from URL params or WebApp
          const urlParams = new URLSearchParams(window.location.search);
          const telegramUserId = urlParams.get('user') || 
                               (window.Telegram?.WebApp?.initDataUnsafe?.user?.id);

          if (!telegramUserId) {
            // Create fallback user for development/testing
            console.log('Telegram user ID not found, creating fallback user');
            const fallbackUser = {
              telegram_id: Math.floor(Math.random() * 1000000) + 100000,
              username: `Player${Math.floor(Math.random() * 10000)}`,
              first_name: 'Test',
              last_name: 'User'
            };
            
            try {
              const response = await api.post('/register', {
                username: fallbackUser.username,
                faction: null // Will be set later
              });
              
              const { token, user } = response.data.data;
              localStorage.setItem('auth_token', token);
              set({ user, token, isAuthenticated: true, isLoading: false });
              return;
            } catch (registerError) {
              console.error('Registration failed:', registerError);
              // Create local fallback user
              const localUser = {
                id: fallbackUser.telegram_id,
                username: fallbackUser.username,
                faction: null,
                balance: 1000,
                level: 1,
                experience: 0
              };
              const localToken = 'fallback_token_' + Math.random().toString(36).substr(2, 9);
              localStorage.setItem('auth_token', localToken);
              set({ user: localUser, token: localToken, isAuthenticated: true, isLoading: false });
              return;
            }
          }

          // Get additional Telegram data
          const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
          
          try {
            const response = await api.post('/auth/telegram', {
              telegram_id: parseInt(telegramUserId),
              username: telegramUser.username,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
            });

            const { token: newToken, user } = response.data;
            
            localStorage.setItem('auth_token', newToken);
            
            set({
              user,
              token: newToken,
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true, user, token: newToken };
          } catch (error) {
            console.error('Telegram authentication failed:', error);
            set({ isLoading: false });
            throw error;
          }
        } catch (error) {
          console.error('Authentication failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Verify existing token
      verifyToken: async (token) => {
        try {
          const response = await api.get('/auth/verify');
          const { user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true, user };
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ isLoading: false, isAuthenticated: false, user: null, token: null });
          throw error;
        }
      },

      // Refresh token
      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { token: newToken } = response.data;
          
          localStorage.setItem('auth_token', newToken);
          set({ token: newToken });
          
          return { success: true, token: newToken };
        } catch (error) {
          console.error('Token refresh failed:', error);
          throw error;
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Update user data
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Get API instance
      getAPI: () => api,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
