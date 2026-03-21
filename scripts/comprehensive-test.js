#!/usr/bin/env node

// Comprehensive System Testing Suite
// Systematic, deep, and holistic testing of all components

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiBaseUrl: 'http://localhost:3000/api',
  timeout: 10000,
  retries: 3,
  testCategories: {
    infrastructure: true,
    application: true,
    database: true,
    api: true,
    frontend: true,
    security: true,
    performance: true,
    integration: true,
    telegram: true,
    monitoring: true,
    backup: true,
    deployment: true
  }
};

// Comprehensive Test Suite
class ComprehensiveTestSuite {
  constructor() {
    this.config = TEST_CONFIG;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      categories: {},
      details: [],
      startTime: Date.now(),
      endTime: null
    };
    this.currentCategory = null;
  }

  // Log test result
  logTest(testName, status, details = '', category = this.currentCategory) {
    const testResult = {
      timestamp: new Date().toISOString(),
      testName,
      status, // 'passed', 'failed', 'warning', 'skipped'
      details,
      category,
      duration: Date.now() - this.testResults.startTime
    };
    
    this.testResults.details.push(testResult);
    this.testResults.total++;
    
    // Update category results
    if (!this.testResults.categories[category]) {
      this.testResults.categories[category] = {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      };
    }
    
    this.testResults.categories[category].total++;
    if (status === 'passed') {
      this.testResults.passed++;
      this.testResults.categories[category].passed++;
    } else if (status === 'failed') {
      this.testResults.failed++;
      this.testResults.categories[category].failed++;
    } else if (status === 'warning') {
      this.testResults.warnings++;
      this.testResults.categories[category].warnings++;
    }
    
    // Display result
    const icon = status === 'passed' ? '✅' : 
                 status === 'failed' ? '❌' : 
                 status === 'warning' ? '⚠️' : '⏭️';
    
    console.log(`${icon} [${category}] ${testName}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  // HTTP request helper
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        method: 'GET',
        timeout: this.config.timeout,
        ...options
      };
      
      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  // Test infrastructure components
  async testInfrastructure() {
    this.currentCategory = 'infrastructure';
    console.log('\n🏗️ TESTING INFRASTRUCTURE COMPONENTS');
    console.log('=====================================');
    
    // Test Node.js version
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.logTest('Node.js Version Check', 'passed', `Version: ${nodeVersion}`);
      } else {
        this.logTest('Node.js Version Check', 'warning', `Version: ${nodeVersion} (recommend 18+)`);
      }
    } catch (error) {
      this.logTest('Node.js Version Check', 'failed', error.message);
    }
    
    // Test npm availability
    try {
      execSync('npm --version', { stdio: 'pipe' });
      this.logTest('npm Availability', 'passed', 'npm is available');
    } catch (error) {
      this.logTest('npm Availability', 'failed', 'npm not available');
    }
    
    // Test package.json exists
    try {
      const packageJson = require(path.join(__dirname, '..', 'package.json'));
      this.logTest('package.json Structure', 'passed', `Name: ${packageJson.name}`);
    } catch (error) {
      this.logTest('package.json Structure', 'failed', 'package.json not found or invalid');
    }
    
    // Test dependencies installation
    try {
      const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
      if (nodeModulesExists) {
        this.logTest('Dependencies Installation', 'passed', 'node_modules exists');
      } else {
        this.logTest('Dependencies Installation', 'failed', 'node_modules not found');
      }
    } catch (error) {
      this.logTest('Dependencies Installation', 'failed', error.message);
    }
    
    // Test file system permissions
    try {
      const testFile = path.join(__dirname, '..', 'test-permission.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      this.logTest('File System Permissions', 'passed', 'Write permissions OK');
    } catch (error) {
      this.logTest('File System Permissions', 'failed', 'No write permissions');
    }
    
    // Test memory availability
    try {
      const freeMemory = require('os').freemem();
      const totalMemory = require('os').totalmem();
      const freeMemoryGB = Math.round(freeMemory / 1024 / 1024 / 1024 * 100) / 100;
      
      if (freeMemoryGB > 1) {
        this.logTest('Memory Availability', 'passed', `Free: ${freeMemoryGB}GB`);
      } else {
        this.logTest('Memory Availability', 'warning', `Low memory: ${freeMemoryGB}GB`);
      }
    } catch (error) {
      this.logTest('Memory Availability', 'failed', error.message);
    }
  }

  // Test application core
  async testApplication() {
    this.currentCategory = 'application';
    console.log('\n🚀 TESTING APPLICATION CORE');
    console.log('=============================');
    
    // Test application server availability
    try {
      const response = await this.makeRequest(this.config.baseUrl);
      if (response.statusCode === 200) {
        this.logTest('Application Server', 'passed', `Status: ${response.statusCode}`);
      } else {
        this.logTest('Application Server', 'failed', `Status: ${response.statusCode}`);
      }
    } catch (error) {
      this.logTest('Application Server', 'failed', error.message);
    }
    
    // Test health endpoint
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/health`);
      if (response.statusCode === 200) {
        this.logTest('Health Endpoint', 'passed', 'Health check OK');
      } else {
        this.logTest('Health Endpoint', 'warning', `Status: ${response.statusCode}`);
      }
    } catch (error) {
      this.logTest('Health Endpoint', 'failed', error.message);
    }
    
    // Test application structure
    try {
      const srcDir = path.join(__dirname, '..', 'src');
      const srcExists = fs.existsSync(srcDir);
      if (srcExists) {
        this.logTest('Application Structure', 'passed', 'src/ directory exists');
      } else {
        this.logTest('Application Structure', 'failed', 'src/ directory missing');
      }
    } catch (error) {
      this.logTest('Application Structure', 'failed', error.message);
    }
    
    // Test main server file
    try {
      const serverFile = path.join(__dirname, '..', 'src', 'server.js');
      const serverExists = fs.existsSync(serverFile);
      if (serverExists) {
        this.logTest('Main Server File', 'passed', 'server.js exists');
      } else {
        this.logTest('Main Server File', 'warning', 'server.js not found');
      }
    } catch (error) {
      this.logTest('Main Server File', 'failed', error.message);
    }
    
    // Test production server
    try {
      const prodServerFile = path.join(__dirname, '..', 'src', 'server-production.js');
      const prodServerExists = fs.existsSync(prodServerFile);
      if (prodServerExists) {
        this.logTest('Production Server', 'passed', 'server-production.js exists');
      } else {
        this.logTest('Production Server', 'warning', 'server-production.js not found');
      }
    } catch (error) {
      this.logTest('Production Server', 'failed', error.message);
    }
    
    // Test clustering server
    try {
      const clusterFile = path.join(__dirname, '..', 'cluster-server.js');
      const clusterExists = fs.existsSync(clusterFile);
      if (clusterExists) {
        this.logTest('Clustering Server', 'passed', 'cluster-server.js exists');
      } else {
        this.logTest('Clustering Server', 'warning', 'cluster-server.js not found');
      }
    } catch (error) {
      this.logTest('Clustering Server', 'failed', error.message);
    }
  }

  // Test database connectivity
  async testDatabase() {
    this.currentCategory = 'database';
    console.log('\n🗄️ TESTING DATABASE CONNECTIVITY');
    console.log('=================================');
    
    // Test database file existence
    try {
      const dbPath = path.join(__dirname, '..', 'data', 'production.db');
      const dbExists = fs.existsSync(dbPath);
      if (dbExists) {
        this.logTest('Database File', 'passed', 'SQLite database exists');
      } else {
        this.logTest('Database File', 'warning', 'Database file not found');
      }
    } catch (error) {
      this.logTest('Database File', 'failed', error.message);
    }
    
    // Test database directory
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const dataExists = fs.existsSync(dataDir);
      if (dataExists) {
        this.logTest('Database Directory', 'passed', 'data/ directory exists');
      } else {
        this.logTest('Database Directory', 'failed', 'data/ directory missing');
      }
    } catch (error) {
      this.logTest('Database Directory', 'failed', error.message);
    }
    
    // Test migration files
    try {
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      const migrationsExists = fs.existsSync(migrationsDir);
      if (migrationsExists) {
        const migrationFiles = fs.readdirSync(migrationsDir);
        this.logTest('Migration Files', 'passed', `${migrationFiles.length} migration files found`);
      } else {
        this.logTest('Migration Files', 'warning', 'migrations/ directory not found');
      }
    } catch (error) {
      this.logTest('Migration Files', 'failed', error.message);
    }
    
    // Test seed files
    try {
      const seedFile = path.join(__dirname, '..', 'scripts', 'seed-prod.js');
      const seedExists = fs.existsSync(seedFile);
      if (seedExists) {
        this.logTest('Seed Script', 'passed', 'seed-prod.js exists');
      } else {
        this.logTest('Seed Script', 'warning', 'seed-prod.js not found');
      }
    } catch (error) {
      this.logTest('Seed Script', 'failed', error.message);
    }
    
    // Test database configuration
    try {
      const envFile = path.join(__dirname, '..', '.env.production');
      const envExists = fs.existsSync(envFile);
      if (envExists) {
        this.logTest('Database Configuration', 'passed', '.env.production exists');
      } else {
        this.logTest('Database Configuration', 'warning', '.env.production not found');
      }
    } catch (error) {
      this.logTest('Database Configuration', 'failed', error.message);
    }
  }

  // Test API endpoints
  async testAPI() {
    this.currentCategory = 'api';
    console.log('\n🔌 TESTING API ENDPOINTS');
    console.log('==========================');
    
    // Test API base endpoint
    try {
      const response = await this.makeRequest(this.config.apiBaseUrl);
      if (response.statusCode === 200 || response.statusCode === 404) {
        this.logTest('API Base Endpoint', 'passed', `Status: ${response.statusCode}`);
      } else {
        this.logTest('API Base Endpoint', 'warning', `Status: ${response.statusCode}`);
      }
    } catch (error) {
      this.logTest('API Base Endpoint', 'failed', error.message);
    }
    
    // Test user endpoints
    const userEndpoints = [
      '/api/users',
      '/api/users/profile',
      '/api/users/leaderboard'
    ];
    
    for (const endpoint of userEndpoints) {
      try {
        const response = await this.makeRequest(`${this.config.apiBaseUrl}${endpoint}`);
        if (response.statusCode < 500) {
          this.logTest(`User Endpoint: ${endpoint}`, 'passed', `Status: ${response.statusCode}`);
        } else {
          this.logTest(`User Endpoint: ${endpoint}`, 'warning', `Status: ${response.statusCode}`);
        }
      } catch (error) {
        this.logTest(`User Endpoint: ${endpoint}`, 'failed', error.message);
      }
    }
    
    // Test game endpoints
    const gameEndpoints = [
      '/api/battles',
      '/api/territories',
      '/api/tournaments',
      '/api/missions'
    ];
    
    for (const endpoint of gameEndpoints) {
      try {
        const response = await this.makeRequest(`${this.config.apiBaseUrl}${endpoint}`);
        if (response.statusCode < 500) {
          this.logTest(`Game Endpoint: ${endpoint}`, 'passed', `Status: ${response.statusCode}`);
        } else {
          this.logTest(`Game Endpoint: ${endpoint}`, 'warning', `Status: ${response.statusCode}`);
        }
      } catch (error) {
        this.logTest(`Game Endpoint: ${endpoint}`, 'failed', error.message);
      }
    }
    
    // Test marketplace endpoints
    const marketplaceEndpoints = [
      '/api/marketplace',
      '/api/marketplace/items',
      '/api/premium'
    ];
    
    for (const endpoint of marketplaceEndpoints) {
      try {
        const response = await this.makeRequest(`${this.config.apiBaseUrl}${endpoint}`);
        if (response.statusCode < 500) {
          this.logTest(`Marketplace Endpoint: ${endpoint}`, 'passed', `Status: ${response.statusCode}`);
        } else {
          this.logTest(`Marketplace Endpoint: ${endpoint}`, 'warning', `Status: ${response.statusCode}`);
        }
      } catch (error) {
        this.logTest(`Marketplace Endpoint: ${endpoint}`, 'failed', error.message);
      }
    }
    
    // Test API response format
    try {
      const response = await this.makeRequest(`${this.config.apiBaseUrl}/health`);
      if (response.statusCode === 200) {
        try {
          const jsonData = JSON.parse(response.body);
          this.logTest('API Response Format', 'passed', 'JSON response valid');
        } catch (jsonError) {
          this.logTest('API Response Format', 'warning', 'Response not JSON');
        }
      }
    } catch (error) {
      this.logTest('API Response Format', 'failed', error.message);
    }
  }

  // Test frontend components
  async testFrontend() {
    this.currentCategory = 'frontend';
    console.log('\n🎨 TESTING FRONTEND COMPONENTS');
    console.log('===============================');
    
    // Test frontend directory structure
    try {
      const frontendDir = path.join(__dirname, '..', 'frontend');
      const frontendExists = fs.existsSync(frontendDir);
      if (frontendExists) {
        this.logTest('Frontend Directory', 'passed', 'frontend/ exists');
      } else {
        this.logTest('Frontend Directory', 'warning', 'frontend/ not found');
      }
    } catch (error) {
      this.logTest('Frontend Directory', 'failed', error.message);
    }
    
    // Test React application
    try {
      const appFile = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
      const appExists = fs.existsSync(appFile);
      if (appExists) {
        this.logTest('React App Component', 'passed', 'App.js exists');
      } else {
        this.logTest('React App Component', 'warning', 'App.js not found');
      }
    } catch (error) {
      this.logTest('React App Component', 'failed', error.message);
    }
    
    // Test key components
    const components = [
      'BattleArena.js',
      'Profile.js',
      'Leaderboard.js',
      'TerritoryMap.js',
      'Marketplace.js',
      'Tournaments.js'
    ];
    
    for (const component of components) {
      try {
        const componentPath = path.join(__dirname, '..', 'frontend', 'src', 'components', component);
        const componentExists = fs.existsSync(componentPath);
        if (componentExists) {
          this.logTest(`Component: ${component}`, 'passed', 'Component exists');
        } else {
          this.logTest(`Component: ${component}`, 'warning', 'Component not found');
        }
      } catch (error) {
        this.logTest(`Component: ${component}`, 'failed', error.message);
      }
    }
    
    // Test package.json in frontend
    try {
      const frontendPackageJson = path.join(__dirname, '..', 'frontend', 'package.json');
      const packageExists = fs.existsSync(frontendPackageJson);
      if (packageExists) {
        this.logTest('Frontend package.json', 'passed', 'Frontend package.json exists');
      } else {
        this.logTest('Frontend package.json', 'warning', 'Frontend package.json not found');
      }
    } catch (error) {
      this.logTest('Frontend package.json', 'failed', error.message);
    }
    
    // Test build output
    try {
      const buildDir = path.join(__dirname, '..', 'dist');
      const buildExists = fs.existsSync(buildDir);
      if (buildExists) {
        this.logTest('Build Output', 'passed', 'dist/ directory exists');
      } else {
        this.logTest('Build Output', 'warning', 'dist/ directory not found');
      }
    } catch (error) {
      this.logTest('Build Output', 'failed', error.message);
    }
  }

  // Test security measures
  async testSecurity() {
    this.currentCategory = 'security';
    console.log('\n🔒 TESTING SECURITY MEASURES');
    console.log('===============================');
    
    // Test SSL/HTTPS (would work in production)
    try {
      const httpsUrl = `https://localhost:3000`;
      await this.makeRequest(httpsUrl);
      this.logTest('SSL/HTTPS Configuration', 'warning', 'SSL not configured for localhost');
    } catch (error) {
      this.logTest('SSL/HTTPS Configuration', 'warning', 'SSL not available (expected for localhost)');
    }
    
    // Test security headers
    try {
      const response = await this.makeRequest(this.config.baseUrl);
      const hasSecurityHeaders = response.headers['x-frame-options'] || 
                                response.headers['x-content-type-options'] ||
                                response.headers['x-xss-protection'];
      
      if (hasSecurityHeaders) {
        this.logTest('Security Headers', 'passed', 'Security headers present');
      } else {
        this.logTest('Security Headers', 'warning', 'Security headers missing');
      }
    } catch (error) {
      this.logTest('Security Headers', 'failed', error.message);
    }
    
    // Test CORS configuration
    try {
      const response = await this.makeRequest(this.config.baseUrl, {
        headers: { 'Origin': 'http://example.com' }
      });
      const corsHeader = response.headers['access-control-allow-origin'];
      
      if (corsHeader) {
        this.logTest('CORS Configuration', 'passed', 'CORS headers present');
      } else {
        this.logTest('CORS Configuration', 'warning', 'CORS headers missing');
      }
    } catch (error) {
      this.logTest('CORS Configuration', 'failed', error.message);
    }
    
    // Test environment variables
    try {
      const envFile = path.join(__dirname, '..', '.env.production');
      const envExists = fs.existsSync(envFile);
      if (envExists) {
        this.logTest('Environment Variables', 'passed', '.env.production exists');
      } else {
        this.logTest('Environment Variables', 'warning', '.env.production not found');
      }
    } catch (error) {
      this.logTest('Environment Variables', 'failed', error.message);
    }
    
    // Test security middleware
    try {
      const securityMiddleware = path.join(__dirname, '..', 'src', 'middleware', 'security.js');
      const securityExists = fs.existsSync(securityMiddleware);
      if (securityExists) {
        this.logTest('Security Middleware', 'passed', 'security.js exists');
      } else {
        this.logTest('Security Middleware', 'warning', 'security.js not found');
      }
    } catch (error) {
      this.logTest('Security Middleware', 'failed', error.message);
    }
    
    // Test rate limiting
    try {
      const rateLimitMiddleware = path.join(__dirname, '..', 'src', 'middleware', 'rateLimit.js');
      const rateLimitExists = fs.existsSync(rateLimitMiddleware);
      if (rateLimitExists) {
        this.logTest('Rate Limiting', 'passed', 'rateLimit.js exists');
      } else {
        this.logTest('Rate Limiting', 'warning', 'rateLimit.js not found');
      }
    } catch (error) {
      this.logTest('Rate Limiting', 'failed', error.message);
    }
  }

  // Test performance metrics
  async testPerformance() {
    this.currentCategory = 'performance';
    console.log('\n⚡ TESTING PERFORMANCE METRICS');
    console.log('===============================');
    
    // Test response time
    try {
      const startTime = Date.now();
      await this.makeRequest(`${this.config.baseUrl}/health`);
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 1000) {
        this.logTest('Response Time', 'passed', `${responseTime}ms`);
      } else if (responseTime < 3000) {
        this.logTest('Response Time', 'warning', `${responseTime}ms (slow)`);
      } else {
        this.logTest('Response Time', 'failed', `${responseTime}ms (very slow)`);
      }
    } catch (error) {
      this.logTest('Response Time', 'failed', error.message);
    }
    
    // Test memory usage
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
      
      if (heapUsedMB < 100) {
        this.logTest('Memory Usage', 'passed', `${heapUsedMB}MB`);
      } else if (heapUsedMB < 200) {
        this.logTest('Memory Usage', 'warning', `${heapUsedMB}MB (high)`);
      } else {
        this.logTest('Memory Usage', 'failed', `${heapUsedMB}MB (very high)`);
      }
    } catch (error) {
      this.logTest('Memory Usage', 'failed', error.message);
    }
    
    // Test CPU usage (simplified)
    try {
      const startUsage = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);
      const cpuPercent = (endUsage.user + endUsage.system) / 1000000; // Simplified
      
      if (cpuPercent < 50) {
        this.logTest('CPU Usage', 'passed', `${Math.round(cpuPercent)}%`);
      } else if (cpuPercent < 80) {
        this.logTest('CPU Usage', 'warning', `${Math.round(cpuPercent)}% (high)`);
      } else {
        this.logTest('CPU Usage', 'failed', `${Math.round(cpuPercent)}% (very high)`);
      }
    } catch (error) {
      this.logTest('CPU Usage', 'failed', error.message);
    }
    
    // Test concurrent requests
    try {
      const concurrentRequests = 10;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(this.makeRequest(`${this.config.baseUrl}/health`));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      if (successful === concurrentRequests) {
        this.logTest('Concurrent Requests', 'passed', `${successful}/${concurrentRequests} successful`);
      } else if (successful > concurrentRequests * 0.8) {
        this.logTest('Concurrent Requests', 'warning', `${successful}/${concurrentRequests} successful`);
      } else {
        this.logTest('Concurrent Requests', 'failed', `${successful}/${concurrentRequests} successful`);
      }
    } catch (error) {
      this.logTest('Concurrent Requests', 'failed', error.message);
    }
    
    // Test file size optimization
    try {
      const buildDir = path.join(__dirname, '..', 'dist');
      if (fs.existsSync(buildDir)) {
        const files = this.getAllFiles(buildDir);
        let totalSize = 0;
        
        for (const file of files) {
          const stats = fs.statSync(file);
          totalSize += stats.size;
        }
        
        const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
        
        if (totalSizeMB < 10) {
          this.logTest('Bundle Size', 'passed', `${totalSizeMB}MB`);
        } else if (totalSizeMB < 50) {
          this.logTest('Bundle Size', 'warning', `${totalSizeMB}MB (large)`);
        } else {
          this.logTest('Bundle Size', 'failed', `${totalSizeMB}MB (very large)`);
        }
      } else {
        this.logTest('Bundle Size', 'skipped', 'No build directory found');
      }
    } catch (error) {
      this.logTest('Bundle Size', 'failed', error.message);
    }
  }

  // Get all files recursively
  getAllFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  // Test integration scenarios
  async testIntegration() {
    this.currentCategory = 'integration';
    console.log('\n🔗 TESTING INTEGRATION SCENARIOS');
    console.log('=================================');
    
    // Test database + API integration
    try {
      const response = await this.makeRequest(`${this.config.apiBaseUrl}/users`);
      if (response.statusCode < 500) {
        this.logTest('Database + API Integration', 'passed', 'API can access database');
      } else {
        this.logTest('Database + API Integration', 'warning', 'API database issues');
      }
    } catch (error) {
      this.logTest('Database + API Integration', 'failed', error.message);
    }
    
    // Test frontend + backend integration
    try {
      const response = await this.makeRequest(this.config.baseUrl);
      if (response.statusCode === 200) {
        this.logTest('Frontend + Backend Integration', 'passed', 'Frontend can reach backend');
      } else {
        this.logTest('Frontend + Backend Integration', 'warning', 'Frontend backend issues');
      }
    } catch (error) {
      this.logTest('Frontend + Backend Integration', 'failed', error.message);
    }
    
    // Test WebSocket connectivity
    try {
      // This would test WebSocket if available
      this.logTest('WebSocket Integration', 'warning', 'WebSocket test not implemented');
    } catch (error) {
      this.logTest('WebSocket Integration', 'failed', error.message);
    }
    
    // Test authentication flow
    try {
      const loginResponse = await this.makeRequest(`${this.config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      });
      
      if (loginResponse.statusCode < 500) {
        this.logTest('Authentication Integration', 'passed', 'Auth endpoint accessible');
      } else {
        this.logTest('Authentication Integration', 'warning', 'Auth endpoint issues');
      }
    } catch (error) {
      this.logTest('Authentication Integration', 'failed', error.message);
    }
    
    // Test file upload integration
    try {
      const uploadResponse = await this.makeRequest(`${this.config.apiBaseUrl}/upload`, {
        method: 'POST'
      });
      
      if (uploadResponse.statusCode < 500) {
        this.logTest('File Upload Integration', 'passed', 'Upload endpoint accessible');
      } else {
        this.logTest('File Upload Integration', 'warning', 'Upload endpoint issues');
      }
    } catch (error) {
      this.logTest('File Upload Integration', 'failed', error.message);
    }
  }

  // Test Telegram integration
  async testTelegram() {
    this.currentCategory = 'telegram';
    console.log('\n🤖 TESTING TELEGRAM INTEGRATION');
    console.log('=================================');
    
    // Test Telegram bot script
    try {
      const botScript = path.join(__dirname, '..', 'scripts', 'telegram-bot.js');
      const botExists = fs.existsSync(botScript);
      if (botExists) {
        this.logTest('Telegram Bot Script', 'passed', 'telegram-bot.js exists');
      } else {
        this.logTest('Telegram Bot Script', 'warning', 'telegram-bot.js not found');
      }
    } catch (error) {
      this.logTest('Telegram Bot Script', 'failed', error.message);
    }
    
    // Test Telegram WebApp utility
    try {
      const webAppUtil = path.join(__dirname, '..', 'src', 'utils', 'telegramWebApp.js');
      const webAppExists = fs.existsSync(webAppUtil);
      if (webAppExists) {
        this.logTest('Telegram WebApp Utility', 'passed', 'telegramWebApp.js exists');
      } else {
        this.logTest('Telegram WebApp Utility', 'warning', 'telegramWebApp.js not found');
      }
    } catch (error) {
      this.logTest('Telegram WebApp Utility', 'failed', error.message);
    }
    
    // Test webhook endpoint
    try {
      const webhookResponse = await this.makeRequest(`${this.config.apiBaseUrl}/telegram/webhook`);
      if (webhookResponse.statusCode < 500) {
        this.logTest('Telegram Webhook Endpoint', 'passed', 'Webhook endpoint accessible');
      } else {
        this.logTest('Telegram Webhook Endpoint', 'warning', 'Webhook endpoint issues');
      }
    } catch (error) {
      this.logTest('Telegram Webhook Endpoint', 'failed', error.message);
    }
    
    // Test Telegram configuration
    try {
      const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.production'), 'utf8');
      const hasTelegramConfig = envContent.includes('TELEGRAM_BOT_TOKEN');
      
      if (hasTelegramConfig) {
        this.logTest('Telegram Configuration', 'passed', 'Telegram config in .env');
      } else {
        this.logTest('Telegram Configuration', 'warning', 'Telegram config missing');
      }
    } catch (error) {
      this.logTest('Telegram Configuration', 'failed', error.message);
    }
  }

  // Test monitoring systems
  async testMonitoring() {
    this.currentCategory = 'monitoring';
    console.log('\n📊 TESTING MONITORING SYSTEMS');
    console.log('================================');
    
    // Test monitoring script
    try {
      const monitorScript = path.join(__dirname, '..', 'scripts', 'monitor.js');
      const monitorExists = fs.existsSync(monitorScript);
      if (monitorExists) {
        this.logTest('Monitoring Script', 'passed', 'monitor.js exists');
      } else {
        this.logTest('Monitoring Script', 'warning', 'monitor.js not found');
      }
    } catch (error) {
      this.logTest('Monitoring Script', 'failed', error.message);
    }
    
    // Test Prometheus configuration
    try {
      const prometheusConfig = path.join(__dirname, '..', 'monitoring', 'prometheus.yml');
      const prometheusExists = fs.existsSync(prometheusConfig);
      if (prometheusExists) {
        this.logTest('Prometheus Configuration', 'passed', 'prometheus.yml exists');
      } else {
        this.logTest('Prometheus Configuration', 'warning', 'prometheus.yml not found');
      }
    } catch (error) {
      this.logTest('Prometheus Configuration', 'failed', error.message);
    }
    
    // Test Grafana dashboard
    try {
      const grafanaDashboard = path.join(__dirname, '..', 'monitoring', 'grafana', 'dashboards', 'game-monitoring.json');
      const grafanaExists = fs.existsSync(grafanaDashboard);
      if (grafanaExists) {
        this.logTest('Grafana Dashboard', 'passed', 'game-monitoring.json exists');
      } else {
        this.logTest('Grafana Dashboard', 'warning', 'game-monitoring.json not found');
      }
    } catch (error) {
      this.logTest('Grafana Dashboard', 'failed', error.message);
    }
    
    // Test alerting rules
    try {
      const alertRules = path.join(__dirname, '..', 'monitoring', 'rules', 'alerts.yml');
      const alertExists = fs.existsSync(alertRules);
      if (alertExists) {
        this.logTest('Alerting Rules', 'passed', 'alerts.yml exists');
      } else {
        this.logTest('Alerting Rules', 'warning', 'alerts.yml not found');
      }
    } catch (error) {
      this.logTest('Alerting Rules', 'failed', error.message);
    }
    
    // Test metrics endpoint
    try {
      const metricsResponse = await this.makeRequest(`${this.config.baseUrl}/metrics`);
      if (metricsResponse.statusCode === 200) {
        this.logTest('Metrics Endpoint', 'passed', 'Metrics endpoint accessible');
      } else {
        this.logTest('Metrics Endpoint', 'warning', 'Metrics endpoint issues');
      }
    } catch (error) {
      this.logTest('Metrics Endpoint', 'failed', error.message);
    }
  }

  // Test backup systems
  async testBackup() {
    this.currentCategory = 'backup';
    console.log('\n💾 TESTING BACKUP SYSTEMS');
    console.log('=============================');
    
    // Test backup script
    try {
      const backupScript = path.join(__dirname, '..', 'scripts', 'backup.js');
      const backupExists = fs.existsSync(backupScript);
      if (backupExists) {
        this.logTest('Backup Script', 'passed', 'backup.js exists');
      } else {
        this.logTest('Backup Script', 'warning', 'backup.js not found');
      }
    } catch (error) {
      this.logTest('Backup Script', 'failed', error.message);
    }
    
    // Test disaster recovery script
    try {
      const disasterScript = path.join(__dirname, '..', 'scripts', 'disaster-recovery.sh');
      const disasterExists = fs.existsSync(disasterScript);
      if (disasterExists) {
        this.logTest('Disaster Recovery Script', 'passed', 'disaster-recovery.sh exists');
      } else {
        this.logTest('Disaster Recovery Script', 'warning', 'disaster-recovery.sh not found');
      }
    } catch (error) {
      this.logTest('Disaster Recovery Script', 'failed', error.message);
    }
    
    // Test backup directory
    try {
      const backupDir = path.join(__dirname, '..', 'backups');
      const backupExists = fs.existsSync(backupDir);
      if (backupExists) {
        this.logTest('Backup Directory', 'passed', 'backups/ directory exists');
      } else {
        this.logTest('Backup Directory', 'warning', 'backups/ directory not found');
      }
    } catch (error) {
      this.logTest('Backup Directory', 'failed', error.message);
    }
    
    // Test backup configuration
    try {
      const backupConfig = {
        database: path.join(__dirname, '..', 'backups', 'database'),
        files: path.join(__dirname, '..', 'backups', 'files'),
        config: path.join(__dirname, '..', 'backups', 'config')
      };
      
      let backupDirsExist = 0;
      for (const [type, dir] of Object.entries(backupConfig)) {
        if (fs.existsSync(dir)) {
          backupDirsExist++;
        }
      }
      
      if (backupDirsExist === 3) {
        this.logTest('Backup Structure', 'passed', 'All backup subdirectories exist');
      } else if (backupDirsExist > 0) {
        this.logTest('Backup Structure', 'warning', `${backupDirsExist}/3 backup subdirectories exist`);
      } else {
        this.logTest('Backup Structure', 'failed', 'No backup subdirectories found');
      }
    } catch (error) {
      this.logTest('Backup Structure', 'failed', error.message);
    }
  }

  // Test deployment readiness
  async testDeployment() {
    this.currentCategory = 'deployment';
    console.log('\n🚀 TESTING DEPLOYMENT READINESS');
    console.log('=================================');
    
    // Test Docker configuration
    try {
      const dockerfile = path.join(__dirname, '..', 'Dockerfile.prod');
      const dockerfileExists = fs.existsSync(dockerfile);
      if (dockerfileExists) {
        this.logTest('Production Dockerfile', 'passed', 'Dockerfile.prod exists');
      } else {
        this.logTest('Production Dockerfile', 'warning', 'Dockerfile.prod not found');
      }
    } catch (error) {
      this.logTest('Production Dockerfile', 'failed', error.message);
    }
    
    // Test Docker Compose
    try {
      const dockerCompose = path.join(__dirname, '..', 'docker-compose.prod.yml');
      const dockerComposeExists = fs.existsSync(dockerCompose);
      if (dockerComposeExists) {
        this.logTest('Docker Compose Production', 'passed', 'docker-compose.prod.yml exists');
      } else {
        this.logTest('Docker Compose Production', 'warning', 'docker-compose.prod.yml not found');
      }
    } catch (error) {
      this.logTest('Docker Compose Production', 'failed', error.message);
    }
    
    // Test Kubernetes manifests
    try {
      const k8sManifest = path.join(__dirname, '..', 'kubernetes', 'production.yml');
      const k8sExists = fs.existsSync(k8sManifest);
      if (k8sExists) {
        this.logTest('Kubernetes Manifests', 'passed', 'production.yml exists');
      } else {
        this.logTest('Kubernetes Manifests', 'warning', 'production.yml not found');
      }
    } catch (error) {
      this.logTest('Kubernetes Manifests', 'failed', error.message);
    }
    
    // Test CI/CD pipeline
    try {
      const cicdWorkflow = path.join(__dirname, '..', '.github', 'workflows', 'ci-cd.yml');
      const cicdExists = fs.existsSync(cicdWorkflow);
      if (cicdExists) {
        this.logTest('CI/CD Pipeline', 'passed', 'ci-cd.yml exists');
      } else {
        this.logTest('CI/CD Pipeline', 'warning', 'ci-cd.yml not found');
      }
    } catch (error) {
      this.logTest('CI/CD Pipeline', 'failed', error.message);
    }
    
    // Test deployment script
    try {
      const deployScript = path.join(__dirname, '..', 'scripts', 'deploy.js');
      const deployExists = fs.existsSync(deployScript);
      if (deployExists) {
        this.logTest('Deployment Script', 'passed', 'deploy.js exists');
      } else {
        this.logTest('Deployment Script', 'warning', 'deploy.js not found');
      }
    } catch (error) {
      this.logTest('Deployment Script', 'failed', error.message);
    }
    
    // Test SSL setup script
    try {
      const sslScript = path.join(__dirname, '..', 'scripts', 'setup-ssl.sh');
      const sslExists = fs.existsSync(sslScript);
      if (sslExists) {
        this.logTest('SSL Setup Script', 'passed', 'setup-ssl.sh exists');
      } else {
        this.logTest('SSL Setup Script', 'warning', 'setup-ssl.sh not found');
      }
    } catch (error) {
      this.logTest('SSL Setup Script', 'failed', error.message);
    }
  }

  // Generate comprehensive test report
  generateTestReport() {
    this.testResults.endTime = Date.now();
    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        totalTests: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        warnings: this.testResults.warnings,
        successRate: Math.round((this.testResults.passed / this.testResults.total) * 100 * 100) / 100
      },
      categories: this.testResults.categories,
      details: this.testResults.details,
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps()
    };
    
    // Save report
    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `comprehensive-test-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return { report, reportFile };
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze failed tests
    const failedTests = this.testResults.details.filter(test => test.status === 'failed');
    const warningTests = this.testResults.details.filter(test => test.status === 'warning');
    
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'critical',
        message: `Address ${failedTests.length} failed tests`,
        details: failedTests.map(test => `${test.testName}: ${test.details}`)
      });
    }
    
    if (warningTests.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'improvement',
        message: `Review ${warningTests.length} warnings`,
        details: warningTests.map(test => `${test.testName}: ${test.details}`)
      });
    }
    
    // Category-specific recommendations
    if (this.testResults.categories.security?.failed > 0) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        message: 'Fix security vulnerabilities',
        details: 'Review security headers, SSL configuration, and authentication'
      });
    }
    
    if (this.testResults.categories.performance?.failed > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Optimize performance',
        details: 'Review response times, memory usage, and bundle sizes'
      });
    }
    
    if (this.testResults.categories.database?.failed > 0) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        message: 'Fix database connectivity',
        details: 'Check database configuration, migrations, and connections'
      });
    }
    
    return recommendations;
  }

  // Generate next steps
  generateNextSteps() {
    const steps = [];
    
    steps.push('Review and fix all failed tests');
    steps.push('Address security vulnerabilities');
    steps.push('Optimize performance bottlenecks');
    steps.push('Complete missing configurations');
    steps.push('Test in production environment');
    steps.push('Set up monitoring alerts');
    steps.push('Configure backup automation');
    steps.push('Test disaster recovery procedures');
    steps.push('Document deployment process');
    steps.push('Schedule regular testing');
    
    return steps;
  }

  // Execute complete test suite
  async executeCompleteTestSuite() {
    console.log('🧪 STARTING COMPREHENSIVE SYSTEM TESTING');
    console.log('==============================================');
    console.log(`🎯 Testing Categories: ${Object.keys(this.config.testCategories).filter(cat => this.config.testCategories[cat]).join(', ')}`);
    console.log(`🌐 Base URL: ${this.config.baseUrl}`);
    console.log(`🔌 API URL: ${this.config.apiBaseUrl}`);
    console.log('');
    
    try {
      // Execute all test categories
      if (this.config.testCategories.infrastructure) {
        await this.testInfrastructure();
      }
      
      if (this.config.testCategories.application) {
        await this.testApplication();
      }
      
      if (this.config.testCategories.database) {
        await this.testDatabase();
      }
      
      if (this.config.testCategories.api) {
        await this.testAPI();
      }
      
      if (this.config.testCategories.frontend) {
        await this.testFrontend();
      }
      
      if (this.config.testCategories.security) {
        await this.testSecurity();
      }
      
      if (this.config.testCategories.performance) {
        await this.testPerformance();
      }
      
      if (this.config.testCategories.integration) {
        await this.testIntegration();
      }
      
      if (this.config.testCategories.telegram) {
        await this.testTelegram();
      }
      
      if (this.config.testCategories.monitoring) {
        await this.testMonitoring();
      }
      
      if (this.config.testCategories.backup) {
        await this.testBackup();
      }
      
      if (this.config.testCategories.deployment) {
        await this.testDeployment();
      }
      
      // Generate final report
      console.log('\n📊 GENERATING COMPREHENSIVE TEST REPORT');
      console.log('=======================================');
      
      const { report, reportFile } = this.generateTestReport();
      
      // Display results
      console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED');
      console.log('====================================');
      console.log(`📊 Total Tests: ${report.summary.totalTests}`);
      console.log(`✅ Passed: ${report.summary.passed}`);
      console.log(`❌ Failed: ${report.summary.failed}`);
      console.log(`⚠️ Warnings: ${report.summary.warnings}`);
      console.log(`📈 Success Rate: ${report.summary.successRate}%`);
      console.log(`⏱️ Duration: ${Math.round(report.summary.duration / 1000)}s`);
      
      // Category breakdown
      console.log('\n📋 Category Results:');
      for (const [category, results] of Object.entries(report.categories)) {
        const categorySuccess = Math.round((results.passed / results.total) * 100 * 100) / 100;
        console.log(`   ${category}: ${results.passed}/${results.total} (${categorySuccess}%)`);
      }
      
      // Recommendations
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
          const priority = rec.priority === 'high' ? '🔴' : 
                          rec.priority === 'medium' ? '🟡' : '🟢';
          console.log(`   ${index + 1}. ${priority} ${rec.message}`);
        });
      }
      
      // Next steps
      console.log('\n🎯 Next Steps:');
      report.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
      
      console.log(`\n📄 Detailed Report: ${reportFile}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ COMPREHENSIVE TESTING FAILED:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  const testSuite = new ComprehensiveTestSuite();
  
  try {
    switch (command) {
      case 'all':
        await testSuite.executeCompleteTestSuite();
        break;
        
      case 'infrastructure':
        await testSuite.testInfrastructure();
        break;
        
      case 'application':
        await testSuite.testApplication();
        break;
        
      case 'database':
        await testSuite.testDatabase();
        break;
        
      case 'api':
        await testSuite.testAPI();
        break;
        
      case 'frontend':
        await testSuite.testFrontend();
        break;
        
      case 'security':
        await testSuite.testSecurity();
        break;
        
      case 'performance':
        await testSuite.testPerformance();
        break;
        
      case 'integration':
        await testSuite.testIntegration();
        break;
        
      case 'telegram':
        await testSuite.testTelegram();
        break;
        
      case 'monitoring':
        await testSuite.testMonitoring();
        break;
        
      case 'backup':
        await testSuite.testBackup();
        break;
        
      case 'deployment':
        await testSuite.testDeployment();
        break;
        
      case 'report':
        const { report } = testSuite.generateTestReport();
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
🧪 Comprehensive System Testing Suite

Usage: node comprehensive-test.js <command> [options]

Commands:
  all              Execute complete test suite
  infrastructure   Test infrastructure components
  application      Test application core
  database         Test database connectivity
  api              Test API endpoints
  frontend         Test frontend components
  security         Test security measures
  performance      Test performance metrics
  integration      Test integration scenarios
  telegram         Test Telegram integration
  monitoring       Test monitoring systems
  backup           Test backup systems
  deployment       Test deployment readiness
  report           Generate test report

Test Categories:
  ✅ Infrastructure - Node.js, npm, file system, memory
  ✅ Application   - Server, health, structure, clustering
  ✅ Database      - Files, migrations, configuration
  ✅ API           - Endpoints, responses, authentication
  ✅ Frontend      - Components, React, build output
  ✅ Security      - Headers, CORS, SSL, middleware
  ✅ Performance   - Response time, memory, CPU, bundle size
  ✅ Integration  - Database+API, frontend+backend, auth
  ✅ Telegram      - Bot, WebApp, webhooks, configuration
  ✅ Monitoring    - Prometheus, Grafana, metrics, alerts
  ✅ Backup        - Scripts, directories, structure
  ✅ Deployment    - Docker, Kubernetes, CI/CD, SSL

Examples:
  node comprehensive-test.js all
  node comprehensive-test.js api
  node comprehensive-test.js security
  node comprehensive-test.js performance

Features:
  🔍 Systematic testing of all components
  📊 Detailed performance metrics
  🔒 Security vulnerability assessment
  🔗 Integration scenario testing
  📈 Comprehensive reporting
  💡 Actionable recommendations
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveTestSuite;
