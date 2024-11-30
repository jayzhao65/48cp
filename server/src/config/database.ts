import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://appUser:your_password@172.28.196.67:27017/48cp?authSource=48cp';

mongoose.set('strictQuery', false);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      directConnection: false,
      ssl: false,
      retryWrites: true,
    });
    
    const db = conn.connection.db!;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    if (!collectionNames.includes('questionnaires')) {
      await db.createCollection('questionnaires');
      console.log('Created questionnaires collection');
    }

    console.log('MongoDB connected and collections checked');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};