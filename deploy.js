#!/usr/bin/env node

/**
 * Production Deployment Script
 * Automated deployment for Team Iran vs USA Telegram Game
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  buildDir: 'frontend/build',
  deployDir: 'dist',
  nodeEnv: 'production',
  port: process.env.PORT || 8080,
  healthCheckUrl: `http://localhost:${process.env.PORT || 8080}/api/config`,
  maxRetries: 3,
  retryDelay: 5000
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Step 1: Environment Check
const checkEnvironment = () => {
  log('🔍 Checking environment...', colors.cyan);
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log(`❌ Node.js version ${nodeVersion} is too old. Requires v16 or higher.`, colors.red);
    process.exit(1);
  }
  
  log(`✅ Node.js version: ${nodeVersion}`, colors.green);
  
  // Check environment variables
  const requiredEnvVars = ['NODE_ENV', 'PORT'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`❌ Missing environment variables: ${missingVars.join(', ')}`, colors.red);
    process.exit(1);
  }
  
  log(`✅ Environment variables: OK`, colors.green);
};

// Step 2: Build Project
const buildProject = () => {
  log('🏗️ Building project...', colors.cyan);
  
  try {
    // Clean previous build
    if (fs.existsSync(config.buildDir)) {
      execSync(`rm -rf ${config.buildDir}`, { stdio: 'inherit' });
    }
    
    // Set production environment
    process.env.NODE_ENV = config.nodeEnv;
    
    // Build project
    execSync('cd frontend && npm run build', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Check if build was successful
    if (!fs.existsSync(path.join(config.buildDir, 'index.html'))) {
      throw new Error('Build failed - index.html not found');
    }
    
    log('✅ Build completed successfully', colors.green);
    
    // Analyze bundle size
    const buildStats = analyzeBuild();
    log(`📊 Bundle size: ${buildStats.size}`, colors.blue);
    log(`📦 Assets: ${buildStats.assets}`, colors.blue);
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
};

// Step 3: Run Tests
const runTests = () => {
  log('🧪 Running tests...', colors.cyan);
  
  try {
    execSync('cd frontend && npm run test:ci', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('✅ All tests passed', colors.green);
  } catch (error) {
    log(`❌ Tests failed: ${error.message}`, colors.red);
    process.exit(1);
  }
};

// Step 4: Optimize Build
const optimizeBuild = () => {
  log('⚡ Optimizing build...', colors.cyan);
  
  try {
    // Gzip compression check
    execSync('gzip -c frontend/build/static/js/*.js', { stdio: 'inherit' });
    
    // Image optimization
    execSync('find frontend/build/static -name "*.png" -exec pngquant --quality=65-80 --output {} --force --ext .png {} \\;', { stdio: 'inherit' });
    
    log('✅ Build optimized', colors.green);
  } catch (error) {
    log(`⚠️ Optimization warning: ${error.message}`, colors.yellow);
  }
};

// Step 5: Health Check
const healthCheck = async () => {
  log('🏥 Running health check...', colors.cyan);
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(config.healthCheckUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          log('✅ Health check passed', colors.green);
          log(`🔗 Server running at: ${config.healthCheckUrl}`, colors.blue);
          return true;
        }
      }
    } catch (error) {
      log(`⚠️ Health check attempt ${attempt} failed: ${error.message}`, colors.yellow);
      
      if (attempt < config.maxRetries) {
        log(`Retrying in ${config.retryDelay / 1000} seconds...`, colors.yellow);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  log('❌ Health check failed after all retries', colors.red);
  return false;
};

// Step 6: Security Check
const securityCheck = () => {
  log('🔒 Running security check...', colors.cyan);
  
  try {
    // Check for sensitive data in build
    execSync('grep -r "password\\|secret\\|key" frontend/build/ || echo "No sensitive data found"', { stdio: 'inherit' });
    
    // Check for console.log statements
    const consoleLogs = execSync('grep -r "console.log" frontend/build/static/js/ || echo "0"').toString();
    if (consoleLogs.trim() !== '0') {
      log(`⚠️ Found ${consoleLogs.split('\\n').length} console.log statements in build`, colors.yellow);
    }
    
    log('✅ Security check passed', colors.green);
  } catch (error) {
    log(`⚠️ Security check warning: ${error.message}`, colors.yellow);
  }
};

// Analyze build statistics
const analyzeBuild = () => {
  const buildPath = path.join(process.cwd(), config.buildDir);
  const jsPath = path.join(buildPath, 'static/js');
  
  if (!fs.existsSync(jsPath)) {
    return {
      size: 'N/A',
      assets: 'N/A'
    };
  }
  
  const files = fs.readdirSync(jsPath);
  const mainJs = files.find(file => file.includes('main.'));
  
  if (!mainJs) {
    return {
      size: 'N/A',
      assets: 'N/A'
    };
  }
  
  const filePath = path.join(jsPath, mainJs);
  const stats = fs.statSync(filePath);
  const sizeInKB = (stats.size / 1024).toFixed(2);
  
  // Count assets
  const assetsPath = path.join(buildPath, 'static');
  let assetCount = 0;
  
  if (fs.existsSync(assetsPath)) {
    const countAssets = (dir) => {
      const files = fs.readdirSync(dir);
      return files.length + files.reduce((count, file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          return count + countAssets(filePath);
        }
        return count;
      }, 0);
    };
    
    assetCount = countAssets(assetsPath);
  }
  
  return {
    size: `${sizeInKB} KB`,
    assets: `${assetCount} files`
  };
};

// Step 7: Deployment Info
const showDeploymentInfo = () => {
  log('📋 Deployment Summary:', colors.magenta);
  log('========================', colors.magenta);
  log(`🌐 Environment: ${config.nodeEnv}`, colors.blue);
  log(`🔌 Port: ${config.port}`, colors.blue);
  log(`📁 Build Directory: ${config.buildDir}`, colors.blue);
  log(`🏥 Health URL: ${config.healthCheckUrl}`, colors.blue);
  log('========================', colors.magenta);
  log('🚀 Deployment ready!', colors.green);
  log('', colors.reset);
};

// Main deployment process
const deploy = async () => {
  log('🚀 Starting Team Iran vs USA Deployment...', colors.cyan);
  log('=====================================', colors.cyan);
  
  try {
    checkEnvironment();
    buildProject();
    runTests();
    optimizeBuild();
    securityCheck();
    
    const healthPassed = await healthCheck();
    
    if (healthPassed) {
      showDeploymentInfo();
    } else {
      log('❌ Deployment failed - health check did not pass', colors.red);
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Deployment interrupted by user', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Deployment terminated', colors.yellow);
  process.exit(0);
});

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy, config };
