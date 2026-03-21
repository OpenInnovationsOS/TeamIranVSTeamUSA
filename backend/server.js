const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.post('/api/game/faction/select', (req, res) => {
  const { faction } = req.body;
  
  if (!faction || !['iran', 'usa'].includes(faction)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid faction selection' }
    });
  }
  
  res.json({
    success: true,
    message: `Successfully joined Team ${faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!`,
    user: {
      id: 1,
      telegram_id: 123456,
      username: 'Player1',
      first_name: 'Test',
      last_name: 'User',
      faction: faction,
      stg_balance: 1000,
      level: 1
    }
  });
});

app.post('/api/register', (req, res) => {
  const { username, faction } = req.body;
  
  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        username: username,
        faction: faction,
        stg_balance: 1000,
        level: 1
      },
      token: 'mock_token_' + Math.random().toString(36).substr(2, 9)
    }
  });
});

app.post('/api/auth/telegram', (req, res) => {
  const { telegram_id, username, first_name, last_name } = req.body;
  
  res.json({
    success: true,
    user: {
      id: 1,
      telegram_id: telegram_id,
      username: username || 'Player1',
      first_name: first_name,
      last_name: last_name,
      faction: 'iran',
      stg_balance: 1000,
      level: 1
    },
    token: 'mock_token_' + Math.random().toString(36).substr(2, 9)
  });
});

app.get('/api/auth/verify', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      telegram_id: 123456,
      username: 'Player1',
      faction: 'iran',
      stg_balance: 1000,
      level: 1
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available:`);
  console.log(`   POST /api/game/faction/select`);
  console.log(`   POST /api/register`);
  console.log(`   POST /api/auth/telegram`);
  console.log(`   GET  /api/auth/verify`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/test`);
});

module.exports = app;
