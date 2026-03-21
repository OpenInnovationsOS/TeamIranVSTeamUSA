#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Environment configuration loader and validator
class EnvironmentManager {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = {};
    this.requiredVars = [
      'NODE_ENV',
      'PORT',
      'DB_TYPE',
      'JWT_SECRET'
    ];
    
    this.load();
  }

  load() {
    console.log(`🔧 Loading environment configuration for: ${this.env}`);
    
    // Load environment-specific file
    const envFile = path.join(__dirname, '..', `.env.${this.env}`);
    const exampleFile = path.join(__dirname, '..', `.env.${this.env}.example`);
    
    // Try to load actual env file first
    if (fs.existsSync(envFile)) {
      console.log(`📄 Loading environment from: ${envFile}`);
      this.loadFromFile(envFile);
    } else if (fs.existsSync(exampleFile)) {
      console.log(`📄 Loading example environment from: ${exampleFile}`);
      this.loadFromFile(exampleFile);
      console.warn('⚠️ Using example environment file. Please create .env.production');
    } else {
      console.log('📄 Using default environment configuration');
      this.setDefaults();
    }
    
    // Override with process.env (system environment)
    this.loadFromProcess();
    
    // Validate configuration
    this.validate();
    
    // Set derived values
    this.setDerivedValues();
    
    console.log('✅ Environment configuration loaded successfully');
  }

  loadFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip comments and empty lines
        if (trimmed.startsWith('#') || trimmed === '') {
          continue;
        }
        
        // Parse key=value pairs
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          this.config[key] = value;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load environment file ${filePath}:`, error);
      throw error;
    }
  }

  loadFromProcess() {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.config[key] = value;
      }
    }
  }

  setDefaults() {
    const defaults = {
      NODE_ENV: 'development',
      PORT: '3000',
      HOST: '0.0.0.0',
      DB_TYPE: 'sqlite',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'team_iran_vs_usa',
      DB_USER: 'postgres',
      DB_PASSWORD: '',
      DB_SSL: 'false',
      DB_POOL_SIZE: '10',
      DB_TIMEOUT: '30000',
      
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
      REDIS_DB: '0',
      REDIS_TTL: '3600',
      
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      JWT_EXPIRES_IN: '7d',
      JWT_REFRESH_EXPIRES_IN: '30d',
      
      TELEGRAM_BOT_TOKEN: '',
      TELEGRAM_WEBHOOK_URL: '',
      TELEGRAM_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      
      APP_NAME: 'Team Iran vs USA',
      APP_URL: 'http://localhost:3000',
      API_URL: 'http://localhost:3000/api',
      STATIC_URL: 'http://localhost:3000/static',
      
      CORS_ORIGIN: 'http://localhost:3000',
      RATE_LIMIT_WINDOW: '15',
      RATE_LIMIT_MAX: '100',
      RATE_LIMIT_MAX_LOGIN: '5',
      HELMET_ENABLED: 'true',
      XSS_PROTECTION: 'true',
      
      LOG_LEVEL: 'info',
      ANALYTICS_ENABLED: 'false',
      
      COMPRESSION_ENABLED: 'true',
      COMPRESSION_LEVEL: '6',
      CLUSTER_WORKERS: '2',
      MAX_MEMORY: '1024M',
      
      WS_PORT: '3001',
      WS_HEARTBEAT_INTERVAL: '30000',
      WS_MAX_CONNECTIONS: '1000',
      
      ENABLE_REAL_TIME_BATTLES: 'true',
      ENABLE_TOURNAMENTS: 'true',
      ENABLE_STAKING: 'true',
      ENABLE_MARKETPLACE: 'true',
      ENABLE_PREMIUM_FEATURES: 'true',
      
      MAINTENANCE_MODE: 'false',
      MAINTENANCE_MESSAGE: 'System under maintenance. Please try again later.',
      
      ADMIN_KEYS: 'admin123,superadmin456',
      ADMIN_EMAIL: 'admin@example.com',
      
      SESSION_SECRET: crypto.randomBytes(64).toString('hex'),
      SESSION_MAX_AGE: '86400000',
      SESSION_SECURE: 'false',
      SESSION_HTTP_ONLY: 'true',
      
      API_RATE_LIMIT_WINDOW: '60',
      API_RATE_LIMIT_MAX: '1000',
      API_RATE_LIMIT_MAX_UPLOAD: '10',
      
      DB_MIN_POOL: '2',
      DB_MAX_POOL: '10',
      DB_ACQUIRE_TIMEOUT: '60000',
      DB_IDLE_TIMEOUT: '300000',
      
      STATIC_CACHE_CONTROL: 'max-age=3600',
      DYNAMIC_CACHE_CONTROL: 'max-age=300, must-revalidate',
      
      HEALTH_CHECK_ENDPOINT: '/health',
      HEALTH_CHECK_INTERVAL: '30000',
      
      GRACEFUL_SHUTDOWN_TIMEOUT: '30000',
      
      WS_PING_INTERVAL: '25000',
      WS_PONG_TIMEOUT: '5000',
      WS_MAX_RECONNECT_ATTEMPTS: '5',
      
      METRICS_ENDPOINT: '/metrics',
      HEALTH_ENDPOINT: '/health',
      STATUS_ENDPOINT: '/status'
    };
    
    for (const [key, value] of Object.entries(defaults)) {
      if (this.config[key] === undefined) {
        this.config[key] = value;
      }
    }
  }

  validate() {
    console.log('🔍 Validating environment configuration...');
    
    const errors = [];
    const warnings = [];
    
    // Check required variables
    for (const varName of this.requiredVars) {
      if (!this.config[varName]) {
        errors.push(`Required environment variable ${varName} is missing`);
      }
    }
    
    // Validate numeric values
    const numericVars = [
      'PORT', 'DB_PORT', 'REDIS_PORT', 'WS_PORT',
      'RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX', 'CLUSTER_WORKERS'
    ];
    
    for (const varName of numericVars) {
      const value = this.config[varName];
      if (value && isNaN(parseInt(value))) {
        errors.push(`${varName} must be a valid number, got: ${value}`);
      }
    }
    
    // Validate boolean values
    const booleanVars = [
      'HELMET_ENABLED', 'XSS_PROTECTION', 'ANALYTICS_ENABLED',
      'COMPRESSION_ENABLED', 'MAINTENANCE_MODE',
      'ENABLE_REAL_TIME_BATTLES', 'ENABLE_TOURNAMENTS',
      'ENABLE_STAKING', 'ENABLE_MARKETPLACE', 'ENABLE_PREMIUM_FEATURES'
    ];
    
    for (const varName of booleanVars) {
      const value = this.config[varName];
      if (value && !['true', 'false'].includes(value.toLowerCase())) {
        warnings.push(`${varName} should be 'true' or 'false', got: ${value}`);
      }
    }
    
    // Security validations
    if (this.env === 'production') {
      if (this.config.JWT_SECRET && this.config.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }
      
      if (this.config.SESSION_SECRET && this.config.SESSION_SECRET.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters in production');
      }
      
      if (this.config.DB_PASSWORD === '' || this.config.DB_PASSWORD === 'your_secure_password_here') {
        errors.push('DB_PASSWORD must be set in production');
      }
      
      if (this.config.TELEGRAM_BOT_TOKEN === '' || this.config.TELEGRAM_BOT_TOKEN.includes('your_')) {
        errors.push('TELEGRAM_BOT_TOKEN must be set in production');
      }
      
      if (this.config.ADMIN_KEYS.includes('admin123') || this.config.ADMIN_KEYS.includes('superadmin456')) {
        warnings.push('Default admin keys should be changed in production');
      }
    }
    
    // Database configuration validation
    if (this.config.DB_TYPE === 'postgres') {
      if (!this.config.DB_HOST || this.config.DB_HOST === 'localhost') {
        warnings.push('DB_HOST should be set to actual database server in production');
      }
    }
    
    // Report results
    if (errors.length > 0) {
      console.error('\n❌ Environment validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    
    if (warnings.length > 0) {
      console.warn('\n⚠️ Environment validation warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    console.log('✅ Environment validation passed');
  }

  setDerivedValues() {
    // Set derived configuration values
    this.config.IS_PRODUCTION = this.env === 'production';
    this.config.IS_DEVELOPMENT = this.env === 'development';
    this.config.IS_STAGING = this.env === 'staging';
    
    // Parse numeric values
    this.config.PORT_NUM = parseInt(this.config.PORT) || 3000;
    this.config.DB_PORT_NUM = parseInt(this.config.DB_PORT) || 5432;
    this.config.REDIS_PORT_NUM = parseInt(this.config.REDIS_PORT) || 6379;
    this.config.WS_PORT_NUM = parseInt(this.config.WS_PORT) || 3001;
    this.config.CLUSTER_WORKERS_NUM = parseInt(this.config.CLUSTER_WORKERS) || 2;
    
    // Parse boolean values
    const parseBool = (value) => value && value.toLowerCase() === 'true';
    this.config.HELMET_ENABLED_BOOL = parseBool(this.config.HELMET_ENABLED);
    this.config.XSS_PROTECTION_BOOL = parseBool(this.config.XSS_PROTECTION);
    this.config.ANALYTICS_ENABLED_BOOL = parseBool(this.config.ANALYTICS_ENABLED);
    this.config.COMPRESSION_ENABLED_BOOL = parseBool(this.config.COMPRESSION_ENABLED);
    this.config.MAINTENANCE_MODE_BOOL = parseBool(this.config.MAINTENANCE_MODE);
    
    // Parse list values
    this.config.CORS_ORIGINS = this.config.CORS_ORIGIN ? this.config.CORS_ORIGIN.split(',') : [];
    this.config.ADMIN_KEYS_LIST = this.config.ADMIN_KEYS ? this.config.ADMIN_KEYS.split(',') : [];
    
    // Set URLs
    this.config.FRONTEND_URL = this.config.APP_URL;
    this.config.BACKEND_URL = this.config.API_URL;
    
    // Database configuration
    this.config.DB_CONFIG = {
      type: this.config.DB_TYPE,
      host: this.config.DB_HOST,
      port: this.config.DB_PORT_NUM,
      database: this.config.DB_NAME,
      username: this.config.DB_USER,
      password: this.config.DB_PASSWORD,
      ssl: this.config.DB_SSL === 'true',
      pool: {
        min: parseInt(this.config.DB_MIN_POOL) || 2,
        max: parseInt(this.config.DB_MAX_POOL) || 10,
        acquireTimeoutMillis: parseInt(this.config.DB_ACQUIRE_TIMEOUT) || 60000,
        idleTimeoutMillis: parseInt(this.config.DB_IDLE_TIMEOUT) || 300000
      }
    };
    
    // Redis configuration
    this.config.REDIS_CONFIG = {
      host: this.config.REDIS_HOST,
      port: this.config.REDIS_PORT_NUM,
      password: this.config.REDIS_PASSWORD,
      db: parseInt(this.config.REDIS_DB) || 0,
      ttl: parseInt(this.config.REDIS_TTL) || 3600
    };
    
    // JWT configuration
    this.config.JWT_CONFIG = {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      refreshExpiresIn: this.config.JWT_REFRESH_EXPIRES_IN
    };
    
    // Rate limiting configuration
    this.config.RATE_LIMIT_CONFIG = {
      windowMs: parseInt(this.config.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
      max: parseInt(this.config.RATE_LIMIT_MAX) || 100,
      maxLogin: parseInt(this.config.RATE_LIMIT_MAX_LOGIN) || 5
    };
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  print() {
    console.log('\n📋 Environment Configuration:');
    console.log('================================');
    
    const safeKeys = [
      'NODE_ENV',
      'PORT',
      'HOST',
      'DB_TYPE',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'REDIS_HOST',
      'REDIS_PORT',
      'APP_URL',
      'API_URL',
      'CORS_ORIGIN',
      'HELMET_ENABLED',
      'COMPRESSION_ENABLED',
      'CLUSTER_WORKERS',
      'WS_PORT',
      'LOG_LEVEL',
      'ANALYTICS_ENABLED',
      'MAINTENANCE_MODE',
      'ENABLE_REAL_TIME_BATTLES',
      'ENABLE_TOURNAMENTS',
      'ENABLE_STAKING',
      'ENABLE_MARKETPLACE',
      'ENABLE_PREMIUM_FEATURES'
    ];
    
    for (const key of safeKeys) {
      const value = this.config[key];
      console.log(`${key}: ${value}`);
    }
    
    // Hide sensitive values
    const sensitiveKeys = ['JWT_SECRET', 'DB_PASSWORD', 'TELEGRAM_BOT_TOKEN'];
    console.log('\n🔒 Sensitive Configuration (hidden):');
    for (const key of sensitiveKeys) {
      const value = this.config[key];
      const isSet = value && value !== '' && !value.includes('your_');
      console.log(`${key}: ${isSet ? '✅ SET' : '❌ NOT SET'}`);
    }
    
    console.log('================================');
  }

  saveTemplate() {
    const templatePath = path.join(__dirname, '..', `.env.${this.env}.template`);
    
    const template = `# Environment Configuration Template for ${this.env}
# Copy this file to .env.${this.env} and update with your values

# Server Configuration
NODE_ENV=${this.config.NODE_ENV}
PORT=${this.config.PORT}
HOST=${this.config.HOST}

# Database Configuration
DB_TYPE=${this.config.DB_TYPE}
DB_HOST=${this.config.DB_HOST}
DB_PORT=${this.config.DB_PORT}
DB_NAME=${this.config.DB_NAME}
DB_USER=${this.config.DB_USER}
DB_PASSWORD=your_secure_password_here
DB_SSL=${this.config.DB_SSL}
DB_POOL_SIZE=${this.config.DB_POOL_SIZE}
DB_TIMEOUT=${this.config.DB_TIMEOUT}

# Redis Configuration
REDIS_HOST=${this.config.REDIS_HOST}
REDIS_PORT=${this.config.REDIS_PORT}
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=${this.config.REDIS_DB}
REDIS_TTL=${this.config.REDIS_TTL}

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=${this.config.JWT_EXPIRES_IN}
JWT_REFRESH_EXPIRES_IN=${this.config.JWT_REFRESH_EXPIRES_IN}

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here

# Application Configuration
APP_NAME=${this.config.APP_NAME}
APP_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
STATIC_URL=https://yourdomain.com/static

# Security Configuration
CORS_ORIGIN=https://yourdomain.com,https://t.me
RATE_LIMIT_WINDOW=${this.config.RATE_LIMIT_WINDOW}
RATE_LIMIT_MAX=${this.config.RATE_LIMIT_MAX}
RATE_LIMIT_MAX_LOGIN=${this.config.RATE_LIMIT_MAX_LOGIN}
HELMET_ENABLED=${this.config.HELMET_ENABLED}
XSS_PROTECTION=${this.config.XSS_PROTECTION}

# Monitoring and Analytics
LOG_LEVEL=${this.config.LOG_LEVEL}
ANALYTICS_ENABLED=${this.config.ANALYTICS_ENABLED}

# Performance Configuration
COMPRESSION_ENABLED=${this.config.COMPRESSION_ENABLED}
COMPRESSION_LEVEL=${this.config.COMPRESSION_LEVEL}
CLUSTER_WORKERS=${this.config.CLUSTER_WORKERS}
MAX_MEMORY=${this.config.MAX_MEMORY}

# WebSocket Configuration
WS_PORT=${this.config.WS_PORT}
WS_HEARTBEAT_INTERVAL=${this.config.WS_HEARTBEAT_INTERVAL}
WS_MAX_CONNECTIONS=${this.config.WS_MAX_CONNECTIONS}

# Feature Flags
ENABLE_REAL_TIME_BATTLES=${this.config.ENABLE_REAL_TIME_BATTLES}
ENABLE_TOURNAMENTS=${this.config.ENABLE_TOURNAMENTS}
ENABLE_STAKING=${this.config.ENABLE_STAKING}
ENABLE_MARKETPLACE=${this.config.ENABLE_MARKETPLACE}
ENABLE_PREMIUM_FEATURES=${this.config.ENABLE_PREMIUM_FEATURES}

# Maintenance Mode
MAINTENANCE_MODE=${this.config.MAINTENANCE_MODE}
MAINTENANCE_MESSAGE="${this.config.MAINTENANCE_MESSAGE}"

# Admin Configuration
ADMIN_KEYS=admin123,superadmin456,admin_prod_2024
ADMIN_EMAIL=admin@yourdomain.com
`;
    
    try {
      fs.writeFileSync(templatePath, template);
      console.log(`✅ Environment template saved to: ${templatePath}`);
    } catch (error) {
      console.error(`❌ Failed to save template: ${error}`);
    }
  }
}

// CLI interface
async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  const envManager = new EnvironmentManager();
  
  try {
    switch (command) {
      case 'validate':
        envManager.validate();
        break;
        
      case 'print':
        envManager.print();
        break;
        
      case 'template':
        envManager.saveTemplate();
        break;
        
      case 'get':
        if (args.length === 0) {
          console.error('❌ Please specify a key to get');
          process.exit(1);
        }
        const value = envManager.get(args[0]);
        console.log(`${args[0]}: ${value}`);
        break;
        
      case 'check':
        console.log('🔍 Checking environment configuration...');
        const missing = envManager.requiredVars.filter(varName => !envManager.get(varName));
        if (missing.length > 0) {
          console.error('❌ Missing required environment variables:');
          missing.forEach(varName => console.error(`  - ${varName}`));
          process.exit(1);
        } else {
          console.log('✅ All required environment variables are set');
        }
        break;
        
      default:
        console.log(`
🔧 Environment Configuration CLI

Usage: node env-config.js <command> [options]

Commands:
  validate    Validate environment configuration
  print       Print current environment configuration
  template     Generate environment configuration template
  get <key>   Get specific environment variable
  check       Check if all required variables are set

Examples:
  node env-config.js validate
  node env-config.js print
  node env-config.js template
  node env-config.js get PORT
  node env-config.js check
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Environment configuration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnvironmentManager;
