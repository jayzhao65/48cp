// 从 express 包中导入 Request 和 Response 类型
// Request 用于处理请求对象，Response 用于处理响应对象
import { Request, Response } from 'express';

// 导入问卷模型，这个模型定义了问卷数据的结构
import { Questionnaire, QuestionnaireStatus } from '../models/questionnaire';

// 导入 axios 用于调用 OpenRouter API
import axios from 'axios';

// 导入 Couple 模型
import { Couple } from '../models/couple';
import { AIResponse } from '../types/api';


// 导出一个异步函数，用于处理提交问卷的请求
// async 表示这是一个异步函数，可以等待其他异步操作完成
export const submitQuestionnaire = async (req: Request, res: Response) => {
  try {
    // 从请求体(req.body)中获取问卷数据
    // 当用户提交表单时，数据会存储在 req.body 中
    const questionnaireData = req.body;
    
    // 使用问卷数据创建一个新的 Questionnaire 实例
    // new Questionnaire() 会根据模型定义创建一个新的问卷对象
    const questionnaire = new Questionnaire(questionnaireData);

    // 将问卷数据保存到数据库中
    // await 表示等待保存操作完成
    await questionnaire.save();

    // 发送成功响应
    // status(201) 表示创建成功
    // json() 发送 JSON 格式的响应数据
    res.status(201).json({
      success: true,          // 表示操作成功
      message: '问卷提交成功', // 成功提示信息
      data: questionnaire     // 返回保存的问卷数据
    });

  } catch (error) {
    // 如果过程中发生错误，进入错误处理
    
    // 在控制台打印错误信息，方便调试
    console.error('提交问卷失败:', error);

    // 发送错误响应
    // status(500) 表示服务器内部错误
    res.status(500).json({
      success: false,           // 表示操作失败
      error: '提交失败，请重试'  // 错误提示信息
    });
  }
};
export const getQuestionnaires = async (req: Request, res: Response) => {
    try {
      const questionnaires = await Questionnaire.find()
        .sort({ createdAt: -1 });
      
      // 修改返回格式，确保包含 data 字段
      res.json({
        success: true,
        data: questionnaires  // 确保数据在 data 字段中
      });
    } catch (error) {
      console.error('获取问卷列表失败:', error); // 添加错误日志
      res.status(500).json({ 
        success: false, 
        error: '获取问卷列表失败' 
      });
    }
};

export const getQuestionnaireById = async (req: Request, res: Response) => {
    try {
      const questionnaire = await Questionnaire.findById(req.params.id);
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }
      res.json({ success: true, data: questionnaire });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取问卷详情失败' });
    }
  };
  
  export const generateReport = async (req: Request, res: Response) => {
    try {
      console.log('开始生成报告，用户ID:', req.params.id);
      const questionnaire = await Questionnaire.findById(req.params.id);
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }

      // 构建提示词
      const prompt = `
        请根据以下用户信息生成一份性格分析报告：
        姓名：${questionnaire.name}
        性别：${questionnaire.gender === 'male' ? '男' : '女'}
        年龄：${questionnaire.birth_date}
        星座：${questionnaire.zodiac}
        MBTI: ${questionnaire.mbti}
        职业：${questionnaire.occupation}
        自我介绍：${questionnaire.self_intro}
        
        请从以下几个方面进行分析：
        1. 性格特点
        2. 人际关系
        3. 恋爱倾向
        4. 职业发展
        5. 建议与改进方向
      `;

      // 检查 API key
      if (!process.env.OPENROUTER_API_KEY) {
        console.error('OpenRouter API key 未设置');
        return res.status(500).json({ 
          success: false, 
          error: 'API 配置错误' 
        });
      }

      console.log('正在调用 OpenRouter API...');
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,  // 限制响应长度
        temperature: 0.7   // 添加温度参数
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Personality Analysis App',
          'Content-Type': 'application/json'
        },
        timeout: 120000  // 增加到 120 秒
      });

      console.log('OpenRouter API 响应成功');
      // 解析 AI 响应
      const aiResponse = (response.data as AIResponse).choices[0].message.content;

      // 更新问卷数据
      const report = {
        content: {
          raw_response: aiResponse,
          // 这里可以添加更多结构化的数据
        },
        generated_at: new Date(),
        generation_count: (questionnaire.personality_report?.generation_count || 0) + 1
      };

      questionnaire.personality_report = report;
      questionnaire.status = QuestionnaireStatus.REPORTED;
      await questionnaire.save();

      res.json({ success: true, data: questionnaire });
    } catch (error: any) {
      console.error('生成报告失败，详细错误:', error);
      console.error('错误配置:', error.config);
      if (error.response) {
        console.error('API 响应错误:', error.response.data);
      }
      
      let errorMessage = '生成报告失败';
      if (error.code === 'ECONNABORTED') {
        errorMessage = '生成报告超时，请重试 (服务器响应时间过长)';
      } else if (error.response) {
        errorMessage = `生成报告失败: ${error.response.data?.error || error.response.statusText || '未知错误'}`;
      } else if (error.request) {
        errorMessage = '无法连接到 AI 服务，请检查网络连接';
      }

      res.status(500).json({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          stack: error.stack
        } : undefined
      });
    }
  };

// 添加匹配用户的控制器
export const matchUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;

    console.log('匹配请求参数:', { id, targetUserId }); // 添加日志

    const user1 = await Questionnaire.findById(id);
    const user2 = targetUserId ? await Questionnaire.findById(targetUserId) : null;

    console.log('查找到的用户:', { 
      user1: user1?._id, 
      user2: user2?._id 
    }); // 添加日志

    if (!user1) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (targetUserId && !user2) {
      return res.status(404).json({ success: false, error: '匹配目标用户不存在' });
    }

    // 如果是取消匹配
    if (!targetUserId) {
      console.log('执行取消匹配操作'); // 添加日志
      
      // 先查找现有的 couple 记录
      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id }
        ]
      });

      if (existingCouple) {
        console.log('删除现有的 couple 记录:', existingCouple._id);
        await existingCouple.deleteOne();
      }

      const previousMatch = await Questionnaire.findById(user1.matched_with);
      if (previousMatch) {
        console.log('更新之前匹配用户的状态:', previousMatch._id);
        previousMatch.set({
          matched_with: null,
          matched_at: null,
          status: previousMatch.personality_report?.content?.raw_response ? 
            QuestionnaireStatus.REPORTED : 
            QuestionnaireStatus.SUBMITTED
        });
        await previousMatch.save();
      }

      user1.set({
        matched_with: null,
        matched_at: null,
        status: user1.personality_report?.content?.raw_response ? 
          QuestionnaireStatus.REPORTED : 
          QuestionnaireStatus.SUBMITTED
      });
      await user1.save();

      return res.json({ success: true, data: user1 });
    }

    // 如果是新建匹配
    if (user2) {
      console.log('执行新建匹配操作'); // 添加日志

      const matchTime = new Date();

      // 检查是否已存在匹配记录
      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id },
          { user1: user2._id },
          { user2: user2._id }
        ]
      });

      if (existingCouple) {
        console.log('删除已存在的匹配记录');
        await existingCouple.deleteOne();
      }

      // 创建新的 couple 记录
      const couple = new Couple({
        user1: user1._id,
        user2: user2._id,
        matchedAt: matchTime,
        coupleId: 1  // 这里不需要手动设置，因为我们有 pre-save 中间件会自动处理
      });

      console.log('创建新的 couple 记录:', couple);
      try {
        await couple.save();
        console.log('couple 记录保存成功');
      } catch (error) {
        console.error('保存 couple 记录失败:', error);
        throw error;
      }

      // 更新用户状态
      user1.set({
        matched_with: user2._id,
        matched_at: matchTime,
        status: QuestionnaireStatus.MATCHED
      });

      user2.set({
        matched_with: user1._id,
        matched_at: matchTime,
        status: QuestionnaireStatus.MATCHED
      });

      await Promise.all([user1.save(), user2.save()]);
      console.log('用户状态更新完成');

      return res.json({ success: true, data: user1 });  // 添加 return 语句
    }

  } catch (error) {
    console.error('匹配用户失败，详细错误:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '匹配失败，请重试'
    });
  }
};