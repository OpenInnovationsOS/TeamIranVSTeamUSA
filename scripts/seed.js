/**
 * 🌱 DATABASE SEEDING SCRIPT
 * Populates database with initial data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed sample users
    console.log('👥 Seeding users...');
    const sampleUsers = [
      {
        telegram_id: 123456789,
        username: 'ProGamer',
        faction: 'usa',
        level: 25,
        stg_tokens: 50000,
        energy: 100,
        max_energy: 100,
        wins: 542,
        losses: 67,
        rank: 1
      },
      {
        telegram_id: 987654321,
        username: 'IranChamp',
        faction: 'iran',
        level: 23,
        stg_tokens: 35000,
        energy: 85,
        max_energy: 100,
        wins: 487,
        losses: 85,
        rank: 2
      },
      {
        telegram_id: 555666777,
        username: 'BattleKing',
        faction: 'usa',
        level: 22,
        stg_tokens: 28000,
        energy: 92,
        max_energy: 100,
        wins: 423,
        losses: 92,
        rank: 3
      },
      {
        telegram_id: 111222333,
        username: 'Player123',
        faction: 'iran',
        level: 15,
        stg_tokens: 12450,
        energy: 85,
        max_energy: 100,
        wins: 142,
        losses: 67,
        rank: 247
      }
    ];

    for (const user of sampleUsers) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'telegram_id' });
      
      if (error) throw error;
    }
    console.log(`✅ Seeded ${sampleUsers.length} users`);

    // Seed sample battles
    console.log('⚔️ Seeding battles...');
    const sampleBattles = [
      {
        player1_id: '00000000-0000-0000-0000-000000000001', // ProGamer
        player2_id: '00000000-0000-0000-0000-000000000002', // IranChamp
        winner_id: '00000000-0000-0000-0000-000000000001',
        stake_amount: 1000,
        battle_type: 'tournament',
        fee_amount: 50,
        status: 'completed',
        completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        player1_id: '00000000-0000-0000-0000-000000000002', // IranChamp
        player2_id: '00000000-0000-0000-0000-000000000003', // BattleKing
        winner_id: '00000000-0000-0000-0000-000000000002',
        stake_amount: 500,
        battle_type: 'normal',
        fee_amount: 10,
        status: 'completed',
        completed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const battle of sampleBattles) {
      const { error } = await supabase
        .from('battles')
        .insert(battle);
      
      if (error) throw error;
    }
    console.log(`✅ Seeded ${sampleBattles.length} battles`);

    // Seed sample purchases
    console.log('💰 Seeding purchases...');
    const samplePurchases = [
      {
        user_id: '00000000-0000-0000-0000-000000000004', // Player123
        product_type: 'stg_tokens',
        product_id: 'stg_5k',
        amount: 5.99,
        currency: 'USD',
        ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'completed',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: '00000000-0000-0000-0000-000000000004', // Player123
        product_type: 'premium',
        product_id: 'energy_boost',
        amount: 2.00,
        currency: 'USD',
        ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'completed',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const purchase of samplePurchases) {
      const { error } = await supabase
        .from('purchases')
        .insert(purchase);
      
      if (error) throw error;
    }
    console.log(`✅ Seeded ${samplePurchases.length} purchases`);

    // Seed sample subscriptions
    console.log('⭐ Seeding subscriptions...');
    const sampleSubscriptions = [
      {
        user_id: '00000000-0000-0000-0000-000000000004', // Player123
        feature_id: 'energy_boost',
        feature_name: 'Energy Boost',
        monthly_price: 2.00,
        ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: '00000000-0000-0000-0000-000000000001', // ProGamer
        feature_id: 'custom_avatar',
        feature_name: 'Custom Avatar',
        monthly_price: 5.00,
        ton_transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const subscription of sampleSubscriptions) {
      const { error } = await supabase
        .from('subscriptions')
        .insert(subscription);
      
      if (error) throw error;
    }
    console.log(`✅ Seeded ${sampleSubscriptions.length} subscriptions`);

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
