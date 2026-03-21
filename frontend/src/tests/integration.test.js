/**
 * Frontend Integration Tests
 * Tests React components, API integration, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Import components to test
import App from '../App';
import BattleArena from '../components/BattleArena';
import MilitaryWeaponsShop from '../components/MilitaryWeaponsShop';
import Leaderboard from '../components/Leaderboard';

// Import stores and hooks
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Test wrapper component
const TestWrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    <BrowserRouter>
      {children}
      <Toaster />
    </BrowserRouter>
  </QueryClientProvider>
);

// Mock API responses
const mockUser = {
  id: '1',
  telegram_id: 123456789,
  username: 'testuser',
  faction: 'iran',
  level: 5,
  stg_balance: 1000,
  game_stats: {
    experience: 500,
    wins: 10,
    losses: 5,
    total_battles: 15
  }
};

const mockLeaderboard = [
  {
    rank: 1,
    user_id: '1',
    username: 'testuser',
    faction: 'iran',
    level: 5,
    stats: {
      total_battles: 15,
      battles_won: 10,
      win_rate: 66.7,
      stg_balance: 1000
    }
  }
];

const mockWeapons = [
  {
    id: 'tank_abrams',
    name: 'M1A2 Abrams',
    category: 'tanks',
    faction: 'usa',
    rarity: 'epic',
    price: 25000,
    level_requirement: 15
  }
];

// Mock fetch globally
global.fetch = jest.fn();

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Reset auth store
    useAuthStore.getState().reset();
  });

  describe('Authentication Flow', () => {
    test('should initialize auth state correctly', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.isLoading).toBe(false);
    });

    test('should handle authentication success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
          token: 'mock_token'
        })
      });

      const { authenticateWithTelegram } = useAuthStore.getState();
      
      await authenticateWithTelegram();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock_token');
    });

    test('should handle authentication failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Authentication failed'
        })
      });

      const { authenticateWithTelegram } = useAuthStore.getState();
      
      await authenticateWithTelegram();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
    });
  });

  describe('Battle Arena Component', () => {
    test('should render battle arena correctly', async () => {
      // Mock user authentication
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      // Mock battle data
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeaderboard
        })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      expect(screen.getByText(/battle arena/i)).toBeInTheDocument();
      expect(screen.getByText(/find opponent/i)).toBeInTheDocument();
    });

    test('should handle matchmaking request', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            queue_id: 'mock_queue_id',
            preferences: {
              battle_type: 'normal',
              stake_amount: 100
            }
          }
        })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      const findOpponentButton = screen.getByText(/find opponent/i);
      fireEvent.click(findOpponentButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/matchmaking/join'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock_token'
            })
          })
        );
      });
    });
  });

  describe('Military Weapons Shop', () => {
    test('should render weapons shop correctly', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            weapons: mockWeapons,
            categories: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
            factions: ['iran', 'usa', 'neutral']
          }
        })
      });

      render(
        <TestWrapper>
          <MilitaryWeaponsShop />
        </TestWrapper>
      );

      expect(screen.getByText(/military weapons shop/i)).toBeInTheDocument();
      expect(screen.getByText(/tanks/i)).toBeInTheDocument();
    });

    test('should handle weapon purchase', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            weapons: mockWeapons,
            categories: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
            factions: ['iran', 'usa', 'neutral']
          }
        })
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Weapon purchased successfully',
          data: {
            purchase: {
              purchase_id: 'mock_purchase_id',
              weapon_id: 'tank_abrams'
            },
            new_balance: 7500
          }
        })
      });

      render(
        <TestWrapper>
          <MilitaryWeaponsShop />
        </TestWrapper>
      );

      // Wait for weapons to load
      await waitFor(() => {
        expect(screen.getByText(/M1A2 Abrams/i)).toBeInTheDocument();
      });

      const purchaseButton = screen.getByText(/purchase/i);
      fireEvent.click(purchaseButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/weapon-purchases/purchase'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock_token'
            })
          })
        );
      });
    });
  });

  describe('Leaderboard Component', () => {
    test('should render leaderboard correctly', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            leaderboard: mockLeaderboard,
            total_players: 1
          }
        })
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/iran/i)).toBeInTheDocument();
    });

    test('should handle leaderboard filtering', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            leaderboard: mockLeaderboard,
            total_players: 1
          }
        })
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      // Wait for leaderboard to load
      await waitFor(() => {
        expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
      });

      const factionFilter = screen.getByText(/iran/i);
      fireEvent.click(factionFilter);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/leaderboard/faction/iran'),
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });
  });

  describe('Telegram Integration', () => {
    test('should initialize Telegram WebApp correctly', () => {
      // Mock Telegram WebApp
      global.window = {
        Telegram: {
          WebApp: {
            ready: jest.fn(),
            expand: jest.fn(),
            setHeaderColor: jest.fn(),
            setBackgroundColor: jest.fn(),
            enableClosingConfirmation: jest.fn(),
            MainButton: {
              setText: jest.fn(),
              color: jest.fn(),
              textColor: jest.fn(),
              show: jest.fn(),
              hide: jest.fn(),
              onClick: jest.fn(),
              offClick: jest.fn()
            }
          }
        }
      };

      const { result } = renderHook(() => useTelegram());

      expect(result.current.isTelegramReady).toBe(true);
      expect(global.window.Telegram.WebApp.ready).toHaveBeenCalled();
      expect(global.window.Telegram.WebApp.expand).toHaveBeenCalled();
    });

    test('should handle haptic feedback', () => {
      global.window = {
        Telegram: {
          WebApp: {
            ready: jest.fn(),
            expand: jest.fn(),
            HapticFeedback: {
              impactOccurred: jest.fn(),
              notificationOccurred: jest.fn()
            }
          }
        }
      };

      const { result } = renderHook(() => useTelegram());

      result.current.hapticFeedback('impact');
      expect(global.window.Telegram.WebApp.HapticFeedback.impactOccurred).toHaveBeenCalledWith('medium');
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      // Should not crash and should show loading state
      expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
    });

    test('should handle 404 errors', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: 'Not found' }
        })
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    test('should render components quickly', async () => {
      const startTime = performance.now();
      
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockLeaderboard
        })
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });

    test('should handle rapid state updates', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const startTime = performance.now();
      
      // Rapidly update user state
      for (let i = 0; i < 10; i++) {
        result.current.setUser({
          ...mockUser,
          level: mockUser.level + i
        }, 'mock_token');
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(100); // Should handle updates quickly
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            weapons: mockWeapons,
            categories: ['tanks', 'missiles', 'drones', 'warships', 'aircraft'],
            factions: ['iran', 'usa', 'neutral']
          }
        })
      });

      render(
        <TestWrapper>
          <MilitaryWeaponsShop />
        </TestWrapper>
      );

      // Check for accessibility attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    test('should support keyboard navigation', async () => {
      useAuthStore.getState().setUser(mockUser, 'mock_token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            leaderboard: mockLeaderboard,
            total_players: 1
          }
        })
      });

      render(
        <TestWrapper>
          <Leaderboard />
        </TestWrapper>
      );

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      
      expect(firstButton).toHaveFocus();
    });
  });
});
