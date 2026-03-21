// Jest test setup file
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  asyncWrapperTimeout: 5000
});

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: WebSocket.OPEN
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn()
});

// Mock window.Telegram
global.Telegram = {
  WebApp: {
    ready: jest.fn(),
    expand: jest.fn(),
    close: jest.fn(),
    setHeaderColor: jest.fn(),
    setBackgroundColor: jest.fn(),
    sendData: jest.fn(),
    openLink: jest.fn(),
    openTelegramLink: jest.fn(),
    openInvoice: jest.fn(),
    showPopup: jest.fn(),
    showAlert: jest.fn(),
    showConfirm: jest.fn(),
    showScanQrPopup: jest.fn(),
    closeScanQrPopup: jest.fn(),
    readTextFromClipboard: jest.fn(),
    requestWriteAccess: jest.fn(),
    requestContact: jest.fn(),
    ready: true,
    isVersionAtLeast: jest.fn().mockReturnValue(true),
    platform: 'tdesktop',
    colorScheme: 'dark',
    themeParams: {
      bg_color: '#0a0a0a',
      text_color: '#ffffff',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff'
    },
    initData: '',
    initDataUnsafe: {},
    viewportHeight: 768,
    viewportStableHeight: 768,
    headerColor: '#0a0a0a',
    backgroundColor: '#0a0a0a',
    isExpanded: false
  }
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  username: 'testuser',
  display_name: 'Test User',
  faction: 'iran',
  level: 1,
  experience: 0,
  stg_balance: 1000,
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
  },
  ...overrides
});

global.createMockBattle = (overrides = {}) => ({
  id: 'battle-test-123',
  attacker_id: 'test-user-123',
  defender_id: 'test-user-456',
  attacker_faction: 'iran',
  defender_faction: 'usa',
  weapon_id: 'basic_sword',
  territory_id: 'tehran',
  stg_wager: 100,
  result: 'win',
  battle_quality: 'struggle',
  critical_hit: false,
  experience_gained: 50,
  stg_reward: 200,
  territory_bonus: { attack: 1.2, defense: 1.3, experience: 1.1 },
  weapon_bonus: { attack: 1.0, defense: 0.9, critical: 0.05 },
  faction_bonus: { attack: 1.1, defense: 1.1, critical: 0.02 },
  created_at: new Date().toISOString(),
  ...overrides
});

global.createMockTerritory = (overrides = {}) => ({
  id: 'test-territory',
  name: 'Test Territory',
  faction: 'neutral',
  controller_id: null,
  attack_bonus: 1.0,
  defense_bonus: 1.0,
  daily_revenue: 500,
  strategic_value: 5,
  climate: 'temperate',
  difficulty: 'normal',
  last_conquered: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

global.createMockGuild = (overrides = {}) => ({
  id: 'test-guild',
  name: 'Test Guild',
  description: 'A test guild for testing',
  faction: 'iran',
  leader_id: 'test-user-123',
  max_members: 50,
  current_members: 1,
  power: 1000,
  members: ['test-user-123'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

global.createMockTournament = (overrides = {}) => ({
  id: 'test-tournament',
  name: 'Test Tournament',
  description: 'A test tournament',
  type: 'elimination',
  duration: 3 * 24 * 60 * 60 * 1000,
  entry_fee: 100,
  max_participants: 128,
  current_participants: 0,
  status: 'registration',
  prize_pool: 0,
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user_registered: false,
  bracket: null,
  ...overrides
});

global.createMockStakingPool = (overrides = {}) => ({
  id: 'test-pool',
  name: 'Test Pool',
  apy: 10.0,
  total_staked: 10000,
  stakers: 5,
  lock_period: 30 * 24 * 60 * 60 * 1000,
  minimum_stake: 100,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock API responses
global.mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Map([
    ['content-type', 'application/json'],
    ['x-request-id', 'test-request-id']
  ])
});

// Helper function to wait for async operations
global.waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 50);
      }
    };
    
    check();
  });
};

// Helper function to flush promises
global.flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock performance API
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => [])
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock crypto API
global.crypto = {
  ...global.crypto,
  getRandomValues: jest.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
};

// Mock URL constructor
global.URL = class URL {
  constructor(url) {
    this.href = url;
    this.origin = url.split('/')[0] + '//' + url.split('/')[2];
    this.pathname = '/' + url.split('/').slice(3).join('/');
    this.search = url.includes('?') ? url.split('?')[1] : '';
    this.searchParams = new URLSearchParams(this.search);
  }
};

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(query) {
    this.params = new Map();
    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=');
        this.params.set(key, value);
      });
    }
  }
  
  get(key) {
    return this.params.get(key);
  }
  
  set(key, value) {
    this.params.set(key, value);
  }
  
  has(key) {
    return this.params.has(key);
  }
  
  toString() {
    const params = [];
    this.params.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });
    return params.join('&');
  }
};
