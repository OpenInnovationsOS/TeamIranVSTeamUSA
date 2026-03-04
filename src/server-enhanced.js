
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');

// Enhanced database connection
const enhancedDatabase = require('./database/enhanced-connection');

// Redis gaming cache
const gamingCache = require('./utils/redis-gaming-cache');

// Performance monitoring
const performanceMonitor = require('./monitoring/performance-monitor');

// Telegram bot and routes
const telegramBot = require('./telegram/bot');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for gaming
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// WebSocket for real-time gaming
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🎮 New player connected');
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast function for real-time updates
global.broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Routes
app.use('/api', routes);
app.use('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    game: 'Team Iran vs Team USA',
    version: '2.0.0-optimized'
  });
});

// Serve frontend
app.use(express.static('frontend/build'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔌 Initializing enhanced database connection...');
    await enhancedDatabase.initialize();
    
    console.log('🗄️ Starting Redis caching layer...');
    await gamingCache.initialize();
    await gamingCache.warmupCache();
    
    console.log('📊 Enabling performance monitoring...');
    await performanceMonitor.initialize();
    
    console.log('🤖 Starting Telegram bot...');
    await telegramBot.initialize();
    
    server.listen(PORT, () => {
      console.log('🚀 Game server started successfully!');
      console.log(`🎮 Team Iran vs Team USA is LIVE on port ${PORT}`);
      console.log('⚡ Performance optimizations active');
      console.log('📊 Real-time monitoring enabled');
      console.log('🗄️ Redis caching operational');
      console.log('🎮 Game ready for users!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await enhancedDatabase.close();
  await gamingCache.close();
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

// Start the server
startServer();
