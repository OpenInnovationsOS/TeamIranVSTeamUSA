#!/usr/bin/env node

/**
 * Simple Production Deployment Script
 * Focused deployment for Team Iran vs USA Telegram Game
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  buildDir: 'frontend/build',
  nodeEnv: 'production',
  port: process.env.PORT || 8080
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Main deployment process
const deploy = () => {
  log('🚀 Starting Simple Deployment...', colors.cyan);
  log('================================', colors.cyan);
  
  try {
    // Check environment
    log('🔍 Checking environment...', colors.cyan);
    log(`✅ Node.js version: ${process.version}`, colors.green);
    log(`✅ Environment: ${config.nodeEnv}`, colors.green);
    
    // Build project
    log('🏗️ Building project...', colors.cyan);
    
    // Clean previous build (Windows compatible)
    if (fs.existsSync(config.buildDir)) {
      execSync(`rmdir /s /q "${config.buildDir}"`, { stdio: 'inherit' });
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
    
    // Deployment summary
    log('📋 Deployment Summary:', colors.yellow);
    log('========================', colors.yellow);
    log(`🌐 Environment: ${config.nodeEnv}`, colors.blue);
    log(`🔌 Port: ${config.port}`, colors.blue);
    log(`📁 Build Directory: ${config.buildDir}`, colors.blue);
    log('========================', colors.yellow);
    log('🚀 Deployment ready!', colors.green);
    log('', colors.reset);
    
    log('🎯 Next steps:', colors.cyan);
    log('1. Start the server: node src/server-simple.js', colors.blue);
    log('2. Access the app: http://localhost:8080', colors.blue);
    log('3. Test the application', colors.blue);
    
  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`, colors.red);
    process.exit(1);
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Deployment interrupted by user', colors.yellow);
  process.exit(0);
});

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy, config };
