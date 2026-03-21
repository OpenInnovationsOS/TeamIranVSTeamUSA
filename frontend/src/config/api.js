// API Configuration for frontend
const API_BASE_URL = process.env.NODE_ENV === 'production' && !process.env.REACT_APP_FORCE_LOCAL
  ? 'https://your-backend.railway.app' 
  : 'http://localhost:3001';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// WebSocket URL
export const WS_URL = process.env.NODE_ENV === 'production' && !process.env.REACT_APP_FORCE_LOCAL
  ? 'wss://your-backend.railway.app'
  : 'ws://localhost:3001';

// API Endpoints
export const ENDPOINTS = {
  // User endpoints
  REGISTER: '/api/users/register',
  LOGIN: '/api/users/login',
  STATS: '/api/users/stats',
  PROFILE: '/api/users/profile',
  LEADERBOARD: '/api/users/leaderboard',
  
  // Battle endpoints
  BATTLES: '/api/battles',
  ACTIVE_BATTLES: '/api/battles/active',
  CREATE_BATTLE: '/api/battles/create',
  JOIN_BATTLE: '/api/battles/join',
  
  // Monetization endpoints
  PRODUCTS: '/api/monetization/products',
  PURCHASE: '/api/monetization/purchase',
  SUBSCRIBE: '/api/monetization/subscribe',
  PURCHASES: '/api/monetization/purchases',
  
  // Test endpoints
  HEALTH: '/health',
  TEST: '/api/test',
};

// Error handling
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      error: error.response.data.error || {
        code: 'SERVER_ERROR',
        message: 'Server error occurred'
      }
    };
  } else if (error.request) {
    // Network error
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error - please check your connection'
      }
    };
  } else {
    // Other error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      }
    };
  }
};

export default API_CONFIG;
