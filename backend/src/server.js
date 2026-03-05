require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const WebSocket = require('ws');
const path = require('path');

// Import routes
const userRoutes = require('./routes/users');
const battleRoutes = require('./routes/battles');
const monetizationRoutes = require('./routes/monetization');
const adminRoutes = require('./routes/admin');
const adminMonetizationRoutes = require('./routes/admin-monetization');

// Import database connection
const connectDB = require('./config/database');

// Import WebSocket server
const setupWebSocket = require('./websocket/server');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminMonetizationRoutes);

// WebSocket server
const server = require('http').createServer(app);
setupWebSocket(server);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Team Iran vs USA Backend running on port ${PORT}`);
  console.log(`📊 API available at: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🗄️ MongoDB connection: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
});

module.exports = app;
