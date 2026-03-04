import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

import { useAuthStore } from './stores/authStore';
import { useTelegram } from './hooks/useTelegram';
import LoadingScreen from './components/LoadingScreen';
import FactionSelection from './components/FactionSelection';
import GameDashboard from './components/GameDashboard';
import BattleArena from './components/BattleArena';
import Leaderboard from './components/Leaderboard';
import TerritoryMap from './components/TerritoryMap';
import DailyMissions from './components/DailyMissions';
import Profile from './components/Profile';
import Navigation from './components/Navigation';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
    color: #ffffff;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

// Theme configuration
const theme = {
  colors: {
    primary: '#0088cc',
    secondary: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    danger: '#ff6b6b',
    dark: '#0a0a0a',
    light: '#ffffff',
    gray: '#6c757d',
    iran: '#00a652', // Green for Iran
    usa: '#002868',   // Blue for USA
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const MainContent = styled.main`
  flex: 1;
  padding-bottom: 70px; // Space for navigation
  overflow-y: auto;
`;

function App() {
  const { user, token, isLoading, initializeAuth } = useAuthStore();
  const { telegram, isTelegramReady } = useTelegram();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#0a0a0a');
      window.Telegram.WebApp.setBackgroundColor('#0a0a0a');
    }

    // Initialize authentication
    initializeAuth();
  }, [initializeAuth]);

  // Show loading screen while initializing
  if (isLoading || !isTelegramReady) {
    return <LoadingScreen />;
  }

  // Redirect to faction selection if user hasn't chosen a faction
  if (user && !user.faction) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <GlobalStyle />
          <AppContainer>
            <FactionSelection />
          </AppContainer>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a2e',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <GlobalStyle />
        <AppContainer>
          <MainContent>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<GameDashboard />} />
              <Route path="/battle" element={<BattleArena />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/territory" element={<TerritoryMap />} />
              <Route path="/missions" element={<DailyMissions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainContent>
          <Navigation currentView={currentView} setCurrentView={setCurrentView} />
        </AppContainer>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a2e',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
