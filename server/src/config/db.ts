import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI);
  console.log(`✅ MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
