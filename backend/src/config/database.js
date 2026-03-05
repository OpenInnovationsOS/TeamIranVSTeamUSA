const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // For development, if MongoDB is not running, use in-memory database
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI.includes('localhost')) {
      console.log('🗄️ Using in-memory database for development');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🗄️ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.log('🗄️ Continuing without MongoDB for development...');
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
