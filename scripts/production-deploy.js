#!/usr/bin/env node

// Complete Production Deployment Orchestrator
// End-to-end production deployment automation

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Production Deployment Configuration
const DEPLOYMENT_CONFIG = {
  environment: 'production',
  domain: process.env.PRODUCTION_DOMAIN || 'yourdomain.com',
  sslEmail: process.env.SSL_EMAIL || 'admin@yourdomain.com',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    name: process.env.DB_NAME || 'team_iran_vs_usa',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_secure_password'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || '6379',
    password: process.env.REDIS_PASSWORD || 'your_redis_password'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET
  },
  monitoring: {
    enabled: true,
    prometheusPort: 9090,
    grafanaPort: 3001,
    alertingEnabled: true
  },
  scaling: {
    enabled: process.env.AUTO_SCALING === 'true',
    minInstances: 2,
    maxInstances: 10,
    targetCPU: 70,
    targetMemory: 80
  },
  backup: {
    enabled: true,
    schedule: '0 2 * * *',
    retention: 30,
    encryption: true
  },
  security: {
    sslEnabled: true,
    rateLimiting: true,
    securityHeaders: true,
    firewallEnabled: true
  }
};

// Production Deployment Orchestrator
class ProductionDeployer {
  constructor() {
    this.config = DEPLOYMENT_CONFIG;
    this.deploymentLog = [];
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
  }

  // Log deployment step
  logStep(step, status, details = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      step,
      status, // 'started', 'completed', 'failed', 'warning'
      details,
      duration: Date.now() - this.startTime
    };
    
    this.deploymentLog.push(logEntry);
    
    const icon = status === 'completed' ? '✅' : 
                 status === 'failed' ? '❌' : 
                 status === 'warning' ? '⚠️' : '🔄';
    
    console.log(`${icon} [${logEntry.timestamp}] ${step}`);
    if (details) {
      console.log(`   ${details}`);
    }
    
    // Write to log file
    this.writeLog(logEntry);
  }

  // Write to deployment log
  writeLog(logEntry) {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `deployment-${Date.now()}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Execute command with error handling
  execCommand(command, description) {
    try {
      this.logStep(`Command: ${description}`, 'started');
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
      this.logStep(`Command: ${description}`, 'completed', result.trim());
      return { success: true, output: result.trim() };
    } catch (error) {
      this.logStep(`Command: ${description}`, 'failed', error.message);
      this.errors.push({ command, description, error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Generate secure secrets
  generateSecrets() {
    this.logStep('Generating secure secrets', 'started');
    
    const secrets = {
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      SESSION_SECRET: crypto.randomBytes(64).toString('hex'),
      WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
      DB_PASSWORD: crypto.randomBytes(32).toString('hex'),
      REDIS_PASSWORD: crypto.randomBytes(32).toString('hex'),
      API_SECRET: crypto.randomBytes(32).toString('hex')
    };
    
    // Write secrets to file
    const secretsFile = path.join(__dirname, '..', '.env.production.secrets');
    let secretsContent = '# Production Secrets - DO NOT COMMIT\n';
    for (const [key, value] of Object.entries(secrets)) {
      secretsContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(secretsFile, secretsContent);
    fs.chmodSync(secretsFile, '600'); // Owner read/write only
    
    this.logStep('Generating secure secrets', 'completed', `Secrets file: ${secretsFile}`);
    return secrets;
  }

  // Setup production environment
  setupEnvironment() {
    this.logStep('Setting up production environment', 'started');
    
    // Create production environment file
    const envFile = path.join(__dirname, '..', '.env.production');
    let envContent = '# Production Environment\n';
    envContent += `NODE_ENV=production\n`;
    envContent += `PORT=3000\n`;
    envContent += `HOST=0.0.0.0\n`;
    envContent += `DOMAIN=${this.config.domain}\n`;
    envContent += `APP_URL=https://${this.config.domain}\n`;
    envContent += `API_URL=https://${this.config.domain}/api\n`;
    envContent += `DB_TYPE=postgres\n`;
    envContent += `DB_HOST=${this.config.database.host}\n`;
    envContent += `DB_PORT=${this.config.database.port}\n`;
    envContent += `DB_NAME=${this.config.database.name}\n`;
    envContent += `DB_USER=${this.config.database.user}\n`;
    envContent += `REDIS_HOST=${this.config.redis.host}\n`;
    envContent += `REDIS_PORT=${this.config.redis.port}\n`;
    envContent += `LOG_LEVEL=info\n`;
    envContent += `SSL_ENABLED=true\n`;
    envContent += `MONITORING_ENABLED=${this.config.monitoring.enabled}\n`;
    envContent += `AUTO_SCALING=${this.config.scaling.enabled}\n`;
    envContent += `BACKUP_ENABLED=${this.config.backup.enabled}\n`;
    envContent += `SECURITY_ENABLED=${this.config.security.sslEnabled}\n`;
    
    fs.writeFileSync(envFile, envContent);
    
    this.logStep('Setting up production environment', 'completed', `Environment file: ${envFile}`);
  }

  // Setup SSL certificates
  setupSSL() {
    this.logStep('Setting up SSL certificates', 'started');
    
    // Generate SSL setup script
    const sslScript = path.join(__dirname, '..', 'scripts', 'setup-ssl.sh');
    const result = this.execCommand(`chmod +x ${sslScript} && ${sslScript}`, 'SSL certificate setup');
    
    if (result.success) {
      this.logStep('Setting up SSL certificates', 'completed', 'SSL certificates configured');
    } else {
      this.logStep('Setting up SSL certificates', 'warning', 'Manual SSL setup may be required');
      this.warnings.push('SSL setup may need manual intervention');
    }
  }

  // Setup database
  setupDatabase() {
    this.logStep('Setting up database', 'started');
    
    // Create database
    const createDbCommand = `sudo -u postgres createdb ${this.config.database.name} || true`;
    this.execCommand(createDbCommand, 'Create database');
    
    // Create user
    const createUserCommand = `sudo -u postgres psql -c "CREATE USER ${this.config.database.user} WITH PASSWORD '${this.config.database.password}';" || true`;
    this.execCommand(createUserCommand, 'Create database user');
    
    // Grant privileges
    const grantCommand = `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${this.config.database.name} TO ${this.config.database.user};"`;
    this.execCommand(grantCommand, 'Grant database privileges');
    
    // Run migrations
    const migrateCommand = 'npm run migrate:prod';
    this.execCommand(migrateCommand, 'Run database migrations');
    
    // Seed database
    const seedCommand = 'npm run seed:prod';
    this.execCommand(seedCommand, 'Seed database');
    
    this.logStep('Setting up database', 'completed', 'Database setup completed');
  }

  // Setup Redis
  setupRedis() {
    this.logStep('Setting up Redis', 'started');
    
    // Configure Redis
    const redisConfig = `
# Redis Production Configuration
bind 127.0.0.1
port ${this.config.redis.port}
requirepass ${this.config.redis.password}
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
appendonly yes
appendfsync everysec
    `;
    
    const redisConfigFile = path.join(__dirname, '..', 'redis-production.conf');
    fs.writeFileSync(redisConfigFile, redisConfig);
    
    // Restart Redis
    this.execCommand('sudo systemctl restart redis-server', 'Restart Redis');
    
    this.logStep('Setting up Redis', 'completed', 'Redis configured and restarted');
  }

  // Build application
  buildApplication() {
    this.logStep('Building application', 'started');
    
    // Clean previous build
    this.execCommand('rm -rf dist', 'Clean previous build');
    
    // Install dependencies
    this.execCommand('npm ci --production=false', 'Install dependencies');
    
    // Run tests
    this.execCommand('npm run test:ci', 'Run test suite');
    
    // Build application
    this.execCommand('npm run build', 'Build application');
    
    // Build Docker image
    this.execCommand('docker build -f Dockerfile.prod -t team-iran-vs-usa:latest .', 'Build Docker image');
    
    this.logStep('Building application', 'completed', 'Application built successfully');
  }

  // Deploy services
  deployServices() {
    this.logStep('Deploying services', 'started');
    
    // Deploy with Docker Compose
    const composeCommand = 'docker-compose -f docker-compose.prod.yml up -d';
    this.execCommand(composeCommand, 'Deploy services');
    
    // Wait for services to start
    this.logStep('Waiting for services to start', 'started');
    this.execCommand('sleep 30', 'Wait for services');
    
    // Check service health
    const healthCheck = this.execCommand('curl -f http://localhost:3000/health', 'Health check');
    
    if (healthCheck.success) {
      this.logStep('Deploying services', 'completed', 'All services deployed and healthy');
    } else {
      this.logStep('Deploying services', 'warning', 'Some services may not be healthy');
      this.warnings.push('Service health check failed');
    }
  }

  // Setup monitoring
  setupMonitoring() {
    this.logStep('Setting up monitoring', 'started');
    
    if (this.config.monitoring.enabled) {
      // Start monitoring system
      this.execCommand('node scripts/monitor.js start', 'Start monitoring');
      
      // Setup Prometheus
      this.execCommand('docker-compose -f docker-compose.prod.yml up -d prometheus', 'Start Prometheus');
      
      // Setup Grafana
      this.execCommand('docker-compose -f docker-compose.prod.yml up -d grafana', 'Start Grafana');
      
      // Wait for monitoring services
      this.execCommand('sleep 20', 'Wait for monitoring services');
      
      // Check monitoring endpoints
      const prometheusHealth = this.execCommand('curl -f http://localhost:9090/-/healthy', 'Prometheus health');
      const grafanaHealth = this.execCommand('curl -f http://localhost:3001/api/health', 'Grafana health');
      
      if (prometheusHealth.success && grafanaHealth.success) {
        this.logStep('Setting up monitoring', 'completed', 'Monitoring services running');
      } else {
        this.logStep('Setting up monitoring', 'warning', 'Monitoring services may not be fully operational');
        this.warnings.push('Monitoring health check failed');
      }
    } else {
      this.logStep('Setting up monitoring', 'completed', 'Monitoring disabled by configuration');
    }
  }

  // Setup backup system
  setupBackup() {
    this.logStep('Setting up backup system', 'started');
    
    if (this.config.backup.enabled) {
      // Create backup directories
      this.execCommand('mkdir -p backups/{database,files,config}', 'Create backup directories');
      
      // Run initial backup
      this.execCommand('node scripts/backup.js full', 'Run initial backup');
      
      // Setup backup scheduler
      const cronJob = `${this.config.backup.schedule} /var/www/team-iran-vs-usa/scripts/backup.js full`;
      this.execCommand(`(crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`, 'Setup backup cron');
      
      this.logStep('Setting up backup system', 'completed', 'Backup system configured');
    } else {
      this.logStep('Setting up backup system', 'completed', 'Backup disabled by configuration');
    }
  }

  // Setup security
  setupSecurity() {
    this.logStep('Setting up security', 'started');
    
    // Run security audit
    this.execCommand('node scripts/security-audit.js audit', 'Run security audit');
    
    // Apply security hardening
    this.execCommand('node scripts/security-audit.js harden', 'Apply security hardening');
    
    // Setup firewall rules
    this.execCommand('sudo ufw --force reset', 'Reset firewall');
    this.execCommand('sudo ufw default deny incoming', 'Set default firewall policy');
    this.execCommand('sudo ufw default allow outgoing', 'Set default firewall policy');
    this.execCommand('sudo ufw allow ssh', 'Allow SSH');
    this.execCommand('sudo ufw allow 80/tcp', 'Allow HTTP');
    this.execCommand('sudo ufw allow 443/tcp', 'Allow HTTPS');
    this.execCommand('sudo ufw enable', 'Enable firewall');
    
    this.logStep('Setting up security', 'completed', 'Security configured');
  }

  // Setup auto-scaling
  setupAutoScaling() {
    this.logStep('Setting up auto-scaling', 'started');
    
    if (this.config.scaling.enabled) {
      // Initialize scaling manager
      this.execCommand('node scripts/scaling-manager.js init', 'Initialize scaling manager');
      
      // Start auto-scaling
      this.execCommand('node scripts/scaling-manager.js auto-scale', 'Start auto-scaling');
      
      this.logStep('Setting up auto-scaling', 'completed', 'Auto-scaling enabled');
    } else {
      this.logStep('Setting up auto-scaling', 'completed', 'Auto-scaling disabled by configuration');
    }
  }

  // Setup Telegram bot
  setupTelegramBot() {
    this.logStep('Setting up Telegram bot', 'started');
    
    if (this.config.telegram.botToken) {
      // Start Telegram bot
      this.execCommand('node scripts/telegram-bot.js start', 'Start Telegram bot');
      
      // Set webhook
      this.execCommand('node scripts/telegram-bot.js webhook', 'Set Telegram webhook');
      
      this.logStep('Setting up Telegram bot', 'completed', 'Telegram bot configured');
    } else {
      this.logStep('Setting up Telegram bot', 'warning', 'Telegram bot token not provided');
      this.warnings.push('Telegram bot setup skipped - no token provided');
    }
  }

  // Run comprehensive tests
  runComprehensiveTests() {
    this.logStep('Running comprehensive tests', 'started');
    
    // Unit tests
    this.execCommand('npm run test:unit', 'Run unit tests');
    
    // Integration tests
    this.execCommand('npm run test:integration', 'Run integration tests');
    
    // E2E tests
    this.execCommand('npm run test:e2e', 'Run E2E tests');
    
    // Performance tests
    this.execCommand('npm run test:performance', 'Run performance tests');
    
    // Security tests
    this.execCommand('npm run test:security', 'Run security tests');
    
    this.logStep('Running comprehensive tests', 'completed', 'All test suites completed');
  }

  // Generate deployment report
  generateDeploymentReport() {
    this.logStep('Generating deployment report', 'started');
    
    const deploymentDuration = Date.now() - this.startTime;
    
    const report = {
      deployment: {
        timestamp: new Date().toISOString(),
        duration: deploymentDuration,
        environment: this.config.environment,
        domain: this.config.domain,
        status: this.errors.length === 0 ? 'success' : 'partial'
      },
      configuration: this.config,
      services: {
        application: 'deployed',
        database: 'configured',
        redis: 'configured',
        monitoring: this.config.monitoring.enabled ? 'enabled' : 'disabled',
        backup: this.config.backup.enabled ? 'enabled' : 'disabled',
        security: this.config.security.sslEnabled ? 'enabled' : 'disabled',
        autoScaling: this.config.scaling.enabled ? 'enabled' : 'disabled',
        telegramBot: this.config.telegram.botToken ? 'configured' : 'skipped'
      },
      health: {
        application: this.checkApplicationHealth(),
        database: this.checkDatabaseHealth(),
        redis: this.checkRedisHealth(),
        monitoring: this.checkMonitoringHealth()
      },
      issues: {
        errors: this.errors,
        warnings: this.warnings
      },
      nextSteps: this.getNextSteps()
    };
    
    // Save report
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `deployment-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.logStep('Generating deployment report', 'completed', `Report saved: ${reportFile}`);
    
    return report;
  }

  // Check application health
  checkApplicationHealth() {
    try {
      const response = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
      return JSON.parse(response).status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  // Check database health
  checkDatabaseHealth() {
    try {
      execSync(`PGPASSWORD=${this.config.database.password} psql -h ${this.config.database.host} -U ${this.config.database.user} -d ${this.config.database.name} -c "SELECT 1;"`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check Redis health
  checkRedisHealth() {
    try {
      execSync(`redis-cli -h ${this.config.redis.host} -p ${this.config.redis.port} -a ${this.config.redis.password} ping`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check monitoring health
  checkMonitoringHealth() {
    try {
      const prometheusHealth = execSync('curl -s http://localhost:9090/-/healthy', { encoding: 'utf8' });
      const grafanaHealth = execSync('curl -s http://localhost:3001/api/health', { encoding: 'utf8' });
      return prometheusHealth.includes('Prometheus') && grafanaHealth.includes('OK');
    } catch (error) {
      return false;
    }
  }

  // Get next steps
  getNextSteps() {
    const steps = [];
    
    if (this.errors.length > 0) {
      steps.push('Address deployment errors');
    }
    
    if (this.warnings.length > 0) {
      steps.push('Review deployment warnings');
    }
    
    steps.push('Configure domain DNS to point to production server');
    steps.push('Verify SSL certificate is properly installed');
    steps.push('Test all application features');
    steps.push('Set up monitoring alerts');
    steps.push('Configure backup notifications');
    steps.push('Test disaster recovery procedures');
    steps.push('Review security configurations');
    steps.push('Load test the application');
    
    return steps;
  }

  // Execute complete deployment
  async executeCompleteDeployment() {
    console.log('🚀 STARTING COMPLETE PRODUCTION DEPLOYMENT');
    console.log('================================================');
    
    try {
      // Phase 1: Environment Setup
      this.logStep('Phase 1: Environment Setup', 'started');
      const secrets = this.generateSecrets();
      this.setupEnvironment();
      
      // Phase 2: Infrastructure Setup
      this.logStep('Phase 2: Infrastructure Setup', 'started');
      this.setupSSL();
      this.setupDatabase();
      this.setupRedis();
      
      // Phase 3: Application Build
      this.logStep('Phase 3: Application Build', 'started');
      this.buildApplication();
      
      // Phase 4: Service Deployment
      this.logStep('Phase 4: Service Deployment', 'started');
      this.deployServices();
      
      // Phase 5: Monitoring & Security
      this.logStep('Phase 5: Monitoring & Security', 'started');
      this.setupMonitoring();
      this.setupBackup();
      this.setupSecurity();
      
      // Phase 6: Advanced Features
      this.logStep('Phase 6: Advanced Features', 'started');
      this.setupAutoScaling();
      this.setupTelegramBot();
      
      // Phase 7: Testing & Validation
      this.logStep('Phase 7: Testing & Validation', 'started');
      this.runComprehensiveTests();
      
      // Phase 8: Final Report
      this.logStep('Phase 8: Final Report', 'started');
      const report = this.generateDeploymentReport();
      
      // Display final status
      console.log('================================================');
      console.log('🎉 PRODUCTION DEPLOYMENT COMPLETED');
      console.log('================================================');
      console.log(`📊 Deployment Duration: ${Math.round(report.deployment.duration / 1000)}s`);
      console.log(`🌐 Domain: https://${this.config.domain}`);
      console.log(`📈 Monitoring: http://localhost:9090`);
      console.log(`📊 Grafana: http://localhost:3001`);
      
      if (report.issues.errors.length > 0) {
        console.log(`❌ Errors: ${report.issues.errors.length}`);
        report.issues.errors.forEach(error => {
          console.log(`   - ${error.description}`);
        });
      }
      
      if (report.issues.warnings.length > 0) {
        console.log(`⚠️ Warnings: ${report.issues.warnings.length}`);
        report.issues.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }
      
      console.log('\n📋 Next Steps:');
      report.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      console.log('\n🔗 Access URLs:');
      console.log(`   Application: https://${this.config.domain}`);
      console.log(`   API: https://${this.config.domain}/api`);
      console.log(`   Health: https://${this.config.domain}/health`);
      console.log(`   Monitoring: http://localhost:9090`);
      console.log(`   Grafana: http://localhost:3001`);
      
      return report;
      
    } catch (error) {
      this.logStep('Complete Deployment', 'failed', error.message);
      console.error('❌ DEPLOYMENT FAILED:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const deployer = new ProductionDeployer();
  
  try {
    switch (command) {
      case 'deploy':
        await deployer.executeCompleteDeployment();
        break;
        
      case 'secrets':
        deployer.generateSecrets();
        break;
        
      case 'env':
        deployer.setupEnvironment();
        break;
        
      case 'ssl':
        deployer.setupSSL();
        break;
        
      case 'database':
        deployer.setupDatabase();
        break;
        
      case 'build':
        deployer.buildApplication();
        break;
        
      case 'services':
        deployer.deployServices();
        break;
        
      case 'monitoring':
        deployer.setupMonitoring();
        break;
        
      case 'security':
        deployer.setupSecurity();
        break;
        
      case 'backup':
        deployer.setupBackup();
        break;
        
      case 'scaling':
        deployer.setupAutoScaling();
        break;
        
      case 'telegram':
        deployer.setupTelegramBot();
        break;
        
      case 'test':
        deployer.runComprehensiveTests();
        break;
        
      case 'report':
        // Generate report from existing deployment
        const report = deployer.generateDeploymentReport();
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
🚀 Complete Production Deployment Orchestrator

Usage: node production-deploy.js <command>

Commands:
  deploy        Execute complete production deployment
  secrets       Generate secure secrets
  env           Setup production environment
  ssl           Setup SSL certificates
  database      Setup database
  build         Build application
  services      Deploy services
  monitoring    Setup monitoring
  security      Setup security
  backup        Setup backup system
  scaling       Setup auto-scaling
  telegram      Setup Telegram bot
  test          Run comprehensive tests
  report        Generate deployment report

Examples:
  node production-deploy.js deploy
  node production-deploy.js secrets
  node production-deploy.js test

Environment Variables:
  PRODUCTION_DOMAIN        Production domain name
  SSL_EMAIL               SSL certificate email
  DB_HOST                 Database host
  DB_PORT                 Database port
  DB_NAME                 Database name
  DB_USER                 Database user
  DB_PASSWORD             Database password
  REDIS_HOST              Redis host
  REDIS_PORT              Redis port
  REDIS_PASSWORD          Redis password
  TELEGRAM_BOT_TOKEN      Telegram bot token
  TELEGRAM_WEBHOOK_URL     Telegram webhook URL
  TELEGRAM_WEBHOOK_SECRET  Telegram webhook secret
  AUTO_SCALING            Enable auto-scaling (true/false)
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProductionDeployer;
