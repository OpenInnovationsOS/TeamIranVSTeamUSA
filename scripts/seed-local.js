/**
 * 🌱 LOCAL DATABASE SEEDING SCRIPT
 * Populates local database with initial data
 */

require('dotenv').config();

async function seedLocalDatabase() {
  console.log('🌱 Starting local database seeding...');

  try {
    // Seed mock database with sample data
    if (global.mockDatabase) {
      console.log('👥 Seeding users...');
      global.mockDatabase.users = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          telegram_id: 123456789,
          username: 'ProGamer',
          faction: 'usa',
          level: 25,
          stg_tokens: 50000,
          energy: 100,
          max_energy: 100,
          wins: 542,
          losses: 67,
          rank: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          telegram_id: 987654321,
          username: 'IranChamp',
          faction: 'iran',
          level: 23,
          stg_tokens: 35000,
          energy: 85,
          max_energy: 100,
          wins: 487,
          losses: 85,
          rank: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          telegram_id: 555666777,
          username: 'BattleKing',
          faction: 'usa',
          level: 22,
          stg_tokens: 28000,
          energy: 92,
          max_energy: 100,
          wins: 423,
          losses: 92,
          rank: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          telegram_id: 111222333,
          username: 'Player123',
          faction: 'iran',
          level: 15,
          stg_tokens: 12450,
          energy: 85,
          max_energy: 100,
          wins: 142,
          losses: 67,
          rank: 247,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      console.log(`✅ Seeded ${global.mockDatabase.users.length} users`);

      console.log('⚔️ Seeding battles...');
      global.mockDatabase.battles = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          player1_id: '00000000-0000-0000-0000-000000000001',
          player2_id: '00000000-0000-0000-0000-000000000002',
          winner_id: '00000000-0000-0000-0000-000000000001',
          stake_amount: 1000,
          battle_type: 'tournament',
          fee_amount: 50,
          status: 'completed',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          player1_id: '00000000-0000-0000-0000-000000000002',
          player2_id: '00000000-0000-0000-0000-000000000003',
          winner_id: '00000000-0000-0000-0000-000000000002',
          stake_amount: 500,
          battle_type: 'normal',
          fee_amount: 10,
          status: 'completed',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];
      console.log(`✅ Seeded ${global.mockDatabase.battles.length} battles`);

      console.log('💰 Seeding purchases...');
      global.mockDatabase.purchases = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000004',
          product_type: 'stg_tokens',
          product_id: 'stg_5k',
          amount: 5.99,
          currency: 'USD',
          ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'completed',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000004',
          product_type: 'premium',
          product_id: 'energy_boost',
          amount: 2.00,
          currency: 'USD',
          ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'completed',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      console.log(`✅ Seeded ${global.mockDatabase.purchases.length} purchases`);

      console.log('⭐ Seeding subscriptions...');
      global.mockDatabase.subscriptions = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000004',
          feature_id: 'energy_boost',
          feature_name: 'Energy Boost',
          monthly_price: 2.00,
          ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000001',
          feature_id: 'custom_avatar',
          feature_name: 'Custom Avatar',
          monthly_price: 5.00,
          ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
          status: 'active',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      console.log(`✅ Seeded ${global.mockDatabase.subscriptions.length} subscriptions`);
    }

    console.log('🎉 Local database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedLocalDatabase();
