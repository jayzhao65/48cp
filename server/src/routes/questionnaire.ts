// 导入 express 框架，这是一个 Node.js 的 Web 应用框架
import express from 'express';

// 从问卷控制器文件中导入 submitQuestionnaire 函数
// 这个函数将处理提交问卷的具体逻辑
import { 
    submitQuestionnaire, 
    getQuestionnaires,
    getQuestionnaireById,
    generateReport,
    matchUsers
  } from '../controllers/questionnaire';
// 创建一个新的路由实例
// router 对象可以让我们定义不同的 API 路由
const router = express.Router();

// 定义一个 POST 请求路由
// 当客户端向 '/questionnaire' 发送 POST 请求时
// 会调用 submitQuestionnaire 函数来处理这个请求
router.post('/questionnaire', submitQuestionnaire);

// 添加获取所有问卷的路由
router.get('/questionnaire', async (req, res, next) => {
  try {
    await getQuestionnaires(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/questionnaire/:id', async (req, res, next) => {
  try {
    await getQuestionnaireById(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/questionnaire/:id/report', async (req, res, next) => {
  try {
    await generateReport(req, res);
  } catch (error) {
    next(error);
  }
});

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