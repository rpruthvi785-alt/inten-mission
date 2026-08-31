const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/three_way_match_db';

  if (process.env.USE_MEMORY_DB === 'true' || mongoUri.includes('memory') || mongoUri.includes('mock')) {
    console.log('[Database] Running in in-memory database mode.');
    isConnected = false;
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 1500,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${mongoUri} (${err.message}).`);
    console.warn('[Database] Using memory mock mode for models.');
    isConnected = false;
    return null;
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
