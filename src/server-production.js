#!/usr/bin/env node

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const os = require('os');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
const winston = require('winston');
const { Pool } = require('pg');
const Redis = require('ioredis');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Environment configuration
const EnvironmentManager = require('./env-config');
const env = new EnvironmentManager();

// Enhanced logging system
const logger = winston.createLogger({
  level: env.get('LOG_LEVEL') || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: env.get('APP_NAME'),
    environment: env.get('NODE_ENV'),
    pid: process.pid,
    worker: process.env.WORKER_ID || 'master'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: env.get('LOG_FILE') || 'logs/app.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Database connections
let db = null;
let redis = null;
let wsServer = null;
const wsClients = new Map();

// Initialize database connection
async function initializeDatabase() {
  try {
    const dbConfig = env.get('DB_CONFIG');
    
    if (dbConfig.type === 'postgres') {
      db = new Pool(dbConfig);
      await db.query('SELECT NOW()');
      logger.info('✅ PostgreSQL connection established');
    }
    
    return db;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Create Express app
function createApp() {
  const app = express();
  
  // Security middleware
  if (env.get('HELMET_ENABLED_BOOL')) {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"]
        }
      }
    }));
  }
  
  // CORS configuration
  app.use(cors({
    origin: env.get('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Admin-Key']
  }));
  
  // Compression
  if (env.get('COMPRESSION_ENABLED_BOOL')) {
    app.use(compression({
      level: parseInt(env.get('COMPRESSION_LEVEL')) || 6,
      threshold: 1024
    }));
  }
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: env.get('RATE_LIMIT_CONFIG').windowMs,
    max: env.get('RATE_LIMIT_CONFIG').max,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  app.use('/api', limiter);
  
  // Request logging
  if (env.get('IS_PRODUCTION')) {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));
  }
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Static files
  const staticPath = path.join(__dirname, '..', 'dist', 'static');
  app.use('/static', express.static(staticPath, {
    maxAge: env.get('IS_PRODUCTION') ? 365 * 24 * 60 * 60 * 1000 : 0,
    etag: true,
    lastModified: true
  }));
  
  // Health check endpoint
  app.get(env.get('HEALTH_CHECK_ENDPOINT'), (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: env.get('NODE_ENV'),
      worker: process.env.WORKER_ID || 'master'
    };
    
    res.status(200).json(health);
  });
  
  // API routes
  app.use('/api', require('../src/server-simple'));
  
  // Serve React app for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
  
  return app;
}

// Main server function
async function startServer() {
  logger.info('🚀 Starting production server...');
  
  try {
    await initializeDatabase();
    
    const app = createApp();
    
    const port = env.get('PORT_NUM') || 3000;
    const host = env.get('HOST') || '0.0.0.0';
    
    const server = http.createServer(app);
    
    server.listen(port, host, () => {
      logger.info(`🌐 Server listening on ${host}:${port}`);
      logger.info(`📊 Environment: ${env.get('NODE_ENV')}`);
      logger.info(`👷 Worker: ${process.env.WORKER_ID || 'master'}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${port} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
    // Handle process signals
    process.on('SIGTERM', () => {
      logger.info('🔄 Received SIGTERM, shutting down gracefully');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('🔄 Received SIGINT, shutting down gracefully');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    });
    
    module.exports.server = server;
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  logger,
  env,
  db: () => db
};
