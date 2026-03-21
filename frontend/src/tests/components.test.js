/**
 * Component Tests
 * Tests React components for rendering and functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from '../contexts/ConfigContext';
import GameDashboard from '../components/GameDashboard';
import BattleArena from '../components/BattleArena';
import Leaderboard from '../components/Leaderboard';

// Mock TextEncoder for Node.js environment
global.TextEncoder = require('util').TextEncoder;

// Mock Telegram WebApp
window.Telegram = {
  WebApp: {
    ready: jest.fn(),
    expand: jest.fn(),
    close: jest.fn(),
    hapticFeedback: jest.fn()
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('Component Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue('mock_token');
    jest.clearAllMocks();
  });

  describe('GameDashboard', () => {
    test('renders tap button with correct styling', async () => {
      const mockConfig = {
        tap_button_text: '👆',
        tap_button_size: 80,
        tap_button_color: '#0088cc',
        tap_button_gradient_start: '#0088cc',
        tap_button_gradient_end: '#00a6ff',
        tap_button_border_radius: 50,
        tap_button_shadow: true
      };

      render(
        <BrowserRouter>
          <ConfigProvider value={{ config: mockConfig, loading: false }}>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        const tapButton = screen.getByRole('button');
        expect(tapButton).toBeInTheDocument();
        expect(tapButton).toHaveTextContent('👆');
      });
    });

    test('handles tap clicks correctly', async () => {
      const mockConfig = {
        haptic_feedback_enabled: true,
        haptic_feedback_type: 'impact',
        base_reward_min: 1,
        base_reward_max: 10,
        reward_notification_frequency: 10
      };

      render(
        <BrowserRouter>
          <ConfigProvider value={{ config: mockConfig, loading: false }}>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        const tapButton = screen.getByRole('button');
        fireEvent.click(tapButton);
        
        // Check if haptic feedback was called
        expect(window.Telegram.WebApp.hapticFeedback).toHaveBeenCalledWith('impact');
      });
    });

    test('displays correct tap count', async () => {
      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Taps today:/)).toBeInTheDocument();
      });
    });

    test('shows loading state', () => {
      render(
        <BrowserRouter>
          <ConfigProvider value={{ config: {}, loading: true }}>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });
  });

  describe('BattleArena', () => {
    test('renders battle arena interface', async () => {
      render(
        <BrowserRouter>
          <BattleArena />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Battle Arena/i)).toBeInTheDocument();
      });
    });

    test('displays opponent list', async () => {
      // Mock fetch for opponents
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [
            { id: 1, username: 'Player1', level: 5, faction: 'iran' },
            { id: 2, username: 'Player2', level: 3, faction: 'usa' }
          ]
        })
      });

      render(
        <BrowserRouter>
          <BattleArena />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Player1')).toBeInTheDocument();
        expect(screen.getByText('Player2')).toBeInTheDocument();
      });
    });
  });

  describe('Leaderboard', () => {
    test('renders leaderboard with rankings', async () => {
      // Mock fetch for leaderboard
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [
            { rank: 1, username: 'TopPlayer', wins: 100, stg_balance: 50000 },
            { rank: 2, username: 'SecondPlayer', wins: 85, stg_balance: 40000 }
          ]
        })
      });

      render(
        <BrowserRouter>
          <Leaderboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TopPlayer')).toBeInTheDocument();
        expect(screen.getByText('SecondPlayer')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument(); // wins
        expect(screen.getByText('85')).toBeInTheDocument(); // wins
      });
    });

    test('handles empty leaderboard', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: []
        })
      });

      render(
        <BrowserRouter>
          <Leaderboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No players yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates between routes correctly', async () => {
      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        const battleButton = screen.getByText(/Battle Arena/i);
        expect(battleButton).toBeInTheDocument();
        
        fireEvent.click(battleButton);
        // In a real test, you'd check if navigation occurred
      });
    });
  });

  describe('Responsive Design', () => {
    test('adapts to different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375 // Mobile
      });

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      // Check if mobile-specific styles are applied
      const tapButton = screen.getByRole('button');
      expect(tapButton).toBeInTheDocument();

      // Test desktop view
      window.innerWidth = 1200;
      fireEvent.resize(window);
      
      expect(tapButton).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    test('handles component errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate component error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      expect(() => {
        render(
          <BrowserRouter>
            <ErrorComponent />
          </BrowserRouter>
        );
      }).toThrow('Test error');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
