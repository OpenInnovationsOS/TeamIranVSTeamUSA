require('dotenv').config({ path: '.env.dev' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');

// Import routes
const userRoutes = require('./src/routes/users');
const battleRoutes = require('./src/routes/battles');
const monetizationRoutes = require('./src/routes/monetization');
const adminRoutes = require('./src/routes/admin');
const adminMonetizationRoutes = require('./src/routes/admin-monetization');
const weaponRoutes = require('./src/routes/weapons');

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/team-iran-vs-usa', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3000", "https://localhost:3000", "http://localhost:8080", "https://localhost:8080"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (origin.includes('t.me') || origin.includes('telegram.org')) {
      return callback(null, true);
    }
    if (origin.includes('railway.app') || origin.includes('railway.dev')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminMonetizationRoutes);
app.use('/api/weapons', weaponRoutes);

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

// Start server
const server = require('http').createServer(app);
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔫 Weapons API: http://localhost:${PORT}/api/weapons`);
  console.log(`🎮 Game ready for Team Iran vs USA!`);
});

module.exports = app;
