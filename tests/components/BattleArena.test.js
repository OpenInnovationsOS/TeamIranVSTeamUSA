import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import BattleArena from '../../src/components/BattleArena';
import { createMockUser, createMockBattle } from '../setup';

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock API responses
const mockOpponents = [
  createMockUser({
    id: 'opponent-1',
    username: 'Opponent1',
    faction: 'usa',
    level: 5,
    stg_balance: 2000,
    stats: { wins: 10, losses: 5 }
  }),
  createMockUser({
    id: 'opponent-2',
    username: 'Opponent2',
    faction: 'usa',
    level: 3,
    stg_balance: 1500,
    stats: { wins: 5, losses: 3 }
  })
];

const mockBattleHistory = [
  createMockBattle({
    id: 'battle-1',
    attacker_id: 'test-user-123',
    defender_id: 'opponent-1',
    result: 'win',
    stg_wager: 100,
    stg_reward: 200
  }),
  createMockBattle({
    id: 'battle-2',
    attacker_id: 'test-user-123',
    defender_id: 'opponent-2',
    result: 'lose',
    stg_wager: 50,
    stg_reward: 0
  })
];

describe('BattleArena Component', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock localStorage
    localStorage.setItem('auth_token', 'mock-token');
    localStorage.setItem('user_data', JSON.stringify(createMockUser()));
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    test('renders battle arena title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      expect(screen.getByText('⚔️ Battle Arena')).toBeInTheDocument();
    });

    test('renders opponent selection section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Select Opponent')).toBeInTheDocument();
      });
    });

    test('renders wager input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter wager amount')).toBeInTheDocument();
      });
    });

    test('renders battle button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('⚔️ Start Battle')).toBeInTheDocument();
      });
    });
  });

  describe('Opponent Loading', () => {
    test('displays loading state while fetching opponents', () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      expect(screen.getByText('Loading opponents...')).toBeInTheDocument();
    });

    test('displays error message when opponent fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load opponents/)).toBeInTheDocument();
      });
    });
  });

  describe('Opponent Selection', () => {
    test('displays fetched opponents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Opponent1')).toBeInTheDocument();
        expect(screen.getByText('Opponent2')).toBeInTheDocument();
      });
    });

    test('allows opponent selection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const opponentCard = screen.getByText('Opponent1').closest('[data-testid="opponent-card"]');
        fireEvent.click(opponentCard);
        
        expect(opponentCard).toHaveClass('selected');
      });
    });

    test('filters out current user from opponents list', async () => {
      const allUsers = [
        createMockUser({ id: 'test-user-123', username: 'CurrentUser' }),
        ...mockOpponents
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: allUsers })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('CurrentUser')).not.toBeInTheDocument();
        expect(screen.getByText('Opponent1')).toBeInTheDocument();
        expect(screen.getByText('Opponent2')).toBeInTheDocument();
      });
    });
  });

  describe('Battle Initiation', () => {
    test('initiates battle with selected opponent and wager', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, users: mockOpponents })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            result: 'win',
            reward: 200,
            battle: createMockBattle()
          })
        });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      // Wait for opponents to load
      await waitFor(() => {
        expect(screen.getByText('Opponent1')).toBeInTheDocument();
      });

      // Select opponent
      const opponentCard = screen.getByText('Opponent1').closest('[data-testid="opponent-card"]');
      fireEvent.click(opponentCard);

      // Enter wager
      const wagerInput = screen.getByPlaceholderText('Enter wager amount');
      fireEvent.change(wagerInput, { target: { value: '100' } });

      // Start battle
      const battleButton = screen.getByText('⚔️ Start Battle');
      fireEvent.click(battleButton);

      // Verify battle API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/battle'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
              'x-user-id': 'test-user-123'
            }),
            body: expect.stringContaining('opponent_id=opponent-1')
          })
        );
      });
    });

    test('displays loading state during battle', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, users: mockOpponents })
        })
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const opponentCard = screen.getByText('Opponent1').closest('[data-testid="opponent-card"]');
        fireEvent.click(opponentCard);
      });

      const wagerInput = screen.getByPlaceholderText('Enter wager amount');
      fireEvent.change(wagerInput, { target: { value: '100' } });

      const battleButton = screen.getByText('⚔️ Start Battle');
      fireEvent.click(battleButton);

      expect(screen.getByText('Initiating battle...')).toBeInTheDocument();
    });

    test('handles battle error gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, users: mockOpponents })
        })
        .mockRejectedValueOnce(new Error('Battle failed'));

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const opponentCard = screen.getByText('Opponent1').closest('[data-testid="opponent-card"]');
        fireEvent.click(opponentCard);
      });

      const wagerInput = screen.getByPlaceholderText('Enter wager amount');
      fireEvent.change(wagerInput, { target: { value: '100' } });

      const battleButton = screen.getByText('⚔️ Start Battle');
      fireEvent.click(battleButton);

      await waitFor(() => {
        expect(screen.getByText(/Battle failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Battle History', () => {
    test('displays battle history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Battle History')).toBeInTheDocument();
      });
    });

    test('shows empty state when no battles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No battles fought yet')).toBeInTheDocument();
      });
    });

    test('displays battle results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Battle History')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates minimum wager amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const opponentCard = screen.getByText('Opponent1').closest('[data-testid="opponent-card"]');
        fireEvent.click(opponentCard);
      });

      const wagerInput = screen.getByPlaceholderText('Enter wager amount');
      fireEvent.change(wagerInput, { target: { value: '50' } });

      const battleButton = screen.getByText('⚔️ Start Battle');
      fireEvent.click(battleButton);

      await waitFor(() => {
        expect(screen.getByText('Minimum wager is 100 STG')).toBeInTheDocument();
      });
    });

    test('validates opponent selection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const wagerInput = screen.getByPlaceholderText('Enter wager amount');
        fireEvent.change(wagerInput, { target: { value: '100' } });

        const battleButton = screen.getByText('⚔️ Start Battle');
        fireEvent.click(battleButton);

        expect(screen.getByText('Please select an opponent')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('⚔️ Battle Arena')).toBeInTheDocument();
      });
    });

    test('renders correctly on desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('⚔️ Battle Arena')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const battleButton = screen.getByText('⚔️ Start Battle');
        expect(battleButton).toHaveAttribute('aria-label');
      });
    });

    test('is keyboard navigable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, users: mockOpponents })
      });

      render(
        <TestWrapper>
          <BattleArena />
        </TestWrapper>
      );

      await waitFor(() => {
        const wagerInput = screen.getByPlaceholderText('Enter wager amount');
        wagerInput.focus();
        
        expect(document.activeElement).toBe(wagerInput);
      });
    });
  });
});
