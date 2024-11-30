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

import express from 'express';
import { 
    submitQuestionnaire, 
    getQuestionnaires,
    getQuestionnaireById,
    generateReport,
    matchUsers
} from '../controllers/questionnaire';

const router = express.Router();

// POST /api/questionnaire - 提交新问卷
router.post('/questionnaire', submitQuestionnaire);

// GET /api/questionnaire - 获取所有问卷列表
router.get('/questionnaire', async (req, res, next) => {
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
router.post('/questionnaire/:id/report', async (req, res, next) => {
  try {
    await generateReport(req, res);
  } catch (error) {
    next(error);
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

// 导出路由对象，让其他文件可以使用这些路由定义
export default router