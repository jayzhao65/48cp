// 文件作用：处理管理员认证相关的路由配置
// 主要功能：
// 1. 定义登录路由
// 2. 将请求转发给对应的控制器处理
// 与其他文件关系：
// - 使用 ../controllers/auth 中的登录控制器
// - 被 app.ts 引用并注册到 /api 路径下

import express, { Request, Response } from 'express';
import { login, checkAdminAuth } from '../controllers/auth';

const router = express.Router();

// POST /api/login - 处理管理员登录请求
router.post('/login', async (req: Request, res: Response) => {
  await login(req, res);
});

// 添加新的认证检查路由
router.get('/check-admin', async (req: Request, res: Response) => {
  await checkAdminAuth(req, res);
});

export default router;