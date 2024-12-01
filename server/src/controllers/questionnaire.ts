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

// Add this function near the top of the file, after the imports
const getImageContent = async (imageUrl: string): Promise<string> => {
  try {
    if (!imageUrl) {
      throw new Error('Image URL is empty');
    }

    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // 验证内容类型
    const contentType = response.headers['content-type'];
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // 强制转换为 JPEG 格式，并降低质量以减小大小
    const sharp = require('sharp');
    const processedImageBuffer = await sharp(response.data)
      .jpeg({ quality: 80 }) // 转换为 JPEG 并设置质量
      .resize(1024, 1024, { // 限制最大尺寸
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    const base64 = processedImageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    console.log(`Successfully processed image: ${imageUrl.substring(0, 50)}...`);
    
    return dataUrl;
  } catch (error) {
    console.error('Error processing image:', {
      url: imageUrl.substring(0, 50) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('图片处理失败，请确保图片格式正确且大小在限制范围内');
  }
};

// 导出一个异步函数，用于处理提交问卷的请求
// async 表示这是一个异步函数，可以等待其他异步操作完成
export const submitQuestionnaire = async (req: Request, res: Response) => {
  try {
    // 从请求体(req.body)中获取问卷数据
    // 当用户提交表单时，数据会存储在 req.body 中
    const questionnaireData = req.body;
    
    // 验证日期格式
    if (!/^\d{4}-\d{2}$/.test(questionnaireData.birth_date)) {
      return res.status(400).json({
        success: false,
        error: '出生日期格式必须为 YYYY-MM'
      });
    }

    // 验证年龄限制
    const [year, month] = questionnaireData.birth_date.split('-');
    const birthDate = new Date(parseInt(year), parseInt(month) - 1);
    if (birthDate > new Date('2006-12-31')) {
      return res.status(400).json({
        success: false,
        error: '此活动仅对18岁以上开放'
      });
    }

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
    
    // 应该检查查询结果
    if (!questionnaires) {
      return res.status(404).json({
        success: false,
        error: '未找到问卷数据'
      });
    }
    
    res.json({
      success: true,
      data: questionnaires || []
    });
  } catch (error) {
    // 应该记录具体错误信息
    console.error('获取问卷列表失败:', error);
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

      // 构建多模态消息
      const textContent = {
        type: "text" as const,
        text: `
          请根据以下用户信息和照片生成一份性格分析报告，首先先告诉我你收到了几张照片，然后描述每张图片中的内容，再开始生成以下信息：
          姓名：${questionnaire.name}
          性别：${questionnaire.gender === 'male' ? '男' : '女'}
          年龄：${questionnaire.birth_date}
          星座：${questionnaire.zodiac}
          MBTI: ${questionnaire.mbti}
          职业：${questionnaire.occupation}
          自我介绍：${questionnaire.self_intro}
          
          请从以下几个方面进行分析：
          1. 性格特点
          2. 个人形象与气质
          3. 人际关系
          4. 恋爱倾向
          5. 职业发展
          6. 建议与改进方向
        `
      };

      // 修改图片处理逻辑
      const validImageContents = [];
      if (questionnaire.images && questionnaire.images.length > 0) {
        // 串行处理图片
        for (const imageUrl of questionnaire.images) {
          try {
            const base64Url = await getImageContent(imageUrl);
            validImageContents.push({
              type: "image_url" as const,
              image_url: {
                url: base64Url
              }
            });
            // 添加延迟以避免请求过快
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to process image ${imageUrl}:`, error);
          }
        }
      }

      // 确保至少有一张图片被成功处理
      if (questionnaire.images?.length > 0 && validImageContents.length === 0) {
        throw new Error('无法处理任何上传的图片');
      }

      const messages = [
        {
          role: "user" as const,
          content: [textContent, ...validImageContents]
        }
      ];

      console.log('Prepared messages for API:', JSON.stringify({
        messageCount: messages.length,
        contentCount: messages[0].content.length,
        imageCount: validImageContents.length,
        firstImageLength: validImageContents[0]?.image_url.url.length
      }, null, 2));

      // 检查 API key
      if (!process.env.OPENROUTER_API_KEY) {
        console.error('OpenRouter API key 未设置');
        return res.status(500).json({ 
          success: false, 
          error: 'API 配置错误' 
        });
      }

      console.log('正在调用 OpenRouter API...');



      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: "anthropic/claude-3.5-sonnet",
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'Personality Analysis App',
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      console.log('OpenRouter API 响应成功');
      console.log('OpenRouter API 响应:', response.data); // 添加详细日志

      // 增加响应数据的验证
      if (!response.data || !response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
        throw new Error('API 响应格式无效: ' + JSON.stringify(response.data));
      }

      // 安全地获取 AI 响应
      const aiResponse = response.data.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('API 响应中没有找到有效的内容');
      }

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
      // 增强错误日志
      console.error('生成报告失败，错误类型:', error.constructor.name);
      console.error('错误信息:', error.message);
      
      if (error.response) {
        console.error('API 响应状态:', error.response.status);
        console.error('API 响应头:', error.response.headers);
        console.error('API 响应数据:', error.response.data);
      }

      if (error.config) {
        console.error('请求配置:', {
          url: error.config.url,
          method: error.config.method,
          headers: {
            ...error.config.headers,
            'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY?.substring(0, 5) + '...' // 安全起见只显示部分
          }
        });
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