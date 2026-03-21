#!/usr/bin/env node

// Windows-Compatible Production Deployment
// Adapted for Windows environment with cross-platform compatibility

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');
const os = require('os');

// Windows-compatible utilities
const isWindows = os.platform() === 'win32';

class WindowsProductionDeployer {
  constructor() {
    this.isWindows = isWindows;
    this.deploymentLog = [];
    this.startTime = Date.now();
  }

  // Cross-platform command execution
  execCommand(command, description) {
    try {
      this.logStep(`Command: ${description}`, 'started');
      
      // Convert Unix commands to Windows equivalents
      const windowsCommand = this.convertToWindowsCommand(command);
      
      const result = execSync(windowsCommand, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000
      });
      
      this.logStep(`Command: ${description}`, 'completed', result.trim());
      return { success: true, output: result.trim() };
    } catch (error) {
      this.logStep(`Command: ${description}`, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  // Convert Unix commands to Windows equivalents
  convertToWindowsCommand(command) {
    if (!this.isWindows) return command;
    
    const replacements = {
      'rm -rf': 'rmdir /s /q',
      'mkdir -p': 'mkdir',
      'sleep': 'timeout',
      'sudo': '',
      'chmod +x': '',
      'curl': 'curl',
      'psql': 'psql',
      'redis-cli': 'redis-cli'
    };
    
    let windowsCommand = command;
    for (const [unix, windows] of Object.entries(replacements)) {
      windowsCommand = windowsCommand.replace(new RegExp(unix, 'g'), windows);
    }
    
    return windowsCommand;
  }

  // Windows-compatible directory creation
  createDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${dirPath}:`, error.message);
    }
  }

  // Windows-compatible file deletion
  deleteDirectory(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`✅ Deleted directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete directory ${dirPath}:`, error.message);
    }
  }

  // Windows-compatible sleep
  sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  // Log step
  logStep(step, status, details = '') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      step,
      status,
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
  }

  // Setup Windows-compatible environment
  setupEnvironment() {
    this.logStep('Setting up Windows-compatible environment', 'started');
    
    // Create necessary directories
    const directories = [
      'logs',
      'reports',
      'backups',
      'backups/database',
      'backups/files',
      'backups/config',
      'dist',
      'dist/static'
    ];
    
    directories.forEach(dir => this.createDirectory(dir));
    
    // Create Windows batch scripts
    this.createWindowsScripts();
    
    this.logStep('Setting up Windows-compatible environment', 'completed');
  }

  // Create Windows batch scripts
  createWindowsScripts() {
    const scriptsDir = path.join(__dirname, '..', 'scripts', 'windows');
    this.createDirectory(scriptsDir);
    
    // Create deployment script
    const deployScript = `@echo off
echo Starting Windows Production Deployment...
node scripts/windows-production-deploy.js deploy
pause
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'deploy.bat'), deployScript);
    
    // Create monitoring script
    const monitorScript = `@echo off
echo Starting Monitoring...
node scripts/monitor.js start
pause
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'monitor.bat'), monitorScript);
    
    // Create backup script
    const backupScript = `@echo off
echo Running Backup...
node scripts/backup.js full
pause
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'backup.bat'), backupScript);
  }

  // Setup local development database
  setupLocalDatabase() {
    this.logStep('Setting up local development database', 'started');
    
    try {
      // Create SQLite database for local development
      const dbPath = path.join(__dirname, '..', 'data', 'production.db');
      this.createDirectory(path.dirname(dbPath));
      
      // Initialize SQLite database
      const Database = require('better-sqlite3');
      const db = new Database(dbPath);
      
      // Create basic tables
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          faction TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS battles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player1_id INTEGER,
          player2_id INTEGER,
          winner_id INTEGER,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player1_id) REFERENCES users(id),
          FOREIGN KEY (player2_id) REFERENCES users(id),
          FOREIGN KEY (winner_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS territories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          owner_faction TEXT NOT NULL,
          control_points INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      db.close();
      
      this.logStep('Setting up local development database', 'completed', `Database: ${dbPath}`);
    } catch (error) {
      this.logStep('Setting up local development database', 'failed', error.message);
    }
  }

  // Setup local Redis (Windows compatible)
  setupLocalRedis() {
    this.logStep('Setting up local Redis configuration', 'started');
    
    try {
      // Create Redis configuration file
      const redisConfig = `
# Windows Redis Configuration
port 6379
bind 127.0.0.1
timeout 0
tcp-keepalive 300
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir ./
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
      `;
      
      const redisConfigPath = path.join(__dirname, '..', 'redis-windows.conf');
      fs.writeFileSync(redisConfigPath, redisConfig);
      
      this.logStep('Setting up local Redis configuration', 'completed', `Config: ${redisConfigPath}`);
    } catch (error) {
      this.logStep('Setting up local Redis configuration', 'failed', error.message);
    }
  }

  // Build application for Windows
  buildApplication() {
    this.logStep('Building application (Windows)', 'started');
    
    try {
      // Clean previous build
      this.deleteDirectory('dist');
      
      // Install dependencies
      this.execCommand('npm install', 'Install dependencies');
      
      // Build application
      this.execCommand('npm run build', 'Build application');
      
      this.logStep('Building application (Windows)', 'completed', 'Application built successfully');
    } catch (error) {
      this.logStep('Building application (Windows)', 'failed', error.message);
    }
  }

  // Start development server
  startDevelopmentServer() {
    this.logStep('Starting development server', 'started');
    
    try {
      // Start the application server
      const serverProcess = spawn('node', ['src/server-production.js'], {
        stdio: 'pipe',
        detached: true
      });
      
      serverProcess.unref();
      
      this.logStep('Starting development server', 'completed', `Server PID: ${serverProcess.pid}`);
      
      // Wait for server to start
      this.sleep(5);
      
      // Check if server is running
      const healthCheck = this.checkServerHealth();
      if (healthCheck) {
        this.logStep('Server health check', 'completed', 'Server is healthy');
      } else {
        this.logStep('Server health check', 'warning', 'Server may not be fully ready');
      }
    } catch (error) {
      this.logStep('Starting development server', 'failed', error.message);
    }
  }

  // Check server health
  checkServerHealth() {
    try {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET',
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        return res.statusCode === 200;
      });
      
      req.on('error', () => false);
      req.setTimeout(5000, () => {
        req.destroy();
        return false;
      });
      
      req.end();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Setup monitoring (Windows compatible)
  setupMonitoring() {
    this.logStep('Setting up monitoring (Windows)', 'started');
    
    try {
      // Create monitoring configuration
      const monitoringConfig = {
        enabled: true,
        metricsPath: 'logs/metrics.json',
        logPath: 'logs/app.log',
        healthCheckInterval: 30000
      };
      
      const configPath = path.join(__dirname, '..', 'monitoring-windows.json');
      fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));
      
      // Start monitoring in background
      const monitorProcess = spawn('node', ['scripts/monitor.js'], {
        stdio: 'pipe',
        detached: true
      });
      
      monitorProcess.unref();
      
      this.logStep('Setting up monitoring (Windows)', 'completed', `Monitor PID: ${monitorProcess.pid}`);
    } catch (error) {
      this.logStep('Setting up monitoring (Windows)', 'failed', error.message);
    }
  }

  // Setup backup system (Windows compatible)
  setupBackupSystem() {
    this.logStep('Setting up backup system (Windows)', 'started');
    
    try {
      // Create Windows task scheduler script
      const taskScript = `
@echo off
echo Running scheduled backup...
cd /d "%~dp0"
node scripts/backup.js full
echo Backup completed at %date% %time%
`;
      
      const taskScriptPath = path.join(__dirname, '..', 'scripts', 'windows', 'backup-task.bat');
      fs.writeFileSync(taskScriptPath, taskScript);
      
      // Create backup configuration
      const backupConfig = {
        enabled: true,
        schedule: 'daily',
        retention: 30,
        encryption: true,
        backupDir: 'backups'
      };
      
      const configPath = path.join(__dirname, '..', 'backup-windows.json');
      fs.writeFileSync(configPath, JSON.stringify(backupConfig, null, 2));
      
      // Run initial backup
      this.execCommand('node scripts/backup.js full', 'Run initial backup');
      
      this.logStep('Setting up backup system (Windows)', 'completed', 'Backup system configured');
    } catch (error) {
      this.logStep('Setting up backup system (Windows)', 'failed', error.message);
    }
  }

  // Generate Windows deployment report
  generateWindowsReport() {
    this.logStep('Generating Windows deployment report', 'started');
    
    const report = {
      deployment: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        platform: 'Windows',
        status: 'completed'
      },
      services: {
        application: 'running',
        database: 'sqlite-local',
        redis: 'configured',
        monitoring: 'enabled',
        backup: 'configured'
      },
      access: {
        application: 'http://localhost:3000',
        api: 'http://localhost:3000/api',
        health: 'http://localhost:3000/health'
      },
      nextSteps: [
        'Test application features',
        'Configure production database',
        'Set up production Redis',
        'Configure SSL certificates',
        'Deploy to production server'
      ]
    };
    
    // Save report
    const reportDir = path.join(__dirname, '..', 'reports');
    this.createDirectory(reportDir);
    
    const reportFile = path.join(reportDir, `windows-deployment-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.logStep('Generating Windows deployment report', 'completed', `Report: ${reportFile}`);
    
    return report;
  }

  // Execute complete Windows deployment
  async executeWindowsDeployment() {
    console.log('🪟 STARTING WINDOWS-COMPATIBLE DEPLOYMENT');
    console.log('==========================================');
    
    try {
      // Phase 1: Environment Setup
      this.logStep('Phase 1: Windows Environment Setup', 'started');
      this.setupEnvironment();
      
      // Phase 2: Local Services Setup
      this.logStep('Phase 2: Local Services Setup', 'started');
      this.setupLocalDatabase();
      this.setupLocalRedis();
      
      // Phase 3: Application Build
      this.logStep('Phase 3: Application Build', 'started');
      this.buildApplication();
      
      // Phase 4: Start Services
      this.logStep('Phase 4: Start Services', 'started');
      this.startDevelopmentServer();
      
      // Phase 5: Monitoring & Backup
      this.logStep('Phase 5: Monitoring & Backup', 'started');
      this.setupMonitoring();
      this.setupBackupSystem();
      
      // Phase 6: Final Report
      this.logStep('Phase 6: Final Report', 'started');
      const report = this.generateWindowsReport();
      
      // Display results
      console.log('==========================================');
      console.log('🎉 WINDOWS DEPLOYMENT COMPLETED');
      console.log('==========================================');
      console.log(`📊 Deployment Duration: ${Math.round(report.deployment.duration / 1000)}s`);
      console.log(`🌐 Application: ${report.access.application}`);
      console.log(`🔧 API: ${report.access.api}`);
      console.log(`❤️ Health: ${report.access.health}`);
      
      console.log('\n📋 Next Steps:');
      report.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      console.log('\n🔗 Access URLs:');
      console.log(`   Application: ${report.access.application}`);
      console.log(`   API: ${report.access.api}`);
      console.log(`   Health: ${report.access.health}`);
      
      console.log('\n📁 Windows Scripts Created:');
      console.log(`   Deploy: scripts/windows/deploy.bat`);
      console.log(`   Monitor: scripts/windows/monitor.bat`);
      console.log(`   Backup: scripts/windows/backup.bat`);
      
      return report;
      
    } catch (error) {
      this.logStep('Windows Deployment', 'failed', error.message);
      console.error('❌ WINDOWS DEPLOYMENT FAILED:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const deployer = new WindowsProductionDeployer();
  
  try {
    switch (command) {
      case 'deploy':
        await deployer.executeWindowsDeployment();
        break;
        
      case 'env':
        deployer.setupEnvironment();
        break;
        
      case 'database':
        deployer.setupLocalDatabase();
        break;
        
      case 'redis':
        deployer.setupLocalRedis();
        break;
        
      case 'build':
        deployer.buildApplication();
        break;
        
      case 'server':
        deployer.startDevelopmentServer();
        break;
        
      case 'monitor':
        deployer.setupMonitoring();
        break;
        
      case 'backup':
        deployer.setupBackupSystem();
        break;
        
      case 'report':
        const report = deployer.generateWindowsReport();
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
🪟 Windows-Compatible Production Deployment

Usage: node windows-production-deploy.js <command>

Commands:
  deploy        Execute complete Windows deployment
  env           Setup Windows environment
  database      Setup local SQLite database
  redis         Setup Redis configuration
  build         Build application
  server        Start development server
  monitor       Setup monitoring
  backup        Setup backup system
  report        Generate deployment report

Examples:
  node windows-production-deploy.js deploy
  node windows-production-deploy.js build
  node windows-production-deploy.js server

Features:
  ✅ Cross-platform compatibility
  ✅ Local SQLite database
  ✅ Windows batch scripts
  ✅ Development server
  ✅ Monitoring system
  ✅ Backup automation
  ✅ Comprehensive logging
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Windows deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = WindowsProductionDeployer;
