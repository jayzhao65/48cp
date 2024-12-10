// 文件作用：后端应用程序的入口文件
// 主要功能：
// 1. 创建Express应用实例
// 2. 配置中间件（CORS、日志、错误处理等）
// 3. 设置路由
// 4. 启动服务器
// 与其他文件关系：
// - 使用 config/database.ts 连接数据库
// - 使用 routes/ 下的路由模块处理请求
// - 被 package.json 中的启动脚本调用
import express, { Request, Response, NextFunction } from 'express';
// cors 是一个中间件，用于处理跨域资源共享，允许其他域名的前端访问这个服务器
import cors from 'cors';
// 导入数据库连接函数，这个函数在 config/database.ts 中定义
import { connectDB } from './config/database';
// 导入问卷相关的路由处理模块
import questionnaireRoutes from './routes/questionnaire';
import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';
import coupleRoutes from './routes/couple';
import dashboardRoutes from './routes/dashboard';
import * as path from 'path';
import fs from 'fs';
import multer from 'multer';
import { initializeDirectories } from './utils/init';


// 创建一个 Express 应用实例
const app = express();

// 初始化必要的目录
initializeDirectories();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 调用数据库连接函数，连接到 MongoDB 数据库
connectDB();

// 配置CORS中间件，允许跨域请求
app.use(cors({
  origin: '*',  // 允许所有来源访问
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false  // 改为 false，因为 credentials 模式下不能用 '*'
}));

// 启用 JSON 解析，允许服务器解析请求体中的 JSON 数据
app.use(express.json());


// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../public/reports')));
// 设置路由
// 将所有以 '/api' 开头的请求转发到 questionnaireRoutes 处理
// 例如：/api/questionnaires 会被转发到问卷相关的处理函数
app.use('/api', [
    questionnaireRoutes,
    uploadRoutes,
    authRoutes,
    coupleRoutes,
    dashboardRoutes
  ]);
// 设置服务器端口
// process.env.PORT 读取环境变量中的 PORT 值，如果没有设置则使用 3001
const PORT = process.env.PORT || 3001;

// 添加错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    multerError: err instanceof multer.MulterError
  });
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: '文件上传失败：' + err.message,
      code: 'UPLOAD_ERROR'
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器，监听指定端口
// 服务器成功启动后，会在控制台打印消息
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('=================================');
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('=================================');
});