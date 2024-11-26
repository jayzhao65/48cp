import express from 'express';
import { getStats } from '../controllers/dashboard';

const router = express.Router();

// 修改路由路径，移除前缀 '/dashboard'
router.get('/dashboard/stats', async (req, res, next) => {
  try {
    await getStats(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;