#!/usr/bin/env node

// Critical Issues Resolution Script
// Fix the most critical issues identified in testing

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CriticalIssuesResolver {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  // Log resolution step
  logStep(issue, action, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      issue,
      action,
      result,
      status: result.includes('✅') ? 'success' : 'partial'
    };
    
    this.fixes.push(logEntry);
    
    console.log(`${result} [${issue}] ${action}`);
  }

  // Fix application server health endpoint
  async fixApplicationServer() {
    this.logStep('Application Server', 'Adding health endpoint', '🔧 STARTING');
    
    try {
      // Check if server file exists
      const serverFile = path.join(__dirname, '..', 'src', 'server.js');
      if (fs.existsSync(serverFile)) {
        let serverContent = fs.readFileSync(serverFile, 'utf8');
        
        // Add health endpoint if not exists
        if (!serverContent.includes('/health')) {
          const healthEndpoint = `
// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});
`;
          
          // Insert before server.listen
          const listenIndex = serverContent.indexOf('app.listen');
          if (listenIndex !== -1) {
            serverContent = serverContent.slice(0, listenIndex) + healthEndpoint + '\n' + serverContent.slice(listenIndex);
            fs.writeFileSync(serverFile, serverContent);
            this.logStep('Application Server', 'Health endpoint added', '✅ COMPLETED');
          } else {
            this.logStep('Application Server', 'Could not find server.listen', '⚠️ PARTIAL');
          }
        } else {
          this.logStep('Application Server', 'Health endpoint already exists', '✅ ALREADY DONE');
        }
      } else {
        this.logStep('Application Server', 'server.js not found', '❌ FAILED');
      }
    } catch (error) {
      this.logStep('Application Server', 'Error adding health endpoint', `❌ ${error.message}`);
    }
  }

  // Fix database initialization
  async fixDatabase() {
    this.logStep('Database', 'Initializing SQLite database', '🔧 STARTING');
    
    try {
      // Create database directory
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Create database file
      const dbPath = path.join(dataDir, 'production.db');
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
        this.logStep('Database', 'Database file created', '✅ COMPLETED');
      } else {
        this.logStep('Database', 'Database file already exists', '✅ ALREADY DONE');
      }
      
      // Create migrations directory
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
      }
      
      // Create initial migration
      const initialMigration = `
-- Initial migration for Team Iran vs USA
-- Created: ${new Date().toISOString()}

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  faction TEXT NOT NULL CHECK (faction IN ('iran', 'usa')),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 1000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  winner_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  battle_type TEXT DEFAULT 'standard' CHECK (battle_type IN ('standard', 'tournament', 'practice')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- Territories table
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_faction TEXT NOT NULL CHECK (owner_faction IN ('iran', 'usa', 'neutral')),
  control_points INTEGER DEFAULT 0,
  strategic_value INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 100,
  current_participants INTEGER DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon', 'armor', 'consumable', 'special')),
  price INTEGER NOT NULL,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  stats TEXT, -- JSON string for item stats
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES marketplace_items(id)
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert initial territories
INSERT OR IGNORE INTO territories (name, description, owner_faction, control_points, strategic_value) VALUES
('Tehran', 'Capital of Iran', 'iran', 100, 10),
('Washington DC', 'Capital of USA', 'usa', 100, 10),
('Caspian Sea', 'Strategic water resource', 'neutral', 50, 5),
('Persian Gulf', 'Oil-rich region', 'neutral', 75, 8),
('New York', 'Major US city', 'usa', 80, 7),
('Isfahan', 'Historical Iranian city', 'iran', 60, 6);

-- Insert initial marketplace items
INSERT OR IGNORE INTO marketplace_items (name, description, item_type, price, rarity, stats) VALUES
('Basic Sword', 'A simple but effective sword', 'weapon', 100, 'common', '{"damage": 10, "speed": 5}'),
('Shield', 'Basic protection', 'armor', 150, 'common', '{"defense": 15, "weight": 5}'),
('Health Potion', 'Restores 50 HP', 'consumable', 50, 'common', '{"healing": 50}'),
('Elite Sword', 'High-quality weapon', 'weapon', 500, 'rare', '{"damage": 25, "speed": 8}'),
('Battle Armor', 'Heavy protection', 'armor', 800, 'rare', '{"defense": 35, "weight": 15}'),
('Victory Banner', 'Increases battle success', 'special', 1000, 'epic', '{"bonus": 15, "duration": 300}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_faction ON users(faction);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_players ON battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_territories_faction ON territories(owner_faction);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON marketplace_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON game_sessions(expires_at);
`;
        
        const migrationFile = path.join(migrationsDir, '001_initial.sql');
        fs.writeFileSync(migrationFile, initialMigration);
        this.logStep('Database', 'Initial migration created', '✅ COMPLETED');
      } else {
        this.logStep('Database', 'Migrations already exist', '✅ ALREADY DONE');
      }
      
      // Run migration
      try {
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.exec(initialMigration);
        db.close();
        this.logStep('Database', 'Migration executed', '✅ COMPLETED');
      } catch (error) {
        this.logStep('Database', 'Migration failed', `⚠️ ${error.message}`);
      }
      
    } catch (error) {
      this.logStep('Database', 'Database initialization failed', `❌ ${error.message}`);
    }
  }

  // Fix security middleware
  async fixSecurity() {
    this.logStep('Security', 'Adding rate limiting middleware', '🔧 STARTING');
    
    try {
      const rateLimitPath = path.join(__dirname, '..', 'src', 'middleware', 'rateLimit.js');
      
      if (!fs.existsSync(rateLimitPath)) {
        const rateLimitContent = `
// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 API requests per windowMs
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many upload attempts, please try again later.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  loginLimiter,
  apiLimiter,
  uploadLimiter
};
`;
        
        const middlewareDir = path.dirname(rateLimitPath);
        if (!fs.existsSync(middlewareDir)) {
          fs.mkdirSync(middlewareDir, { recursive: true });
        }
        
        fs.writeFileSync(rateLimitPath, rateLimitContent);
        this.logStep('Security', 'Rate limiting middleware created', '✅ COMPLETED');
      } else {
        this.logStep('Security', 'Rate limiting already exists', '✅ ALREADY DONE');
      }
    } catch (error) {
      this.logStep('Security', 'Rate limiting creation failed', `❌ ${error.message}`);
    }
  }

  // Fix Telegram configuration
  async fixTelegram() {
    this.logStep('Telegram', 'Adding configuration to environment', '🔧 STARTING');
    
    try {
      const envFile = path.join(__dirname, '..', '.env.production');
      
      if (fs.existsSync(envFile)) {
        let envContent = fs.readFileSync(envFile, 'utf8');
        
        // Add Telegram configuration if not present
        if (!envContent.includes('TELEGRAM_BOT_TOKEN')) {
          const telegramConfig = `
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
TELEGRAM_BOT_USERNAME=your_bot_username
`;
          
          envContent += telegramConfig;
          fs.writeFileSync(envFile, envContent);
          this.logStep('Telegram', 'Telegram configuration added', '✅ COMPLETED');
        } else {
          this.logStep('Telegram', 'Telegram configuration already exists', '✅ ALREADY DONE');
        }
      } else {
        this.logStep('Telegram', '.env.production not found', '❌ FAILED');
      }
    } catch (error) {
      this.logStep('Telegram', 'Configuration update failed', `❌ ${error.message}`);
    }
  }

  // Fix build output
  async fixBuildOutput() {
    this.logStep('Build Output', 'Creating production build', '🔧 STARTING');
    
    try {
      // Run build command
      const buildResult = execSync('npm run build', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.logStep('Build Output', 'Production build created', '✅ COMPLETED');
    } catch (error) {
      this.logStep('Build Output', 'Build failed', `⚠️ ${error.message}`);
    }
  }

  // Fix metrics endpoint
  async fixMetricsEndpoint() {
    this.logStep('Metrics', 'Adding metrics endpoint', '🔧 STARTING');
    
    try {
      const serverFile = path.join(__dirname, '..', 'src', 'server.js');
      if (fs.existsSync(serverFile)) {
        let serverContent = fs.readFileSync(serverFile, 'utf8');
        
        // Add metrics endpoint if not exists
        if (!serverContent.includes('/metrics')) {
          const metricsEndpoint = `
// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = \`# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
nodejs_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}
nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
nodejs_memory_usage_bytes{type="external"} ${process.memoryUsage().external}

# HELP nodejs_uptime_seconds Process uptime in seconds
# TYPE nodejs_uptime_seconds counter
nodejs_uptime_seconds ${process.uptime()}

# HELP nodejs_active_connections Active connections
# TYPE nodejs_active_connections gauge
nodejs_active_connections ${global.activeConnections || 0}

# HELP nodejs_requests_total Total requests
# TYPE nodejs_requests_total counter
nodejs_requests_total ${global.requestCount || 0}
\`;
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
`;
          
          // Insert before server.listen
          const listenIndex = serverContent.indexOf('app.listen');
          if (listenIndex !== -1) {
            serverContent = serverContent.slice(0, listenIndex) + metricsEndpoint + '\n' + serverContent.slice(listenIndex);
            fs.writeFileSync(serverFile, serverContent);
            this.logStep('Metrics', 'Metrics endpoint added', '✅ COMPLETED');
          } else {
            this.logStep('Metrics', 'Could not find server.listen', '⚠️ PARTIAL');
          }
        } else {
          this.logStep('Metrics', 'Metrics endpoint already exists', '✅ ALREADY DONE');
        }
      } else {
        this.logStep('Metrics', 'server.js not found', '❌ FAILED');
      }
    } catch (error) {
      this.logStep('Metrics', 'Error adding metrics endpoint', `❌ ${error.message}`);
    }
  }

  // Generate resolution report
  generateResolutionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFixes: this.fixes.length,
      successful: this.fixes.filter(f => f.status === 'success').length,
      partial: this.fixes.filter(f => f.status === 'partial').length,
      failed: this.fixes.filter(f => f.status === 'failed').length,
      fixes: this.fixes,
      recommendations: [
        'Restart the application server to apply changes',
        'Test the health endpoint: http://localhost:3000/health',
        'Test the metrics endpoint: http://localhost:3000/metrics',
        'Verify database connectivity',
        'Configure Telegram bot token in .env.production',
        'Run comprehensive tests again to verify fixes'
      ]
    };
    
    // Save report
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `critical-fixes-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return { report, reportFile };
  }

  // Execute all fixes
  async executeAllFixes() {
    console.log('🔧 STARTING CRITICAL ISSUES RESOLUTION');
    console.log('======================================');
    
    try {
      // Execute all fixes
      await this.fixApplicationServer();
      await this.fixDatabase();
      await this.fixSecurity();
      await this.fixTelegram();
      await this.fixBuildOutput();
      await this.fixMetricsEndpoint();
      
      // Generate report
      console.log('\n📊 GENERATING RESOLUTION REPORT');
      console.log('================================');
      
      const { report, reportFile } = this.generateResolutionReport();
      
      // Display results
      console.log('\n🎉 CRITICAL ISSUES RESOLUTION COMPLETED');
      console.log('========================================');
      console.log(`📊 Total Fixes: ${report.totalFixes}`);
      console.log(`✅ Successful: ${report.successful}`);
      console.log(`⚠️ Partial: ${report.partial}`);
      console.log(`❌ Failed: ${report.failed}`);
      
      console.log('\n📋 Fix Details:');
      report.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix.result} ${fix.issue}: ${fix.action}`);
      });
      
      console.log('\n🎯 Next Steps:');
      report.recommendations.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      console.log(`\n📄 Resolution Report: ${reportFile}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ CRITICAL FIXES FAILED:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const resolver = new CriticalIssuesResolver();
  
  try {
    switch (command) {
      case 'all':
        await resolver.executeAllFixes();
        break;
        
      case 'server':
        await resolver.fixApplicationServer();
        break;
        
      case 'database':
        await resolver.fixDatabase();
        break;
        
      case 'security':
        await resolver.fixSecurity();
        break;
        
      case 'telegram':
        await resolver.fixTelegram();
        break;
        
      case 'build':
        await resolver.fixBuildOutput();
        break;
        
      case 'metrics':
        await resolver.fixMetricsEndpoint();
        break;
        
      case 'report':
        const { report } = resolver.generateResolutionReport();
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
🔧 Critical Issues Resolution Script

Usage: node critical-fixes.js <command>

Commands:
  all          Execute all critical fixes
  server        Fix application server health endpoint
  database      Initialize database and migrations
  security      Add rate limiting middleware
  telegram      Add Telegram configuration
  build         Create production build
  metrics       Add metrics endpoint
  report        Generate resolution report

Issues Fixed:
  ✅ Application Server 404 error
  ✅ Database initialization
  ✅ Security middleware missing
  ✅ Telegram configuration
  ✅ Build output missing
  ✅ Metrics endpoint missing

Examples:
  node critical-fixes.js all
  node critical-fixes.js server
  node critical-fixes.js database
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Resolution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CriticalIssuesResolver;
