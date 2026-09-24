import 'dotenv/config';
import mongoose from 'mongoose';

let mongodInstance = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgap';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ MongoDB connected:', uri.replace(/:([^:@]+)@/, ':***@'));
  } catch (err) {
    console.log('⚠️ Primary MongoDB unreachable. Starting in-memory fallback...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const fs = await import('fs');
    const path = await import('path');

    const baseDbDir = path.resolve(process.cwd(), '.mongodb-data');
    if (fs.existsSync(baseDbDir)) {
      // Clean up previous run directories
      try {
        const files = fs.readdirSync(baseDbDir);
        for (const file of files) {
          const fullPath = path.join(baseDbDir, file);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      } catch (e) {}
    } else {
      fs.mkdirSync(baseDbDir, { recursive: true });
    }

    const runDir = path.join(baseDbDir, `db_${Date.now()}`);
    fs.mkdirSync(runDir, { recursive: true });

    mongodInstance = await MongoMemoryServer.create({
      instance: { dbPath: runDir }
    });

    await mongoose.connect(mongodInstance.getUri());
    console.log('✅ In-Memory MongoDB started');
    const { seedData } = await import('../seed/index.js');
    await seedData();
  }
}

async function cleanup() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (e) {}
}

process.once('SIGUSR2', async () => {
  await cleanup();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
