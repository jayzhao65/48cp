import { generatePDFFromReport } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

// 从 express 包中导入 Request 和 Response 类型
// Request 用于处理请求对象，Response 用于处理响应对象
import { Request, Response } from 'express';

// 导入问卷模型，这个模型定义了问卷数据的结构
import { Questionnaire, IQuestionnaire, QuestionnaireStatus } from '../models/questionnaire';

// 导入 axios 用于调用 OpenRouter API
import axios from 'axios';

// 导入 Couple 模型
import { Couple } from '../models/couple';
import { AIResponse, AnthropicResponse, UserInfo, CozeResponse } from '../types/api';
import sharp from 'sharp';

// Add this function near the top of the file, after the imports
const compressImage = async (imageUrl: string): Promise<string> => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    const image = await sharp(buffer)
      .jpeg({ quality: 80 }) // 压缩质量设置为 80·
      .toBuffer();

    // 将压缩后的图片上传到服务器，获取新的 URL
    // 这里需要实现上传逻辑，返回新的 URL
    // ...

    return imageUrl; // 临时返回原始 URL，等待实现上传逻辑
  } catch (error) {
    console.error('图片压缩失败:', error);
    return imageUrl; // 如果压缩失败，返回原始 URL
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
      const questionnaire = await Questionnaire.findById(req.params.id) as IQuestionnaire;
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }
      res.json({ success: true, data: questionnaire });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取问卷详情失败' });
    }
  };
  
  // 添加 Anthropic API 调用函数
  const callAnthropicAPI = async (messages: any[], imageContents: any[]) => {
    console.log('正在调用 Anthropic API...');
    
    // 转换消息格式
    const convertedMessages = messages.map(msg => ({
      ...msg,
      content: msg.content.map((content: any) => {
        if (content.type === 'image_url') {
          // 转换为 Anthropic 的图片格式
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: content.image_url.url.split(',')[1] // 移除 data:image/jpeg;base64, 前缀
            }
          };
        }
        return content;
      })
    }));

    // 构建请求体
    const requestBody = {
      model: "claude-3-5-sonnet-20241022",
      messages: convertedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    };

    console.log('Anthropic 请求体:', JSON.stringify({
      ...requestBody,
      messages: convertedMessages.map(msg => ({
        ...msg,
        content: msg.content.map((content: any) => 
          content.type === 'image' ? { type: 'image', source: { type: 'base64', data: '[BASE64_IMAGE]' }} : content
        )
      }))
    }, null, 2));

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      requestBody,
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 180000
      }
    );

    return response.data as AnthropicResponse;
  };

  // 修改 generateReport 函数
  export const generateReport = async (req: Request, res: Response) => {
    try {
      console.log('开始生成报告，用户ID:', req.params.id);
      const questionnaire = await Questionnaire.findById(req.params.id) as IQuestionnaire;
      if (!questionnaire) {
        return res.status(404).json({ success: false, error: '问卷不存在' });
      }

      // 压缩图片
      let compressedImages: string[] = [];
      if (questionnaire.images && questionnaire.images.length > 0) {
        compressedImages = await Promise.all(
          questionnaire.images.map(imageUrl => compressImage(imageUrl))
        );
      }

      const userInfo: UserInfo = {
        name: questionnaire.name,
        gender: questionnaire.gender === 'male' ? '男' : '女',
        birth_date: questionnaire.birth_date,
        zodiac: questionnaire.zodiac,
        mbti: questionnaire.mbti,
        occupation: questionnaire.occupation,
        self_intro: questionnaire.self_intro,
        images: compressedImages // 使用压缩后的图片 URL
      };

      const aiResponse = await callCozeAPI(userInfo);

      // 更新问卷数据
      const report = {
        content: {
          raw_response: aiResponse,
        },
        generated_at: new Date(),
        generation_count: (questionnaire.personality_report?.generation_count || 0) + 1
      };

      questionnaire.personality_report = report;
      questionnaire.status = QuestionnaireStatus.REPORTED;
      await questionnaire.save();

      console.log(`报告生成成功 - 用户ID: ${req.params.id}, 姓名: ${questionnaire.name}`);

      res.json({ 
        success: true, 
        data: questionnaire,
        raw_response: aiResponse
      });
    } catch (error: any) {
      console.error('生成报告失败:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || '生成报告失败'
      });
    }
  };

// 添加匹配用户的控制器
export const matchUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;

    const user1 = await Questionnaire.findById(id);
    const user2 = targetUserId ? await Questionnaire.findById(targetUserId) : null;

    if (!user1) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    if (targetUserId && !user2) {
      return res.status(404).json({ success: false, error: '匹配目标用户不存在' });
    }

    // 如果是取消匹配
    if (!targetUserId) {
      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id }
        ]
      });

      if (existingCouple) {
        await existingCouple.deleteOne();
      }

      if (user1.matched_with) {
        await Questionnaire.updateOne(
          { _id: user1.matched_with },
          {
            matched_with: null,
            matched_at: null,
            status: user1.personality_report?.content?.raw_response ? 
              QuestionnaireStatus.REPORTED : 
              QuestionnaireStatus.SUBMITTED
          }
        );
      }

      await Questionnaire.updateOne(
        { _id: user1._id },
        {
          matched_with: null,
          matched_at: null,
          status: user1.personality_report?.content?.raw_response ? 
            QuestionnaireStatus.REPORTED : 
            QuestionnaireStatus.SUBMITTED
        }
      );

      const updatedUser = await Questionnaire.findById(id);
      return res.json({ success: true, data: updatedUser });
    }

    // 如果是新建匹配
    if (user2) {
      const matchTime = new Date();

      const existingCouple = await Couple.findOne({
        $or: [
          { user1: user1._id },
          { user2: user1._id },
          { user1: user2._id },
          { user2: user2._id }
        ]
      });

      if (existingCouple) {
        await existingCouple.deleteOne();
      }

      const couple = new Couple({
        user1: user1._id,
        user2: user2._id,
        matchedAt: matchTime
      });

      await couple.save();

      await Promise.all([
        Questionnaire.updateOne(
          { _id: user1._id },
          {
            matched_with: user2._id,
            matched_at: matchTime,
            status: QuestionnaireStatus.MATCHED
          }
        ),
        Questionnaire.updateOne(
          { _id: user2._id },
          {
            matched_with: user1._id,
            matched_at: matchTime,
            status: QuestionnaireStatus.MATCHED
          }
        )
      ]);

      const updatedUser = await Questionnaire.findById(id);
      return res.json({ success: true, data: updatedUser });
    }

  } catch (error) {
    console.error('匹配用户失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '匹配失败，请重试'
    });
  }
};

export const handlePDFGeneration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. 确保 reports 目录存在
    const reportsDir = path.join(__dirname, '../../public/reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });
    
    // 2. 获取用户数据和报告内容
    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return res.status(404).json({ success: false, error: '未找到用户数据' });
    }
    
    if (!questionnaire.personality_report?.content?.raw_response) {
      return res.status(400).json({ success: false, error: '请先生成性格报告' });
    }

    // 3. 直接使用原始响应
    const reportContent = questionnaire.personality_report.content.raw_response;

    // 4. 生成 PDF
    const pdfResult = await generatePDFFromReport(reportContent, questionnaire);
    const pdfBuffer = Buffer.from(pdfResult.buffer);

    // 5. 保存 PDF 文件
    const fileName = `report_${id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    await fs.promises.writeFile(filePath, pdfBuffer);

    // 6. 构建完整的 PDF URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/reports/${fileName}`;

    // 7. 更新数据库中的信息
    if (!questionnaire.personality_report.pdf_reports) {
      questionnaire.personality_report.pdf_reports = [];
    }

    // 添加新的 PDF 信息到数组开头
    questionnaire.personality_report.pdf_reports.unshift({
      url: pdfUrl,
      generated_at: new Date()
    });

    // 保持向后兼容
    questionnaire.personality_report.pdf_path = fileName;
    
    await questionnaire.save();

    res.json({ 
      success: true, 
      data: questionnaire,
      pdf_url: pdfUrl
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id
    });

    res.status(500).json({ 
      success: false, 
      error: error.message || '生成 PDF 失败',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Add this function after the imports
const callCozeAPI = async (userInfo: UserInfo): Promise<string> => {
  // 构建消息内容
  const messageContent = [];

  // 首先添加所有图片
  if (userInfo.images && userInfo.images.length > 0) {
    userInfo.images.forEach(imageUrl => {
      messageContent.push({
        "type": "image",
        "file_url": imageUrl
      });
    });
  }

  // 最后添加用户基础信息作为文本
  messageContent.push({
    "type": "text",
    "text": JSON.stringify({
      name: userInfo.name,
      gender: userInfo.gender,
      birth_date: userInfo.birth_date,
      zodiac: userInfo.zodiac,
      mbti: userInfo.mbti,
      occupation: userInfo.occupation,
      self_intro: userInfo.self_intro
    })
  });

  const requestBody = {
    bot_id: process.env.COZE_BOT_ID,
    user_id: "123456789",
    stream: false,
    auto_save_history: true,
    additional_messages: [{
      role: "user",
      content: JSON.stringify(messageContent),
      content_type: "object_string"
    }]
  };

  try {
    console.log('开始调用 Coze API...');
    const startTime = Date.now();

    // 打印请求体以便调试
    console.log('Coze API 请求体:', JSON.stringify({
      ...requestBody,
      bot_id: '***',
      additional_messages: requestBody.additional_messages
    }, null, 2));

    // 发送初始请求
    const initialResponse = await axios.post(
      'https://api.coze.com/v3/chat',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.COZE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // 打印完整的响应数据以便调试
    console.log('Coze API 初始响应:', JSON.stringify(initialResponse.data, null, 2));

    // 检查响应数据结构
    if (!initialResponse.data) {
      throw new Error('Empty response from Coze API');
    }

    // 根据实际的响应结构获取 chat_id 和 conversation_id
    const chat_id = initialResponse.data.data.id 
    const conversation_id = initialResponse.data.data.conversation_id;

    if (!chat_id || !conversation_id) {
      console.error('完整的响应数据:', initialResponse.data);
      throw new Error(`Missing id or conversation_id in response. Response: ${JSON.stringify(initialResponse.data)}`);
    }

    // 在获取到 chat_id 和 conversation_id 后，添加状态轮询
    let retryCount = 0;
    const maxRetries = 40;
    let finalContent = '';

    // 首先轮询 retrieve 接口检查状态
    while (retryCount < maxRetries) {
      try {
        const retrieveResponse = await axios.get(
          'https://api.coze.com/v3/chat/retrieve',
          {
            params: {
              chat_id,
              conversation_id
            },
            headers: {
              'Authorization': `Bearer ${process.env.COZE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Retrieve 响应:', JSON.stringify(retrieveResponse.data, null, 2));

        // 检查失败状态，如果失败立即抛出错误
        if (retrieveResponse.data?.data?.status === 'failed') {
          throw new Error(`Coze API 处理失败: ${retrieveResponse.data?.data?.error || '未知错误'}`);
        }

        // 检查完成状态
        if (retrieveResponse.data?.data?.status === 'completed') {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        retryCount++;

        if (retryCount >= maxRetries) {
          throw new Error('等待 Coze API 响应超时');
        }
      } catch (error) {
        // 如果是我们主动抛出的错误（状态为 failed），直接向上传播
        if (error instanceof Error && error.message.includes('Coze API 处理失败')) {
          throw error;
        }
        
        console.error('检查聊天状态失败:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
      }
    }

    // 重置重试计数
    retryCount = 0;

    // 状态为 completed 后，再获取消息列表
    while (retryCount < maxRetries) {
      try {
        const messagesResponse = await axios.get(
          'https://api.coze.com/v3/chat/message/list',
          {
            params: {
              chat_id,
              conversation_id
            },
            headers: {
              'Authorization': `Bearer ${process.env.COZE_API_KEY}`
            }
          }
        );

        console.log('消息列表响应:', JSON.stringify(messagesResponse.data, null, 2));

        // 检查响应格式
        if (!messagesResponse.data?.data) {
          console.warn('Invalid messages response:', messagesResponse.data);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
          continue;
        }

        // 直接使用 data 数组
        const messages = messagesResponse.data.data;
        // 查找类型为 "answer" 且有实际内容的消息
        const answerMessage = messages.find((msg: any) => 
          msg.type === 'answer' && 
          msg.content_type === 'text' &&
          msg.content && 
          !msg.content.includes('generate_answer_finish')  // 排除系统消息
        );

        if (answerMessage) {
          finalContent = answerMessage.content;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
      } catch (error) {
        console.error('轮询消息失败:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
      }
    }

    if (!finalContent) {
      throw new Error('未能获取到 AI 响应');
    }

    const duration = Date.now() - startTime;
    console.log(`Coze API 调用成功，耗时: ${duration}ms`);

    return finalContent;

  } catch (error: any) {
    console.error('Coze API 调用失败:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      requestBody: JSON.stringify(requestBody, null, 2)
    });

    throw new Error(`Coze API 错误: ${error.message}`);
  }
};