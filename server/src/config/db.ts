import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connection is cached at module scope so that on serverless hosts (Vercel)
 * warm invocations reuse the socket instead of reconnecting on every request.
 * Locally the cache is simply hit once at boot.
 */
let connecting: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose
      .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
      .then((instance) => {
        console.log(`✅ MongoDB connected → ${instance.connection.host}/${instance.connection.name}`);
        instance.connection.on('error', (error) => console.error('MongoDB connection error:', error));
        return instance;
      })
      .catch((error) => {
        connecting = null; // allow the next request to retry
        throw error;
      });
  }

  await connecting;
}

export async function disconnectDatabase(): Promise<void> {
  connecting = null;
  await mongoose.disconnect();
}
