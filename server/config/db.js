import mongoose from 'mongoose';

// CRITICAL: fail fast when MongoDB is offline instead of hanging for buffering timeout
mongoose.set('bufferCommands', false);

export const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Connects to MongoDB using Mongoose.
 * Implements connection event listeners and graceful termination.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not configured — running with in-memory fallback store');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Not connected (${error.message}) — running with in-memory fallback store.`);
    return null;
  }
};

mongoose.connection.on('connected', () => {
  console.log('[Mongoose Event] Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Mongoose Event] Error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Mongoose Event] Disconnected from MongoDB');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Mongoose Event] Connection closed due to application termination (SIGINT)');
  process.exit(0);
});
