// 文件作用：处理CP（情侣配对）相关的路由配置
// 主要功能：
// 1. 获取CP列表
// 2. 生成CP任务
// 与其他文件关系：
// - 使用 ../controllers/couple 中的控制器函数
// - 被 app.ts 引用并注册到 /api 路径下

import express from 'express';
import { getCouples, generateTask } from '../controllers/couple';

const router = express.Router();

// GET /api/couple - 获取所有CP列表
router.get('/couple', getCouples);

// POST /api/couple/:id/task - 为指定CP生成约会任务
router.post('/couple/:id/task', async (req, res) => {
  await generateTask(req, res);
});

export default router; 