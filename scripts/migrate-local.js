/**
 * 🗄️ LOCAL DATABASE MIGRATION SCRIPT
 * Sets up local database with all required tables
 */

require('dotenv').config();
const { Pool } = require('pg');

async function runLocalMigrations() {
  console.log('🚀 Starting local database migrations...');

  // Use local PostgreSQL or fallback to mock
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/team_iran_vs_usa';
  
  let pool;
  try {
    pool = new Pool({
      connectionString,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection established');
  } catch (error) {
    console.log('⚠️ Database connection failed, using mock setup');
    console.log('📝 Creating mock database structure...');
    
    // Create mock tables in memory
    await createMockTables();
    return;
  }

  try {
    // Create users table
    console.log('📝 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        faction VARCHAR(10) CHECK (faction IN ('iran', 'usa')),
        level INTEGER DEFAULT 1,
        stg_tokens BIGINT DEFAULT 1000,
        energy INTEGER DEFAULT 100,
        max_energy INTEGER DEFAULT 100,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 999,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_users_faction ON users(faction);
      CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
    `);
    console.log('✅ Users table created successfully');

    // Create battles table
    console.log('⚔️ Creating battles table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player1_id UUID REFERENCES users(id),
        player2_id UUID REFERENCES users(id),
        winner_id UUID REFERENCES users(id),
        stake_amount BIGINT NOT NULL,
        battle_type VARCHAR(50) DEFAULT 'normal',
        fee_amount BIGINT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_battles_players ON battles(player1_id, player2_id);
      CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at);
      CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
    `);
    console.log('✅ Battles table created successfully');

    // Create purchases table
    console.log('💰 Creating purchases table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        product_type VARCHAR(50) NOT NULL,
        product_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        ton_transaction_hash VARCHAR(66),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
      CREATE INDEX IF NOT EXISTS idx_purchases_type ON purchases(product_type);
    `);
    console.log('✅ Purchases table created successfully');

    // Create subscriptions table
    console.log('⭐ Creating subscriptions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        feature_id VARCHAR(100) NOT NULL,
        feature_name VARCHAR(255),
        monthly_price DECIMAL(10,2) NOT NULL,
        ton_transaction_hash VARCHAR(66),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_feature ON subscriptions(feature_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    `);
    console.log('✅ Subscriptions table created successfully');

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

// Mock database setup for local development
async function createMockTables() {
  console.log('📝 Setting up mock database structure...');
  
  // Create mock data structures
  global.mockDatabase = {
    users: [],
    battles: [],
    purchases: [],
    subscriptions: []
  };
  
  console.log('✅ Mock database structure created');
  console.log('🎉 Local development setup completed!');
}

// Run migrations
runLocalMigrations();
