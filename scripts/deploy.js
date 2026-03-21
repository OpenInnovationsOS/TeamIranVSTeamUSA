#!/usr/bin/env node

// Deployment Script
// Automated deployment with rollback capabilities

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_CONFIG = {
  environments: {
    staging: {
      host: process.env.STAGING_HOST,
      user: process.env.STAGING_USER,
      key: process.env.STAGING_SSH_KEY,
      path: '/var/www/team-iran-vs-usa',
      composeFile: 'docker-compose.staging.yml',
      healthUrl: 'https://staging.team-iran-vs-usa.com/health',
      rollbackFile: 'rollback-staging.json'
    },
    production: {
      host: process.env.PRODUCTION_HOST,
      user: process.env.PRODUCTION_USER,
      key: process.env.PRODUCTION_SSH_KEY,
      path: '/var/www/team-iran-vs-usa',
      composeFile: 'docker-compose.prod.yml',
      healthUrl: 'https://team-iran-vs-usa.com/health',
      rollbackFile: 'rollback-production.json'
    }
  },
  timeout: 300000, // 5 minutes
  retries: 3
};

// Deployment class
class Deployment {
  constructor(environment) {
    this.environment = environment;
    this.config = DEPLOYMENT_CONFIG.environments[environment];
    this.startTime = Date.now();
    this.rollbackData = null;
  }

  // Execute command with error handling
  exec(command, options = {}) {
    try {
      console.log(`🔧 Executing: ${command}`);
      const result = execSync(command, {
        stdio: 'inherit',
        timeout: DEPLOYMENT_CONFIG.timeout,
        ...options
      });
      return result;
    } catch (error) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
      throw error;
    }
  }

  // SSH command execution
  ssh(command) {
    const sshCommand = `ssh -i ${this.config.key} ${this.config.user}@${this.config.host} "${command}"`;
    return this.exec(sshCommand);
  }

  // Create backup before deployment
  createBackup() {
    console.log('📦 Creating backup...');
    
    const backupData = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      commit: this.exec('git rev-parse HEAD').toString().trim(),
      branch: this.exec('git rev-parse --abbrev-ref HEAD').toString().trim(),
      images: this.ssh(`docker images --format "table {{.Repository}}:{{.Tag}}"`),
      containers: this.ssh(`docker ps -a --format "table {{.Names}}:{{.Status}}"`),
      volumes: this.ssh(`docker volume ls --format "table {{.Name}}"`)
    };

    this.rollbackData = backupData;
    
    // Save rollback data
    const rollbackFile = path.join(__dirname, '..', this.config.rollbackFile);
    fs.writeFileSync(rollbackFile, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup created');
  }

  // Run pre-deployment tests
  async runPreDeploymentTests() {
    console.log('🧪 Running pre-deployment tests...');
    
    try {
      // Run unit tests
      this.exec('npm run test:unit -- --watchAll=false');
      
      // Run integration tests
      this.exec('npm run test:integration -- --watchAll=false');
      
      // Run security audit
      this.exec('npm audit --audit-level high');
      
      // Run linting
      this.exec('npm run lint');
      
      console.log('✅ Pre-deployment tests passed');
    } catch (error) {
      console.error('❌ Pre-deployment tests failed');
      throw error;
    }
  }

  // Build application
  build() {
    console.log('🔨 Building application...');
    
    try {
      // Clean previous build
      this.exec('rm -rf dist');
      
      // Build production bundle
      this.exec('npm run build');
      
      // Build Docker image
      this.exec(`docker build -f Dockerfile.prod -t team-iran-vs-usa:${this.environment} .`);
      
      console.log('✅ Application built successfully');
    } catch (error) {
      console.error('❌ Build failed');
      throw error;
    }
  }

  // Deploy to server
  deploy() {
    console.log(`🚀 Deploying to ${this.environment}...`);
    
    try {
      // Copy files to server
      this.exec(`scp -i ${this.config.key} -r . ${this.config.user}@${this.config.host}:${this.config.path}/`);
      
      // Pull latest images
      this.ssh(`cd ${this.config.path} && docker-compose -f ${this.config.composeFile} pull`);
      
      // Stop old containers
      this.ssh(`cd ${this.config.path} && docker-compose -f ${this.config.composeFile} down`);
      
      // Start new containers
      this.ssh(`cd ${this.config.path} && docker-compose -f ${this.config.composeFile} up -d`);
      
      // Wait for containers to start
      console.log('⏳ Waiting for containers to start...');
      this.ssh('sleep 30');
      
      // Clean up old images
      this.ssh('docker image prune -f');
      
      console.log('✅ Deployment completed');
    } catch (error) {
      console.error('❌ Deployment failed');
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    console.log('🏥 Running health check...');
    
    const maxRetries = DEPLOYMENT_CONFIG.retries;
    const retryDelay = 10000; // 10 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(this.config.healthUrl);
        if (response.ok) {
          const health = await response.json();
          console.log('✅ Health check passed');
          console.log(`Status: ${health.status}`);
          console.log(`Uptime: ${health.uptime}s`);
          return true;
        }
      } catch (error) {
        console.log(`⚠️ Health check attempt ${i + 1} failed: ${error.message}`);
        if (i < maxRetries - 1) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw new Error('Health check failed after all retries');
  }

  // Rollback deployment
  async rollback() {
    console.log('🔄 Rolling back deployment...');
    
    if (!this.rollbackData) {
      console.error('❌ No rollback data available');
      return false;
    }
    
    try {
      // Restore previous state
      this.ssh(`cd ${this.config.path} && docker-compose -f ${this.config.composeFile} down`);
      
      // Checkout previous commit
      this.exec(`git checkout ${this.rollbackData.commit}`);
      
      // Rebuild and redeploy
      this.build();
      this.deploy();
      
      // Wait for rollback to complete
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Health check
      await this.healthCheck();
      
      console.log('✅ Rollback completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      return false;
    }
  }

  // Post-deployment tests
  async runPostDeploymentTests() {
    console.log('🧪 Running post-deployment tests...');
    
    try {
      // Run smoke tests
      this.exec(`npm run test:smoke -- --baseUrl=${this.config.healthUrl.replace('/health', '')}`);
      
      // Run API tests
      this.exec(`npm run test:api -- --baseUrl=${this.config.healthUrl.replace('/health', '')}`);
      
      console.log('✅ Post-deployment tests passed');
    } catch (error) {
      console.error('❌ Post-deployment tests failed');
      throw error;
    }
  }

  // Notify deployment
  notify(status, message) {
    console.log(`📢 Deployment ${status}: ${message}`);
    
    // Send notification to Slack (if configured)
    if (process.env.SLACK_WEBHOOK) {
      try {
        const payload = {
          text: `Deployment ${status} for ${this.environment}`,
          attachments: [{
            color: status === 'success' ? 'good' : 'danger',
            fields: [
              {
                title: 'Environment',
                value: this.environment,
                short: true
              },
              {
                title: 'Status',
                value: status,
                short: true
              },
              {
                title: 'Duration',
                value: `${Math.round((Date.now() - this.startTime) / 1000)}s`,
                short: true
              },
              {
                title: 'Message',
                value: message,
                short: false
              }
            ]
          }]
        };
        
        this.exec(`curl -X POST -H 'Content-type: application/json' --data '${JSON.stringify(payload)}' ${process.env.SLACK_WEBHOOK}`);
      } catch (error) {
        console.error('Failed to send Slack notification:', error.message);
      }
    }
  }

  // Main deployment process
  async deployFull() {
    console.log(`🚀 Starting deployment to ${this.environment}...`);
    
    try {
      // Create backup
      this.createBackup();
      
      // Run pre-deployment tests
      await this.runPreDeploymentTests();
      
      // Build application
      this.build();
      
      // Deploy
      this.deploy();
      
      // Health check
      await this.healthCheck();
      
      // Run post-deployment tests
      await this.runPostDeploymentTests();
      
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      this.notify('success', `Deployment completed successfully in ${duration}s`);
      
      console.log(`🎉 Deployment to ${this.environment} completed successfully!`);
      console.log(`⏱️ Duration: ${duration}s`);
      
      return true;
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      
      // Attempt rollback
      console.log('🔄 Attempting rollback...');
      const rollbackSuccess = await this.rollback();
      
      this.notify('failure', `Deployment failed. Rollback ${rollbackSuccess ? 'successful' : 'failed'}. Error: ${error.message}`);
      
      throw error;
    }
  }

  // Rollback only
  async rollbackOnly() {
    console.log(`🔄 Rolling back ${this.environment} deployment...`);
    
    try {
      const success = await this.rollback();
      if (success) {
        this.notify('success', 'Rollback completed successfully');
      } else {
        this.notify('failure', 'Rollback failed');
      }
      return success;
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      this.notify('failure', `Rollback failed: ${error.message}`);
      throw error;
    }
  }

  // Get deployment status
  async getStatus() {
    console.log(`📊 Getting deployment status for ${this.environment}...`);
    
    try {
      const health = await fetch(this.config.healthUrl);
      if (health.ok) {
        const healthData = await health.json();
        console.log('✅ Application is healthy');
        console.log(`Status: ${healthData.status}`);
        console.log(`Uptime: ${healthData.uptime}s`);
        console.log(`Environment: ${healthData.environment}`);
        
        // Get container status
        const containers = this.ssh(`docker ps --format "table {{.Names}}\t{{.Status}}"`);
        console.log('\n📦 Container Status:');
        console.log(containers);
        
        return healthData;
      } else {
        console.log('❌ Application is unhealthy');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      return null;
    }
  }
}

// CLI interface
async function main() {
  const [command, environment] = process.argv.slice(2);
  
  if (!environment || !DEPLOYMENT_CONFIG.environments[environment]) {
    console.error('❌ Invalid environment. Use: staging or production');
    process.exit(1);
  }
  
  const deployment = new Deployment(environment);
  
  try {
    switch (command) {
      case 'deploy':
        await deployment.deployFull();
        break;
        
      case 'rollback':
        await deployment.rollbackOnly();
        break;
        
      case 'status':
        await deployment.getStatus();
        break;
        
      case 'health':
        await deployment.healthCheck();
        break;
        
      default:
        console.log(`
🚀 Deployment CLI

Usage: node deploy.js <command> <environment>

Commands:
  deploy     Deploy application
  rollback   Rollback to previous version
  status     Get deployment status
  health     Run health check

Environments:
  staging    Staging environment
  production Production environment

Examples:
  node deploy.js deploy staging
  node deploy.js rollback production
  node deploy.js status staging
  node deploy.js health production
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = Deployment;
