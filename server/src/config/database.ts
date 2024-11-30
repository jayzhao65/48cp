// 文件作用：配置和管理MongoDB数据库连接
// 主要功能：
// 1. 建立与MongoDB的连接
// 2. 配置连接参数
// 3. 确保必要的数据集合存在
// 与其他文件关系：
// - 被 app.ts 调用来初始化数据库连接
// - 为所有需要数据库操作的控制器提供基础支持

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 数据库连接URI，如果环境变量未设置则使用默认值
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://appUser:48cpdiyi123@172.28.196.67:27017/48cp?authSource=48cp';

// 设置mongoose查询模式
mongoose.set('strictQuery', false);

// 数据库连接函数
export const connectDB = async () => {
  try {
    // 连接MongoDB数据库
    const conn = await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000,    // 连接超时时间：10秒
      socketTimeoutMS: 45000,     // Socket超时时间：45秒
      directConnection: false,    // 是否直接连接
      ssl: false,                // 是否使用SSL
      retryWrites: true,         // 是否启用重试写入
    });
    
    // 获取数据库实例
    const db = conn.connection.db!;
    
    // 获取所有集合名称
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // 如果questionnaires集合不存在，则创建它
    if (!collectionNames.includes('questionnaires')) {
      await db.createCollection('questionnaires');
      console.log('Created questionnaires collection');
    }

    console.log('MongoDB connected and collections checked');
  } catch (error) {
    // 如果连接失败，记录错误并退出程序
    console.error('MongoDB connection error:', error);
    process.exit(1);  // 退出码1表示异常退出
  }
};