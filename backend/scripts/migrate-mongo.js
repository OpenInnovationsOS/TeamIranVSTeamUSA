require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

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

// Create indexes for better performance
const createIndexes = async (db) => {
  console.log('📊 Creating database indexes...');

  try {
    // Users collection indexes
    await db.collection('users').createIndex({ telegram_id: 1 }, { unique: true });
    await db.collection('users').createIndex({ faction: 1 });
    await db.collection('users').createIndex({ 'game_stats.rank': 1 });
    await db.collection('users').createIndex({ 'game_stats.level': -1 });
    await db.collection('users').createIndex({ created_at: -1 });
    await db.collection('users').createIndex({ last_active: -1 });

    // Battles collection indexes
    await db.collection('battles').createIndex({ battle_id: 1 }, { unique: true });
    await db.collection('battles').createIndex({ 'players.user_id': 1 });
    await db.collection('battles').createIndex({ status: 1 });
    await db.collection('battles').createIndex({ created_at: -1 });
    await db.collection('battles').createIndex({ completed_at: -1 });
    await db.collection('battles').createIndex({ 'battle_config.battle_type': 1 });
    await db.collection('battles').createIndex({ 'result.winner': 1 });

    // Payments collection indexes
    await db.collection('payments').createIndex({ transaction_id: 1 }, { unique: true });
    await db.collection('payments').createIndex({ user_id: 1, created_at: -1 });
    await db.collection('payments').createIndex({ type: 1, status: 1 });
    await db.collection('payments').createIndex({ payment_method: 1 });
    await db.collection('payments').createIndex({ created_at: -1 });
    await db.collection('payments').createIndex({ 'blockchain.transaction_hash': 1 });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

// Create validation rules
const createValidationRules = async (db) => {
  console.log('🔧 Creating validation rules...');

  try {
    // Users collection validation
    await db.command({
      collMod: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['telegram_id', 'username', 'faction', 'game_stats'],
          properties: {
            telegram_id: {
              bsonType: 'number',
              minimum: 1,
              description: 'Telegram ID must be a positive number'
            },
            username: {
              bsonType: 'string',
              minLength: 3,
              maxLength: 30,
              description: 'Username must be 3-30 characters'
            },
            faction: {
              enum: ['iran', 'usa'],
              description: 'Faction must be either iran or usa'
            },
            game_stats: {
              bsonType: 'object',
              required: ['level', 'experience', 'stg_tokens', 'energy', 'wins', 'losses'],
              properties: {
                level: { bsonType: 'number', minimum: 1 },
                experience: { bsonType: 'number', minimum: 0 },
                stg_tokens: { bsonType: 'number', minimum: 0 },
                energy: { bsonType: 'number', minimum: 0, maximum: 100 },
                wins: { bsonType: 'number', minimum: 0 },
                losses: { bsonType: 'number', minimum: 0 }
              }
            }
          }
        }
      }
    });

    // Battles collection validation
    await db.command({
      collMod: 'battles',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['battle_id', 'players', 'battle_config', 'status'],
          properties: {
            battle_id: {
              bsonType: 'string',
              pattern: '^battle_[0-9]+_[a-z0-9]+$',
              description: 'Battle ID must follow pattern battle_<timestamp>_<hash>'
            },
            players: {
              bsonType: 'array',
              minItems: 2,
              maxItems: 2,
              items: {
                bsonType: 'object',
                required: ['user_id', 'telegram_id', 'username', 'faction', 'level']
              }
            },
            battle_config: {
              bsonType: 'object',
              required: ['stake_amount', 'battle_type'],
              properties: {
                stake_amount: { bsonType: 'number', minimum: 100 },
                battle_type: { enum: ['normal', 'tournament', 'quick'] }
              }
            },
            status: {
              enum: ['pending', 'in_progress', 'completed', 'cancelled', 'timeout']
            }
          }
        }
      }
    });

    // Payments collection validation
    await db.command({
      collMod: 'payments',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['transaction_id', 'user_id', 'type', 'product_details', 'payment_method', 'status'],
          properties: {
            transaction_id: {
              bsonType: 'string',
              pattern: '^(txn|sub)_[0-9]+_[a-z0-9]+$',
              description: 'Transaction ID must follow pattern txn_<timestamp>_<hash>'
            },
            type: {
              enum: ['token_purchase', 'premium_subscription', 'battle_fee', 'marketplace_commission']
            },
            product_details: {
              bsonType: 'object',
              required: ['product_id', 'name', 'price_usd'],
              properties: {
                price_usd: { bsonType: 'number', minimum: 0.99 }
              }
            },
            payment_method: {
              enum: ['ton', 'stripe', 'coinbase', 'paypal', 'crypto']
            },
            status: {
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
            }
          }
        }
      }
    });

    console.log('✅ Validation rules created successfully');
  } catch (error) {
    console.error('❌ Error creating validation rules:', error);
    // Don't throw error for validation rules as they might already exist
  }
};

// Main migration function
const migrate = async () => {
  console.log('🚀 Starting MongoDB migration...');

  try {
    // Connect to MongoDB
    const conn = await connectDB();
    const db = conn.connection.db;

    // Create collections if they don't exist
    const collections = ['users', 'battles', 'payments'];
    
    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`📁 Created collection: ${collectionName}`);
      } else {
        console.log(`📁 Collection already exists: ${collectionName}`);
      }
    }

    // Create indexes
    await createIndexes(db);

    // Create validation rules
    await createValidationRules(db);

    // Create text indexes for search functionality
    console.log('🔍 Creating text indexes...');
    await db.collection('users').createIndex({ 
      username: 'text', 
      'game_stats.faction': 'text' 
    });

    // Create compound indexes for complex queries
    console.log('🔗 Creating compound indexes...');
    await db.collection('battles').createIndex({ 
      status: 1, 
      created_at: -1, 
      'battle_config.battle_type': 1 
    });

    await db.collection('payments').createIndex({ 
      user_id: 1, 
      type: 1, 
      status: 1, 
      created_at: -1 
    });

    console.log('✅ MongoDB migration completed successfully!');
    console.log('📊 Database is ready for use');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
