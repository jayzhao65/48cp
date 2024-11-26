// 导入 express 框架，这是一个 Node.js 的 Web 应用框架
import express from 'express';

// 从问卷控制器文件中导入 submitQuestionnaire 函数
// 这个函数将处理提交问卷的具体逻辑
import { submitQuestionnaire } from '../controllers/questionnaire';

// 创建一个新的路由实例
// router 对象可以让我们定义不同的 API 路由
const router = express.Router();

// 定义一个 POST 请求路由
// 当客户端向 '/questionnaire' 发送 POST 请求时
// 会调用 submitQuestionnaire 函数来处理这个请求
router.post('/questionnaire', submitQuestionnaire);

// 导出路由对象，让其他文件可以使用这些路由定义
export default router