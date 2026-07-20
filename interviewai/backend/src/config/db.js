const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using the URI provided in the
 * environment. If connection fails, it falls back to an in-memory
 * MongoDB server (MongoMemoryServer) so development/seeding can proceed.
 */
async function connectDB() {
  try {
    mongoose.set('strictQuery', true);

    const uri = process.env.MONGO_URI;
    console.log(`[db] Connecting to MongoDB...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000, // Fail fast if Atlas is unwhitelisted
    });

    console.log(`[db] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[db] MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });
  } catch (err) {
    console.warn(`[db] Failed to connect to MongoDB (${err.message}).`);
    console.log('[db] Attempting fallback to in-memory MongoDB (mongodb-memory-server)...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();

      // Override the process env URI for any other files requiring it
      process.env.MONGO_URI = mongoUri;

      const conn = await mongoose.connect(mongoUri);
      console.log(`[db] In-memory MongoDB connected: ${conn.connection.host}`);
      console.log(`[db] Connection URI: ${mongoUri}`);

      // Keep reference to prevent GC
      global.mongoServer = mongoServer;

      mongoose.connection.on('error', (err) => {
        console.error(`[db] In-memory MongoDB connection error: ${err}`);
      });
    } catch (fallbackErr) {
      console.error(`[db] Fallback to in-memory MongoDB failed: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
}

module.exports = connectDB;

