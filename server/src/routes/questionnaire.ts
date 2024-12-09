// 文件作用：处理问卷相关的路由配置
// 主要功能：
// 1. 提交问卷
// 2. 获取问卷列表
// 3. 获取单个问卷详情
// 4. 生成性格报告
// 5. 匹配用户
// 与其他文件关系：
// - 使用 ../controllers/questionnaire 中的控制器函数
// - 被 app.ts 引用并注册到 /api 路径下

import express, { Request, Response, NextFunction } from 'express';
import { 
    submitQuestionnaire, 
    getQuestionnaires,
    getQuestionnaireById,
    generateReport,
    matchUsers,
    handlePDFGeneration
} from '../controllers/questionnaire';
import path from 'path';

const router = express.Router();

// 使用 express.Handler 类型
const handleSubmit: express.Handler = async (req, res, next) => {
    try {
        await submitQuestionnaire(req, res);
    } catch (error) {
        next(error);
    }
};

router.post('/questionnaire', handleSubmit);

// GET /api/questionnaire - 获取所有问卷列表
router.get('/questionnaire', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getQuestionnaires(req, res);
    } catch (error) {
        next(error);
    }
});

// GET /api/questionnaire/:id - 获取单个问卷详情
router.get('/questionnaire/:id', async (req, res, next) => {
  try {
    await getQuestionnaireById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST /api/questionnaire/:id/report - 生成性格报告
router.post('/questionnaire/:id/report', async (req, res) => {
  try {
    await generateReport(req, res);
  } catch (error: any) {
    console.error('生成报告错误:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    });
  }
});

// POST /api/questionnaire/:id/match - 匹配用户
router.post('/questionnaire/:id/match', async (req, res) => {
  try {
    await matchUsers(req, res);
  } catch (error) {
    console.error('匹配处理错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '匹配失败，请重试' 
    });
  }
});

// POST /api/questionnaire/:id/pdf - 生成 PDF 报告
router.post('/questionnaire/:id/pdf', async (req, res) => {
  try {
    await handlePDFGeneration(req, res);
  } catch (error) {
    console.error('PDF生成错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '生成PDF失败，请重试' 
    });
  }
});

// 修改静态文件服务路径，与 PDF 生成路径保持一致
router.use('/reports', express.static(path.join(__dirname, '../../public/reports')));

// 导出路由对象，让其他文件可以使用这些路由定义
export default router