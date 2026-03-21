#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Database configuration
const config = {
  development: {
    type: 'sqlite',
    database: './data/team-iran-vs-usa-dev.db',
    options: {
      verbose: console.log
    }
  },
  staging: {
    type: 'sqlite',
    database: './data/team-iran-vs-usa-staging.db',
    options: {}
  },
  production: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'team_iran_vs_usa',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    options: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  }
};

// Migration system
class DatabaseMigrator {
  constructor(env = 'development') {
    this.env = env;
    this.config = config[env];
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.connection = null;
  }

  async connect() {
    console.log(`🔌 Connecting to ${this.config.type} database...`);
    
    try {
      if (this.config.type === 'sqlite') {
        // Ensure data directory exists
        const dataDir = path.dirname(this.config.database);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.connection = new sqlite3.Database(this.config.database);
        console.log(`✅ Connected to SQLite database: ${this.config.database}`);
      } else if (this.config.type === 'postgres') {
        this.connection = new Pool(this.config);
        await this.connection.connect();
        console.log(`✅ Connected to PostgreSQL database: ${this.config.database}`);
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      if (this.config.type === 'sqlite') {
        this.connection.close();
      } else if (this.config.type === 'postgres') {
        await this.connection.end();
      }
      console.log('🔌 Database connection closed');
    }
  }

  async createMigrationsTable() {
    const tableName = this.config.type === 'sqlite' ? 'migrations' : 'schema_migrations';
    
    if (this.config.type === 'sqlite') {
      const sql = `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await this.run(sql);
    } else if (this.config.type === 'postgres') {
      const sql = `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await this.query(sql);
    }
    
    console.log(`✅ Migrations table created/verified`);
  }

  async getExecutedMigrations() {
    const tableName = this.config.type === 'sqlite' ? 'migrations' : 'schema_migrations';
    const sql = `SELECT name FROM ${tableName} ORDER BY executed_at`;
    
    try {
      const migrations = await this.query(sql);
      return migrations.map(row => row.name);
    } catch (error) {
      // Table doesn't exist yet
      return [];
    }
  }

  async getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  async executeMigration(fileName) {
    const filePath = path.join(this.migrationsPath, fileName);
    const migrationSQL = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔄 Executing migration: ${fileName}`);
    
    try {
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        await this.query(statement);
      }
      
      // Record migration
      const tableName = this.config.type === 'sqlite' ? 'migrations' : 'schema_migrations';
      const recordSQL = this.config.type === 'sqlite' 
        ? `INSERT INTO migrations (name) VALUES (?)`
        : `INSERT INTO schema_migrations (name) VALUES ($1)`;
      
      await this.query(recordSQL, [fileName]);
      
      console.log(`✅ Migration completed: ${fileName}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${fileName}`, error);
      throw error;
    }
  }

  async query(sql, params = []) {
    if (this.config.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        this.connection.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    } else if (this.config.type === 'postgres') {
      const result = await this.connection.query(sql, params);
      return result.rows;
    }
  }

  async run(sql, params = []) {
    if (this.config.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        this.connection.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    } else if (this.config.type === 'postgres') {
      const result = await this.connection.query(sql, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    }
  }

  async migrate() {
    console.log(`🚀 Starting database migration for ${this.env} environment`);
    
    await this.connect();
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(file => 
      !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      await this.disconnect();
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully');
    await this.disconnect();
  }
}

// CLI interface
async function main() {
  const [command] = process.argv.slice(2);
  const env = process.env.NODE_ENV || 'development';
  
  const migrator = new DatabaseMigrator(env);
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
        
      default:
        console.log('📋 Database Migration CLI - Use: node migrate.js migrate');
        break;
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;
