import 'dotenv/config';
import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgap';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected:', uri.replace(/:([^:@]+)@/, ':***@'));
  } catch (err) {
    console.log('⚠️ Primary MongoDB unreachable. Starting in-memory fallback...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('✅ In-Memory MongoDB started');
    const { seedData } = await import('../seed/index.js');
    await seedData();
  }
}
