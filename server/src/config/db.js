import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[Database] Custom DNS config notice:', dnsErr.message);
}

/**
 * Connect to MongoDB with robust event handling and retry logic
 */
export const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicresolve';
  // Strip surrounding quotes and whitespace if accidentally added in environment variables
  uri = uri.trim().replace(/^["']|["']$/g, '');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      heartbeatFrequencyMS: 15000,
      retryWrites: true,
      w: 'majority',
    });

    console.info(`[Database] MongoDB Connected: ${conn.connection.host}`);

    try {
      const { seedDatabase } = await import('../seeds/seedData.js');
      await seedDatabase();
    } catch (seedErr) {
      console.warn('[Database] Auto-seed info:', seedErr.message);
    }

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB runtime error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection dropped. Reconnecting automatically...');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('[Database] MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection failed: ${error.message}`);
    // In development, retry connection after 5 seconds
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Database] Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

/**
 * Check current MongoDB connection state
 */
export const getDBState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};
