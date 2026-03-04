const { connectDatabase } = require('./mongodb-connection');
const User = require('../models/User-mongo');
const Battle = require('../models/Battle-mongo');
const Transaction = require('../models/Transaction-mongo');

async function migrate() {
  try {
    console.log('Starting MongoDB migration...');
    
    // Connect to database
    await connectDatabase();
    
    // Create indexes (handled by Mongoose schemas automatically)
    console.log('✅ Database indexes created');
    
    // Test basic operations
    console.log('Testing database operations...');
    
    // Test user creation
    const testUser = await User.create({
      id: 999999,
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      faction: 'iran'
    });
    console.log('✅ Test user created:', testUser.telegram_id);
    
    // Test battle creation
    const testBattle = await Battle.createBattle({
      attacker_id: testUser._id,
      defender_id: testUser._id,
      stg_wager: 100,
      battle_type: 'pvp'
    });
    console.log('✅ Test battle created:', testBattle._id);
    
    // Test transaction creation
    const testTransaction = await Transaction.createTransaction({
      user_id: testUser._id,
      type: 'stg',
      amount: 100,
      balance_after: 200,
      description: 'Test transaction'
    });
    console.log('✅ Test transaction created:', testTransaction._id);
    
    // Clean up test data
    await Transaction.deleteOne({ _id: testTransaction._id });
    await Battle.deleteOne({ _id: testBattle._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test data cleaned up');
    
    console.log('✅ MongoDB migration completed successfully');
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
