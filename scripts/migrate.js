/**
 * 🗄️ DATABASE MIGRATION SCRIPT
 * Sets up Supabase database with all required tables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Create users table
    console.log('📝 Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        CREATE INDEX IF NOT EXISTS idx_users_faction ON users(faction);
        CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
      `
    });

    if (usersError) throw usersError;
    console.log('✅ Users table created successfully');

    // Create battles table
    console.log('⚔️ Creating battles table...');
    const { error: battlesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_battles_players ON battles(player1_id, player2_id);
        CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at);
        CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
      `
    });

    if (battlesError) throw battlesError;
    console.log('✅ Battles table created successfully');

    // Create purchases table
    console.log('💰 Creating purchases table...');
    const { error: purchasesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
        CREATE INDEX IF NOT EXISTS idx_purchases_type ON purchases(product_type);
      `
    });

    if (purchasesError) throw purchasesError;
    console.log('✅ Purchases table created successfully');

    // Create subscriptions table
    console.log('⭐ Creating subscriptions table...');
    const { error: subscriptionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_feature ON subscriptions(feature_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      `
    });

    if (subscriptionsError) throw subscriptionsError;
    console.log('✅ Subscriptions table created successfully');

    // Enable Row Level Security
    console.log('🔐 Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        
        -- Users can only see their own data
        CREATE POLICY IF NOT EXISTS "Users can view own data" ON users
          FOR ALL USING (auth.uid()::text = telegram_id::text);
          
        CREATE POLICY IF NOT EXISTS "Users can insert own data" ON users
          FOR INSERT WITH CHECK (auth.uid()::text = telegram_id::text);
          
        CREATE POLICY IF NOT EXISTS "Users can update own data" ON users
          FOR UPDATE USING (auth.uid()::text = telegram_id::text);
      `
    });

    if (rlsError) throw rlsError;
    console.log('✅ Row Level Security enabled successfully');

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
