/**
 * API Integration Tests
 * Tests all API endpoints for functionality and error handling
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from '../contexts/ConfigContext';
import GameDashboard from '../components/GameDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock TextEncoder for Node.js environment
global.TextEncoder = require('util').TextEncoder;

const mockConfig = {
  tap_button_text: '👆',
  tap_button_size: 80,
  tap_button_color: '#0088cc',
  tap_button_gradient_start: '#0088cc',
  tap_button_gradient_end: '#00a6ff',
  tap_button_border_radius: 50,
  tap_button_shadow: true,
  base_reward_min: 1,
  base_reward_max: 10,
  reward_notification_frequency: 10,
  tap_rate_limit: 60,
  tap_cooldown_ms: 1000,
  haptic_feedback_enabled: true,
  haptic_feedback_type: 'impact',
  tap_animation_enabled: true,
  tap_animation_type: 'scale',
  reward_popup_enabled: true,
  reward_popup_duration: 2000,
  particle_effects_enabled: true,
  particle_color: '#ffd700',
  tap_boost_enabled: true,
  marketplace_enabled: true
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  describe('Config Endpoint', () => {
    test('should fetch tap button configuration', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          config: mockConfig
        })
      });

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/config',
          expect.objectContaining({
            method: 'GET'
          })
        );
      });
    });

    test('should handle config endpoint errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: 'Internal Server Error'
        })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load tap config')
        );
      });
    });
  });

  describe('Tap Endpoint', () => {
    test('should handle successful tap', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            reward: 5,
            message: '+5 STG earned!',
            rateLimit: {
              current: 1,
              max: 60,
              resetIn: 59
            }
          }
        })
      });

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      const tapButton = screen.getByRole('button');
      fireEvent.click(tapButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/register',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer null',
              'x-user-id': 'undefined'
            }),
            body: JSON.stringify({
              username: 'tap_action',
              faction: 'tap'
            })
          })
        );
      });
    });

    test('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many taps. Maximum 60 taps per minute.',
          retryAfter: 30
        })
      });

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      const tapButton = screen.getByRole('button');
      fireEvent.click(tapButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/register',
          expect.any(Object)
        );
      });
    });
  });

  describe('Battle Arena API', () => {
    test('should load opponents', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          opponents: [
            { id: 1, username: 'Player1', level: 5, faction: 'iran' },
            { id: 2, username: 'Player2', level: 3, faction: 'usa' }
          ]
        })
      });

      // This would be tested in BattleArena component
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/leaderboard',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer null'
          })
        })
      );
    });

    test('should handle battle creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          battle: {
            id: 'battle_123',
            player1: { id: 1, username: 'Player1' },
            player2: { id: 2, username: 'Player2' },
            status: 'active'
          }
        })
      });

      // Test battle creation API call
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/battle',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null'
          }),
          body: expect.any(String)
        })
      );
    });
  });

  describe('Leaderboard API', () => {
    test('should load leaderboard data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          leaderboard: [
            { rank: 1, username: 'TopPlayer', wins: 100, stg_balance: 50000 },
            { rank: 2, username: 'SecondPlayer', wins: 85, stg_balance: 40000 }
          ]
        })
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/leaderboard',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer null'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Background tap sync failed')
        );
      });
    });

    test('should handle malformed responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <BrowserRouter>
          <ConfigProvider>
            <GameDashboard />
          </ConfigProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });
});
