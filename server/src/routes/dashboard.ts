// 文件作用：处理管理后台仪表盘相关的路由配置
// 主要功能：
// 1. 获取统计数据
// 与其他文件关系：
// - 使用 ../controllers/dashboard 中的控制器函数
// - 被 app.ts 引用并注册到 /api 路径下

import express from 'express';
import { getStats } from '../controllers/dashboard';

const router = express.Router();

// GET /api/dashboard/stats - 获取仪表盘统计数据
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    await getStats(req, res);
  } catch (error) {
    next(error);  // 错误处理中间件会处理这个错误
  }
});

export default router;