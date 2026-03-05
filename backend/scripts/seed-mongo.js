require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Battle = require('../src/models/Battle');
const Payment = require('../src/models/Payment');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Generate random data
const generateRandomTelegramId = () => {
  return Math.floor(Math.random() * 900000000) + 100000000;
};

const generateRandomUsername = (faction) => {
  const prefixes = faction === 'iran' ? ['Ali', 'Reza', 'Mohammad', 'Hassan', 'Saeed'] : ['John', 'Mike', 'David', 'Chris', 'Alex'];
  const suffixes = ['Player', 'Gamer', 'Master', 'Pro', 'Legend', 'Warrior', 'Hero'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${prefix}${suffix}${number}`;
};

const generateRandomLevel = () => {
  return Math.floor(Math.random() * 25) + 1;
};

const generateRandomTokens = (level) => {
  const baseTokens = 1000;
  const levelBonus = level * 100;
  return baseTokens + levelBonus + Math.floor(Math.random() * 5000);
};

// Seed users
const seedUsers = async () => {
  console.log('👥 Seeding users...');

  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    const users = [];
    const factions = ['iran', 'usa'];
    const usersPerFaction = 50;

    // Generate users for each faction
    for (const faction of factions) {
      for (let i = 0; i < usersPerFaction; i++) {
        const level = generateRandomLevel();
        const wins = Math.floor(Math.random() * level * 10);
        const losses = Math.floor(Math.random() * level * 5);
        const totalBattles = wins + losses;
        const winRate = totalBattles > 0 ? wins / totalBattles : 0;
        const rank = Math.floor(Math.random() * 1000) + 1;

        const user = new User({
          telegram_id: generateRandomTelegramId(),
          username: generateRandomUsername(faction),
          faction: faction,
          game_stats: {
            level: level,
            experience: level * 1000 + Math.floor(Math.random() * 5000),
            stg_tokens: generateRandomTokens(level),
            energy: Math.floor(Math.random() * 50) + 50,
            max_energy: 100 + (level * 10),
            wins: wins,
            losses: losses,
            total_battles: totalBattles,
            win_rate: winRate,
            rank: rank
          },
          inventory: {
            weapons: [`weapon_${Math.floor(Math.random() * 10) + 1}`],
            cosmetics: [`cosmetic_${Math.floor(Math.random() * 5) + 1}`],
            boosts: Math.random() > 0.7 ? [{
              type: 'energy_boost',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              multiplier: 2.0
            }] : []
          },
          premium_features: Math.random() > 0.8 ? [{
            feature_id: 'energy_boost',
            name: 'Energy Boost',
            monthly_price: 2.00,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active'
          }] : [],
          social: {
            friends: [],
            guild: Math.random() > 0.7 ? `${faction}_elite` : null,
            chat_preferences: {
              global_chat: Math.random() > 0.1,
              faction_chat: Math.random() > 0.05,
              private_messages: Math.random() > 0.2
            }
          },
          achievements: [
            {
              achievement_id: 'first_battle',
              name: 'First Battle',
              description: 'Participated in your first battle',
              points: 10,
              unlocked_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            }
          ],
          last_active: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          is_active: Math.random() > 0.1,
          is_banned: false
        });

        users.push(user);
      }
    }

    // Insert users in batches
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await User.insertMany(batch);
      console.log(`📝 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
    }

    console.log(`✅ Created ${users.length} users`);
    return users;

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed battles
const seedBattles = async (users) => {
  console.log('⚔️ Seeding battles...');

  try {
    // Clear existing battles
    await Battle.deleteMany({});
    console.log('🗑️ Cleared existing battles');

    const battles = [];
    const battleTypes = ['normal', 'tournament', 'quick'];
    const statuses = ['pending', 'in_progress', 'completed'];
    const numBattles = 100;

    for (let i = 0; i < numBattles; i++) {
      // Select random players
      const player1 = users[Math.floor(Math.random() * users.length)];
      const player2 = users[Math.floor(Math.random() * users.length)];
      
      // Ensure players are from different factions
      const availablePlayers = users.filter(u => u.faction !== player1.faction);
      const opponent = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

      const stakeAmount = [100, 250, 500, 1000, 2500, 5000][Math.floor(Math.random() * 6)];
      const battleType = battleTypes[Math.floor(Math.random() * battleTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const feeRate = battleType === 'tournament' ? 0.05 : 
                     battleType === 'quick' ? 0.01 : 0.02;
      const feeAmount = Math.floor(stakeAmount * feeRate);

      const battle = new Battle({
        battle_id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        players: [
          {
            user_id: player1._id,
            telegram_id: player1.telegram_id,
            username: player1.username,
            faction: player1.faction,
            level: player1.game_stats.level,
            deck: [`card_${Math.floor(Math.random() * 10) + 1}`, `card_${Math.floor(Math.random() * 10) + 1}`],
            current_health: status === 'completed' ? 0 : Math.floor(Math.random() * 50) + 50,
            max_health: 100,
            energy: status === 'completed' ? 0 : Math.floor(Math.random() * 30) + 20,
            max_energy: 50,
            moves: status === 'completed' ? [
              {
                turn: 1,
                action: 'attack',
                damage: Math.floor(Math.random() * 50) + 25,
                timestamp: new Date()
              }
            ] : [],
            total_damage_dealt: status === 'completed' ? Math.floor(Math.random() * 100) + 50 : 0,
            total_damage_taken: status === 'completed' ? Math.floor(Math.random() * 100) + 50 : 0
          },
          {
            user_id: opponent._id,
            telegram_id: opponent.telegram_id,
            username: opponent.username,
            faction: opponent.faction,
            level: opponent.game_stats.level,
            deck: [`card_${Math.floor(Math.random() * 10) + 1}`, `card_${Math.floor(Math.random() * 10) + 1}`],
            current_health: status === 'completed' ? 100 : Math.floor(Math.random() * 50) + 50,
            max_health: 100,
            energy: status === 'completed' ? 0 : Math.floor(Math.random() * 30) + 20,
            max_energy: 50,
            moves: status === 'completed' ? [
              {
                turn: 2,
                action: 'defend',
                timestamp: new Date()
              }
            ] : [],
            total_damage_dealt: status === 'completed' ? Math.floor(Math.random() * 100) + 50 : 0,
            total_damage_taken: status === 'completed' ? Math.floor(Math.random() * 100) + 50 : 0
          }
        ],
        battle_config: {
          stake_amount: stakeAmount,
          battle_type: battleType,
          fee_amount: feeAmount,
          max_turns: 50,
          time_limit_per_turn: 300
        },
        result: status === 'completed' ? {
          winner: Math.random() > 0.5 ? player1._id : opponent._id,
          loser: Math.random() > 0.5 ? opponent._id : player1._id,
          outcome: Math.random() > 0.5 ? 'player1_win' : 'player2_win',
          duration_seconds: Math.floor(Math.random() * 300) + 60,
          total_turns: Math.floor(Math.random() * 20) + 5,
          experience_gained: {
            winner: Math.floor(Math.random() * 100) + 50,
            loser: Math.floor(Math.random() * 50) + 25
          },
          stg_tokens_transferred: stakeAmount - feeAmount,
          fee_collected: feeAmount
        } : {},
        status: status,
        current_turn: status === 'in_progress' ? Math.floor(Math.random() * 2) : 0,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        started_at: status !== 'pending' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null,
        completed_at: status === 'completed' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null
      });

      battles.push(battle);
    }

    // Insert battles in batches
    const batchSize = 10;
    for (let i = 0; i < battles.length; i += batchSize) {
      const batch = battles.slice(i, i + batchSize);
      await Battle.insertMany(batch);
      console.log(`⚔️ Inserted battle batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(battles.length / batchSize)}`);
    }

    console.log(`✅ Created ${battles.length} battles`);
    return battles;

  } catch (error) {
    console.error('❌ Error seeding battles:', error);
    throw error;
  }
};

// Seed payments
const seedPayments = async (users) => {
  console.log('💰 Seeding payments...');

  try {
    // Clear existing payments
    await Payment.deleteMany({});
    console.log('🗑️ Cleared existing payments');

    const payments = [];
    const paymentTypes = ['token_purchase', 'energy_boost_purchase', 'premium_subscription', 'battle_fee'];
    const paymentMethods = ['ton', 'stripe', 'coinbase'];
    const statuses = ['completed', 'pending', 'failed'];
    const tokenPacks = ['stg_1k', 'stg_5k', 'stg_10k', 'stg_50k'];
    const premiumFeatures = ['energy_boost', 'custom_avatar', 'battle_analytics', 'vip_chat'];
    const energyBoostPacks = ['energy_10', 'energy_25', 'energy_50', 'energy_100'];

    const tokenPackDetails = {
      'stg_1k': { name: '1,000 STG Tokens', amount: 1000, price: 1.99, bonus: 0 },
      'stg_5k': { name: '5,000 STG Tokens', amount: 5000, price: 5.99, bonus: 500 },
      'stg_10k': { name: '10,000 STG Tokens', amount: 10000, price: 10.99, bonus: 1500 },
      'stg_50k': { name: '50,000 STG Tokens', amount: 50000, price: 29.99, bonus: 10000 }
    };

    const featureDetails = {
      'energy_boost': { name: 'Energy Boost', monthly: 2.00 },
      'custom_avatar': { name: 'Custom Avatar', monthly: 5.00 },
      'battle_analytics': { name: 'Battle Analytics', monthly: 3.00 },
      'vip_chat': { name: 'VIP Chat', monthly: 4.00 }
    };

    const numPayments = 200;

    const energyBoostPackDetails = {
      'energy_10': { name: '10 Energy Boosts', amount: 10, price: 2.99, bonus: 0 },
      'energy_25': { name: '25 Energy Boosts', amount: 25, price: 6.99, bonus: 3 },
      'energy_50': { name: '50 Energy Boosts', amount: 50, price: 12.99, bonus: 8 },
      'energy_100': { name: '100 Energy Boosts', amount: 100, price: 24.99, bonus: 20 }
    };

    for (let i = 0; i < numPayments; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      let productDetails = {};

      if (paymentType === 'token_purchase') {
        const packId = tokenPacks[Math.floor(Math.random() * tokenPacks.length)];
        const pack = tokenPackDetails[packId];
        productDetails = {
          product_id: packId,
          name: pack.name,
          amount: pack.amount,
          bonus: pack.bonus,
          price_usd: pack.price,
          currency: 'USD',
          category: 'STG_TOKEN_PACKS',
          wallet: process.env.STG_TOKENS_WALLET || '0:stg_tokens_wallet'
        };
      } else if (paymentType === 'energy_boost_purchase') {
        const packId = energyBoostPacks[Math.floor(Math.random() * energyBoostPacks.length)];
        const pack = energyBoostPackDetails[packId];
        productDetails = {
          product_id: packId,
          name: pack.name,
          amount: pack.amount,
          bonus: pack.bonus,
          price_usd: pack.price,
          currency: 'USD',
          category: 'ENERGY_BOOSTS',
          wallet: process.env.PREMIUM_FEATURES_WALLET || '0:premium_features_wallet'
        };
      } else if (paymentType === 'premium_subscription') {
        const featureId = premiumFeatures[Math.floor(Math.random() * premiumFeatures.length)];
        const feature = featureDetails[featureId];
        productDetails = {
          product_id: featureId,
          name: feature.name,
          amount: 0,
          bonus: 0,
          price_usd: feature.monthly,
          currency: 'USD',
          category: 'PREMIUM_FEATURES',
          wallet: process.env.PREMIUM_FEATURES_WALLET || '0:premium_features_wallet'
        };
      } else if (paymentType === 'battle_fee') {
        productDetails = {
          product_id: `battle_fee_${i}`,
          name: 'Battle Fee',
          amount: 0,
          bonus: 0,
          price_usd: Math.floor(Math.random() * 50) + 1,
          currency: 'USD',
          category: 'BATTLE_FEES',
          wallet: process.env.TON_ADMIN_WALLET || '0:admin_wallet'
        };
      }

      const payment = new Payment({
        transaction_id: paymentType === 'token_purchase' ? 
          `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` :
          `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user._id,
        type: paymentType,
        product_details: productDetails,
        payment_method: paymentMethod,
        blockchain: {
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          wallet_address: productDetails.wallet,
          gas_used: Math.floor(Math.random() * 50000) + 21000,
          gas_price: (Math.random() * 0.001 + 0.000001).toString(),
          confirmation_count: Math.floor(Math.random() * 20) + 1
        },
        status: status,
        processed_at: status !== 'pending' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });

      payments.push(payment);
    }

    // Insert payments in batches
    const batchSize = 10;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      await Payment.insertMany(batch);
      console.log(`💰 Inserted payment batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(payments.length / batchSize)}`);
    }

    console.log(`✅ Created ${payments.length} payments`);
    return payments;

  } catch (error) {
    console.error('❌ Error seeding payments:', error);
    throw error;
  }
};

// Main seeding function
const seed = async () => {
  console.log('🌱 Starting MongoDB seeding...');

  try {
    // Connect to MongoDB
    await connectDB();

    // Seed data
    const users = await seedUsers();
    await seedBattles(users);
    await seedPayments(users);

    console.log('✅ MongoDB seeding completed successfully!');
    console.log('📊 Database is ready with sample data');

    // Display statistics
    const userCount = await User.countDocuments();
    const battleCount = await Battle.countDocuments();
    const paymentCount = await Payment.countDocuments();

    console.log('\n📈 Seeding Statistics:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`⚔️ Battles: ${battleCount}`);
    console.log(`💰 Payments: ${paymentCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
