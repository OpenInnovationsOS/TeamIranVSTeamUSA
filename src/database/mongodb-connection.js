const mongoose = require('mongoose');

let isConnected = false;

async function connectDatabase() {
  try {
    if (isConnected) {
      console.log('MongoDB already connected');
      return;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/team-iran-vs-usa';
    
    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

function getConnection() {
  if (!isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return mongoose.connection;
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

module.exports = {
  connectDatabase,
  getConnection,
  disconnectDatabase,
  mongoose
};
