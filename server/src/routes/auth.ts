// 文件作用：后端认证路由配置
// 输入：HTTP请求
// 输出：路由到对应的控制器
// 与其他文件关系：
// - 连接前端请求与后端控制器
// - 使用 ../controllers/auth 中的登录控制器

import express from 'express';
import { login } from '../controllers/auth';

const router = express.Router();

// 配置POST /login路由，当收到请求时调用login控制器
router.post('/login', login);

export default router;