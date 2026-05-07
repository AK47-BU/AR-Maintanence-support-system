const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const isPlaceholderUri = (uri) => {
  if (!uri) return true;
  return /<[^>]+>/.test(uri);
};

const connectWithMemoryServer = async () => {
  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'ar-maintenance'
    }
  });

  const memoryUri = memoryServer.getUri();
  const conn = await mongoose.connect(memoryUri);
  console.log(`MongoDB connected (in-memory): ${conn.connection.host}`);
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (isPlaceholderUri(mongoUri)) {
    console.warn('MONGODB_URI is not configured; using an in-memory MongoDB instance for local development.');
    await connectWithMemoryServer();
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Database connection error: ${error.message}`);
    console.warn('Falling back to an in-memory MongoDB instance for local development.');
    await connectWithMemoryServer();
  }
};

module.exports = connectDB;
