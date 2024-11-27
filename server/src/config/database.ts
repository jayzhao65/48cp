import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = 'mongodb://8.218.98.220:27017/48cp';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      authSource: 'admin'  // 添加这个选项
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};