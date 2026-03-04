const { query } = require('./connection');

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        faction VARCHAR(50) CHECK (faction IN ('iran', 'usa')) NOT NULL,
        stg_balance BIGINT DEFAULT 0,
        win_claimable BIGINT DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience BIGINT DEFAULT 0,
        referral_code VARCHAR(50) UNIQUE,
        referred_by INTEGER REFERENCES users(id),
        ton_wallet_address VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create battles table
    await query(`
      CREATE TABLE IF NOT EXISTS battles (
        id SERIAL PRIMARY KEY,
        attacker_id INTEGER REFERENCES users(id) NOT NULL,
        defender_id INTEGER REFERENCES users(id) NOT NULL,
        winner_id INTEGER REFERENCES users(id),
        stg_wager BIGINT NOT NULL,
        battle_type VARCHAR(50) DEFAULT 'pvp',
        battle_data JSONB,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('ton', 'stg', 'win')),
        amount BIGINT NOT NULL,
        balance_after BIGINT NOT NULL,
        description TEXT,
        transaction_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create territories table
    await query(`
      CREATE TABLE IF NOT EXISTS territories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        controlling_faction VARCHAR(50) CHECK (controlling_faction IN ('iran', 'usa', 'neutral')),
        iran_score BIGINT DEFAULT 0,
        usa_score BIGINT DEFAULT 0,
        total_battles BIGINT DEFAULT 0,
        last_capture_time TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create daily_missions table
    await query(`
      CREATE TABLE IF NOT EXISTS daily_missions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        mission_type VARCHAR(50) NOT NULL,
        target_value INTEGER NOT NULL,
        stg_reward BIGINT NOT NULL,
        win_reward BIGINT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP
      )
    `);

    // Create user_missions table
    await query(`
      CREATE TABLE IF NOT EXISTS user_missions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        mission_id INTEGER REFERENCES daily_missions(id) NOT NULL,
        current_progress INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, mission_id)
      )
    `);

    // Create leaderboards table
    await query(`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('global', 'faction', 'daily', 'weekly')),
        faction VARCHAR(50),
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create game_events table
    await query(`
      CREATE TABLE IF NOT EXISTS game_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        rewards JSONB,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_events table
    await query(`
      CREATE TABLE IF NOT EXISTS user_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        event_id INTEGER REFERENCES game_events(id) NOT NULL,
        participation_data JSONB,
        rewards_earned JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      )
    `);

    // Create audit_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await query('CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_faction ON users(faction)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)');
    await query('CREATE INDEX IF NOT EXISTS idx_battles_attacker ON battles(attacker_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_battles_defender ON battles(defender_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
    await query('CREATE INDEX IF NOT EXISTS idx_territories_controlling_faction ON territories(controlling_faction)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_user_missions_completed ON user_missions(is_completed)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

    // Create trigger for updated_at timestamp
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await query(`CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    await query(`CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON territories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
