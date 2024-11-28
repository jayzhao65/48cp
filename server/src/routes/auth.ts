// 文件作用：后端认证路由配置
// 输入：HTTP请求
// 输出：路由到对应的控制器
// 与其他文件关系：
// - 连接前端请求与后端控制器
// - 使用 ../controllers/auth 中的登录控制器

import express, { Request, Response } from 'express';
import { login } from '../controllers/auth';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  await login(req, res);
});

export default router;