// 导入必要的包和模块
// express 是一个 Node.js Web 应用框架，用于创建 Web 服务器
import express from 'express';
// cors 是一个中间件，用于处理跨域资源共享，允许其他域名的前端访问这个服务器
import cors from 'cors';
// 导入数据库连接函数，这个函数在 config/database.ts 中定义
import { connectDB } from './config/database';
// 导入问卷相关的路由处理模块
import questionnaireRoutes from './routes/questionnaire';
import uploadRoutes from './routes/upload';
import * as path from 'path';
import fs from 'fs';


// 创建一个 Express 应用实例
const app = express();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 调用数据库连接函数，连接到 MongoDB 数据库
connectDB();

// 配置中间件
// 启用 CORS，允许跨域请求
app.use(cors());
// 启用 JSON 解析，允许服务器解析请求体中的 JSON 数据
app.use(express.json());


// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// 设置路由
// 将所有以 '/api' 开头的请求转发到 questionnaireRoutes 处理
// 例如：/api/questionnaires 会被转发到问卷相关的处理函数
app.use('/api', [
    questionnaireRoutes,
    uploadRoutes
  ]);
// 设置服务器端口
// process.env.PORT 读取环境变量中的 PORT 值，如果没有设置则使用 3001
const PORT = process.env.PORT || 3001;

// 启动服务器，监听指定端口
// 服务器成功启动后，会在控制台打印消息
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});