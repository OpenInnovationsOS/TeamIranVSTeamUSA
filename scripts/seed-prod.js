#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const DatabaseMigrator = require('./migrate-prod');

// Seed data for production database
const seedData = {
  users: [
    {
      id: 'admin_user',
      username: 'admin',
      display_name: 'System Administrator',
      bio: 'Game administrator with full access',
      faction: 'iran',
      level: 100,
      experience: 1000000,
      stg_balance: 1000000,
      win_claimable: 0,
      favorite_weapon: 'quantum_blade',
      preferred_territory: 'tehran',
      public_profile: false
    }
  ],
  
  guilds: [
    {
      id: 'elite_guardians',
      name: 'Elite Guardians',
      description: 'The most powerful guild in the game',
      faction: 'iran',
      leader_id: 'admin_user',
      max_members: 50,
      current_members: 1,
      power: 10000
    }
  ],
  
  territories: [
    {
      id: 'tehran',
      name: 'Tehran',
      faction: 'iran',
      controller_id: 'admin_user',
      attack_bonus: 1.2,
      defense_bonus: 1.3,
      daily_revenue: 1000,
      strategic_value: 10,
      climate: 'arid',
      difficulty: 'hard'
    }
  ]
};

class DatabaseSeeder {
  constructor(env = 'development') {
    this.env = env;
    this.migrator = new DatabaseMigrator(env);
  }

  async connect() {
    await this.migrator.connect();
  }

  async disconnect() {
    await this.migrator.disconnect();
  }

  async seed() {
    console.log(`🌱 Starting database seeding for ${this.env} environment`);
    
    await this.connect();
    
    try {
      await this.seedUsers();
      await this.seedGuilds();
      await this.seedTerritories();
      
      console.log('🎉 Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    
    for (const user of seedData.users) {
      const sql = `
        INSERT OR REPLACE INTO users (
          id, username, display_name, bio, faction, level, experience,
          stg_balance, win_claimable, favorite_weapon, preferred_territory,
          public_profile, created_at, updated_at, last_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.migrator.run(sql, [
        user.id, user.username, user.display_name, user.bio, user.faction,
        user.level, user.experience, user.stg_balance, user.win_claimable,
        user.favorite_weapon, user.preferred_territory, user.public_profile,
        new Date().toISOString(), new Date().toISOString(), new Date().toISOString()
      ]);
    }
    
    console.log(`✅ Seeded ${seedData.users.length} users`);
  }
}

async function main() {
  const [command] = process.argv.slice(2);
  const env = process.env.NODE_ENV || 'development';
  
  const seeder = new DatabaseSeeder(env);
  
  try {
    switch (command) {
      case 'seed':
        await seeder.seed();
        break;
        
      default:
        console.log('🌱 Database Seeding CLI - Use: node seed-prod.js seed');
        break;
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseSeeder;
