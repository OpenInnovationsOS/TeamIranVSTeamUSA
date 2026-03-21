const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, '..', 'data', 'game.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      bio TEXT,
      faction TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      stg_balance INTEGER DEFAULT 1000,
      win_claimable INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      favorite_weapon TEXT,
      preferred_territory TEXT,
      public_profile BOOLEAN DEFAULT 1
    )
  `);

  // User stats table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      battles_fought INTEGER DEFAULT 0,
      territories_conquered INTEGER DEFAULT 0,
      critical_hits INTEGER DEFAULT 0,
      highest_wager INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      missions_completed INTEGER DEFAULT 0,
      streak_best INTEGER DEFAULT 0,
      faction_contributions INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Equipment table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_equipment (
      user_id TEXT PRIMARY KEY,
      weapons_owned TEXT DEFAULT '["basic_sword"]',
      current_weapon TEXT DEFAULT 'basic_sword',
      armor_level INTEGER DEFAULT 1,
      boosters TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Social table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_social (
      user_id TEXT PRIMARY KEY,
      friends TEXT DEFAULT '[]',
      faction_mates TEXT DEFAULT '[]',
      rivals TEXT DEFAULT '[]',
      reputation INTEGER DEFAULT 50,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Guilds table
  db.run(`
    CREATE TABLE IF NOT EXISTS guilds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag TEXT NOT NULL,
      faction TEXT NOT NULL,
      description TEXT,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      power INTEGER DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      max_members INTEGER DEFAULT 50
    )
  `);

  // Guild members table
  db.run(`
    CREATE TABLE IF NOT EXISTS guild_members (
      guild_id TEXT,
      user_id TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      role TEXT DEFAULT 'member',
      PRIMARY KEY (guild_id, user_id),
      FOREIGN KEY (guild_id) REFERENCES guilds(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Territories table
  db.run(`
    CREATE TABLE IF NOT EXISTS territories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      controller TEXT NOT NULL,
      attack_bonus INTEGER DEFAULT 0,
      defense_bonus INTEGER DEFAULT 0,
      exp_bonus REAL DEFAULT 1.0,
      economic_bonus REAL DEFAULT 1.0,
      population INTEGER DEFAULT 0,
      strategic_value INTEGER DEFAULT 0,
      resource_output TEXT,
      daily_revenue INTEGER DEFAULT 0,
      defense_level INTEGER DEFAULT 1,
      climate TEXT,
      difficulty TEXT
    )
  `);

  // Territory control history
  db.run(`
    CREATE TABLE IF NOT EXISTS territory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      territory_id TEXT,
      previous_controller TEXT,
      new_controller TEXT,
      conquered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      conquering_user_id TEXT,
      FOREIGN KEY (territory_id) REFERENCES territories(id),
      FOREIGN KEY (conquering_user_id) REFERENCES users(id)
    )
  `);

  // Battles table
  db.run(`
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      attacker_id TEXT NOT NULL,
      defender_id TEXT NOT NULL,
      attacker_faction TEXT NOT NULL,
      defender_faction TEXT NOT NULL,
      attacker_weapon TEXT,
      defender_weapon TEXT,
      territory_id TEXT,
      wager INTEGER NOT NULL,
      result TEXT NOT NULL,
      reward INTEGER DEFAULT 0,
      experience INTEGER DEFAULT 0,
      battle_quality TEXT,
      critical_hit BOOLEAN DEFAULT 0,
      attack_power INTEGER,
      defense_power INTEGER,
      damage INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attacker_id) REFERENCES users(id),
      FOREIGN KEY (defender_id) REFERENCES users(id)
    )
  `);

  // Missions table
  db.run(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      target INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      reward_stg INTEGER DEFAULT 0,
      reward_exp INTEGER DEFAULT 0,
      difficulty TEXT,
      completed BOOLEAN DEFAULT 0,
      claimed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Marketplace items table
  db.run(`
    CREATE TABLE IF NOT EXISTS marketplace_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      rarity TEXT,
      effect_data TEXT,
      seller_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      item_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Staking pools table
  db.run(`
    CREATE TABLE IF NOT EXISTS staking_pools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      apy REAL NOT NULL,
      total_staked INTEGER DEFAULT 0,
      lock_period INTEGER NOT NULL,
      minimum_stake INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Staking positions table
  db.run(`
    CREATE TABLE IF NOT EXISTS staking_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      staked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unlock_time DATETIME,
      last_claimed DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES staking_pools(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Leaderboard snapshots
  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      date DATE NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Analytics events table
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('🗄️ Database initialized successfully');
}

// Database helper functions
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, username, faction, stg_balance)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run([userData.id, userData.username, userData.faction, userData.stg_balance], function(err) {
      if (err) {
        reject(err);
      } else {
        // Create related records
        Promise.all([
          createUserStats(userData.id),
          createUserEquipment(userData.id),
          createUserSocial(userData.id)
        ]).then(() => {
          resolve(userData);
        }).catch(reject);
      }
    });
    
    stmt.finalize();
  });
}

function createUserStats(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO user_stats (user_id) VALUES (?)
    `);
    
    stmt.run([userId], function(err) {
      if (err) reject(err);
      else resolve();
    });
    
    stmt.finalize();
  });
}

function createUserEquipment(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO user_equipment (user_id) VALUES (?)
    `);
    
    stmt.run([userId], function(err) {
      if (err) reject(err);
      else resolve();
    });
    
    stmt.finalize();
  });
}

function createUserSocial(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO user_social (user_id) VALUES (?)
    `);
    
    stmt.run([userId], function(err) {
      if (err) reject(err);
      else resolve();
    });
    
    stmt.finalize();
  });
}

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT u.*, us.*, ue.*, usoc.*
      FROM users u
      LEFT JOIN user_stats us ON u.id = us.user_id
      LEFT JOIN user_equipment ue ON u.id = ue.user_id
      LEFT JOIN user_social usoc ON u.id = usoc.user_id
      WHERE u.id = ?
    `);
    
    stmt.get([userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
    
    stmt.finalize();
  });
}

function updateUser(userId, updates) {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const stmt = db.prepare(`
      UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([...values, userId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
    
    stmt.finalize();
  });
}

function createBattle(battleData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO battles (
        id, attacker_id, defender_id, attacker_faction, defender_faction,
        attacker_weapon, defender_weapon, territory_id, wager, result,
        reward, experience, battle_quality, critical_hit, attack_power,
        defense_power, damage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      battleData.id, battleData.attacker_id, battleData.defender_id,
      battleData.attacker_faction, battleData.defender_faction,
      battleData.attacker_weapon, battleData.defender_weapon,
      battleData.territory_id, battleData.wager, battleData.result,
      battleData.reward, battleData.experience, battleData.battle_quality,
      battleData.critical_hit, battleData.attack_power, battleData.defense_power,
      battleData.damage
    ], function(err) {
      if (err) reject(err);
      else resolve(battleData);
    });
    
    stmt.finalize();
  });
}

function getUserBattles(userId, limit = 50) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM battles 
      WHERE attacker_id = ? OR defender_id = ?
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    stmt.all([userId, userId, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
    
    stmt.finalize();
  });
}

function createMission(missionData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO missions (
        id, user_id, name, description, type, target, progress,
        reward_stg, reward_exp, difficulty, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      missionData.id, missionData.user_id, missionData.name,
      missionData.description, missionData.type, missionData.target,
      missionData.progress, missionData.reward_stg, missionData.reward_exp,
      missionData.difficulty, missionData.created_at, missionData.expires_at
    ], function(err) {
      if (err) reject(err);
      else resolve(missionData);
    });
    
    stmt.finalize();
  });
}

function getUserMissions(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM missions 
      WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `);
    
    stmt.all([userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
    
    stmt.finalize();
  });
}

function updateMissionProgress(missionId, progress) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      UPDATE missions 
      SET progress = ?, completed = CASE WHEN ? >= target THEN 1 ELSE 0 END
      WHERE id = ?
    `);
    
    stmt.run([progress, progress, missionId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
    
    stmt.finalize();
  });
}

function createStakingPosition(stakingData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO staking_positions (pool_id, user_id, amount, unlock_time)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run([
      stakingData.pool_id, stakingData.user_id, stakingData.amount,
      stakingData.unlock_time
    ], function(err) {
      if (err) reject(err);
      else resolve(stakingData);
    });
    
    stmt.finalize();
  });
}

function getUserStakingPositions(userId) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT sp.*, sp.name as pool_name, sp.apy
      FROM staking_positions sp
      JOIN staking_pools sp ON sp.pool_id = sp.id
      WHERE sp.user_id = ?
      ORDER BY sp.staked_at DESC
    `);
    
    stmt.all([userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
    
    stmt.finalize();
  });
}

function logAnalyticsEvent(userId, eventType, eventData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO analytics_events (user_id, event_type, event_data)
      VALUES (?, ?, ?)
    `);
    
    stmt.run([userId, eventType, JSON.stringify(eventData)], function(err) {
      if (err) reject(err);
      else resolve();
    });
    
    stmt.finalize();
  });
}

// Initialize database on startup
initializeDatabase();

module.exports = {
  db,
  createUser,
  getUserById,
  updateUser,
  createBattle,
  getUserBattles,
  createMission,
  getUserMissions,
  updateMissionProgress,
  createStakingPosition,
  getUserStakingPositions,
  logAnalyticsEvent
};
