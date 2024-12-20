import express from 'express';
import { 
  getPendingReports,
  startBatchProcess,
  getProcessRecords,
  getProcessProgress,
  checkProcessingStatus
} from '../controllers/batchReport';

const router = express.Router();

// 获取待处理用户列表和统计信息
router.get('/pending', async (req, res, next) => {
  try {
    await getPendingReports(req, res);
  } catch (error) {
    next(error);
  }
});

// 开始批量处理
router.post('/process', async (req, res, next) => {
  try {
    await startBatchProcess(req, res);
  } catch (error) {
    next(error);
  }
});

// 获取处理记录
router.get('/records', async (req, res, next) => {
  try {
    await getProcessRecords(req, res);
  } catch (error) {
    next(error);
  }
});

// 添加进度查询路由
router.get('/progress', async (req, res, next) => {
  try {
    await getProcessProgress(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    await checkProcessingStatus(req, res);
  } catch (error) {
    next(error);
  }
});

export default router; 