import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.NODE_ENV === 'production'
? 'mongodb://jayzhao:ilovediyi@8.218.98.220:27017/48cp'  // 生产环境
: 'mongodb://localhost:27017/48cp';     


export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected', MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};