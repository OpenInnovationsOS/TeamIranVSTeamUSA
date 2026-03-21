#!/usr/bin/env node

// Quick Critical Issues Fix
// Fast resolution of the most critical issues

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QuickFixer {
  constructor() {
    this.fixes = [];
  }

  logFix(issue, result, details = '') {
    const fix = {
      timestamp: new Date().toISOString(),
      issue,
      result,
      details
    };
    
    this.fixes.push(fix);
    
    const icon = result.includes('✅') ? '✅' : 
                 result.includes('⚠️') ? '⚠️' : '❌';
    
    console.log(`${icon} ${issue}: ${details}`);
  }

  // Fix application server health endpoint
  fixHealthEndpoint() {
    try {
      const serverFile = path.join(__dirname, '..', 'src', 'server.js');
      
      if (fs.existsSync(serverFile)) {
        let content = fs.readFileSync(serverFile, 'utf8');
        
        if (!content.includes('/health')) {
          const healthEndpoint = `
// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
`;
          
          const listenIndex = content.indexOf('app.listen');
          if (listenIndex !== -1) {
            content = content.slice(0, listenIndex) + healthEndpoint + '\n' + content.slice(listenIndex);
            fs.writeFileSync(serverFile, content);
            this.logFix('Health Endpoint', '✅ FIXED', 'Added /health endpoint to server.js');
          } else {
            this.logFix('Health Endpoint', '⚠️ PARTIAL', 'Could not find server.listen');
          }
        } else {
          this.logFix('Health Endpoint', '✅ ALREADY EXISTS', 'Health endpoint already present');
        }
      } else {
        this.logFix('Health Endpoint', '❌ FAILED', 'server.js not found');
      }
    } catch (error) {
      this.logFix('Health Endpoint', '❌ FAILED', error.message);
    }
  }

  // Create basic database
  createDatabase() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const dbPath = path.join(dataDir, 'production.db');
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
        this.logFix('Database', '✅ CREATED', 'SQLite database file created');
      } else {
        this.logFix('Database', '✅ ALREADY EXISTS', 'Database file already present');
      }
    } catch (error) {
      this.logFix('Database', '❌ FAILED', error.message);
    }
  }

  // Create rate limiting middleware
  createRateLimit() {
    try {
      const rateLimitPath = path.join(__dirname, '..', 'src', 'middleware', 'rateLimit.js');
      const middlewareDir = path.dirname(rateLimitPath);
      
      if (!fs.existsSync(middlewareDir)) {
        fs.mkdirSync(middlewareDir, { recursive: true });
      }
      
      if (!fs.existsSync(rateLimitPath)) {
        const content = `
// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter };
`;
        
        fs.writeFileSync(rateLimitPath, content);
        this.logFix('Rate Limiting', '✅ CREATED', 'Rate limiting middleware created');
      } else {
        this.logFix('Rate Limiting', '✅ ALREADY EXISTS', 'Rate limiting already present');
      }
    } catch (error) {
      this.logFix('Rate Limiting', '❌ FAILED', error.message);
    }
  }

  // Add Telegram config to environment
  addTelegramConfig() {
    try {
      const envFile = path.join(__dirname, '..', '.env.production');
      
      if (fs.existsSync(envFile)) {
        let content = fs.readFileSync(envFile, 'utf8');
        
        if (!content.includes('TELEGRAM_BOT_TOKEN')) {
          content += '\n# Telegram Bot Configuration\nTELEGRAM_BOT_TOKEN=your_telegram_bot_token_here\nTELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook\nTELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here\n';
          fs.writeFileSync(envFile, content);
          this.logFix('Telegram Config', '✅ ADDED', 'Telegram configuration added to .env.production');
        } else {
          this.logFix('Telegram Config', '✅ ALREADY EXISTS', 'Telegram config already present');
        }
      } else {
        this.logFix('Telegram Config', '❌ FAILED', '.env.production not found');
      }
    } catch (error) {
      this.logFix('Telegram Config', '❌ FAILED', error.message);
    }
  }

  // Run build
  runBuild() {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.logFix('Build', '✅ COMPLETED', 'Production build successful');
    } catch (error) {
      this.logFix('Build', '⚠️ FAILED', `Build failed: ${error.message}`);
    }
  }

  // Add metrics endpoint
  addMetricsEndpoint() {
    try {
      const serverFile = path.join(__dirname, '..', 'src', 'server.js');
      
      if (fs.existsSync(serverFile)) {
        let content = fs.readFileSync(serverFile, 'utf8');
        
        if (!content.includes('/metrics')) {
          const metricsEndpoint = `
// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = \`# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
nodejs_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}

# HELP nodejs_uptime_seconds Process uptime in seconds
# TYPE nodejs_uptime_seconds counter
nodejs_uptime_seconds ${process.uptime()}
\`;
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
`;
          
          const listenIndex = content.indexOf('app.listen');
          if (listenIndex !== -1) {
            content = content.slice(0, listenIndex) + metricsEndpoint + '\n' + content.slice(listenIndex);
            fs.writeFileSync(serverFile, content);
            this.logFix('Metrics Endpoint', '✅ ADDED', 'Metrics endpoint added to server.js');
          } else {
            this.logFix('Metrics Endpoint', '⚠️ PARTIAL', 'Could not find server.listen');
          }
        } else {
          this.logFix('Metrics Endpoint', '✅ ALREADY EXISTS', 'Metrics endpoint already present');
        }
      } else {
        this.logFix('Metrics Endpoint', '❌ FAILED', 'server.js not found');
      }
    } catch (error) {
      this.logFix('Metrics Endpoint', '❌ FAILED', error.message);
    }
  }

  // Execute all fixes
  executeAllFixes() {
    console.log('🔧 QUICK CRITICAL FIXES');
    console.log('========================');
    
    this.fixHealthEndpoint();
    this.createDatabase();
    this.createRateLimit();
    this.addTelegramConfig();
    this.runBuild();
    this.addMetricsEndpoint();
    
    console.log('\n📊 FIX SUMMARY');
    console.log('==================');
    
    const successful = this.fixes.filter(f => f.result.includes('✅')).length;
    const partial = this.fixes.filter(f => f.result.includes('⚠️')).length;
    const failed = this.fixes.filter(f => f.result.includes('❌')).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️ Partial: ${partial}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.fixes.length}`);
    
    console.log('\n🎯 NEXT STEPS');
    console.log('===============');
    console.log('1. Restart the application server');
    console.log('2. Test health endpoint: http://localhost:3000/health');
    console.log('3. Test metrics endpoint: http://localhost:3000/metrics');
    console.log('4. Run comprehensive tests again');
    
    return {
      successful,
      partial,
      failed,
      total: this.fixes.length,
      fixes: this.fixes
    };
  }
}

// Main execution
async function main() {
  const fixer = new QuickFixer();
  fixer.executeAllFixes();
}

if (require.main === module) {
  main();
}

module.exports = QuickFixer;
