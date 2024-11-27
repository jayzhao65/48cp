import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? 'mongodb://jayzhao:ilovediyi@8.218.98.220:27017/48cp'  // 确保用户名和密码正确
  : 'mongodb://localhost:27017/48cp';

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