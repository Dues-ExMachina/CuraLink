/**
 * ─────────────────────────────────────────────────────────────────
 * MongoDB Connection Configuration
 * ─────────────────────────────────────────────────────────────────
 * Primary: MongoDB Atlas (from MONGODB_URI in .env)
 * Fallback: mongodb-memory-server (in-memory, local, zero config)
 *
 * This fallback means the app works perfectly for development and
 * demos even without a network connection to Atlas. Data resets on
 * each server restart (acceptable for prototype demos).
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null; // Hold reference to in-memory server if started

/**
 * Attempts to connect to Atlas. If it fails, spins up an in-memory
 * MongoDB instance automatically so the app is always runnable.
 */
const connectDB = async () => {
  // ─── Try Atlas first ─────────────────────────────────────────────
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB Atlas connected: ${mongoose.connection.host}`);
    return;
  } catch (atlasError) {
    console.warn(`⚠️  Atlas unreachable (${atlasError.message})`);
    console.log('🔄 Starting local in-memory MongoDB as fallback...');
  }

  // ─── Fallback: Start in-memory MongoDB ───────────────────────────
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ In-memory MongoDB started (data resets on restart)');
    console.log('💡 Tip: Fix MONGODB_URI in .env for persistent storage');
  } catch (memError) {
    console.error('❌ Both Atlas and in-memory MongoDB failed:', memError.message);
    // Still don't crash — routes will return DB errors gracefully
  }
};

/**
 * Gracefully stops the in-memory server on process exit.
 */
const closeDB = async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

process.on('SIGINT', async () => { await closeDB(); process.exit(0); });
process.on('SIGTERM', async () => { await closeDB(); process.exit(0); });

module.exports = { connectDB };
