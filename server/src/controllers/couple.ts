import { Request, Response } from 'express';
import { Couple } from '../models/couple';
import axios from 'axios';
import { AIResponse } from '../types/api';


export const getCouples = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const couples = await Couple.find()
      .populate('user1')
      .populate('user2')
      .sort({ matchedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const total = await Couple.countDocuments();

    res.json({
      success: true,
      data: {
        list: couples,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取CP列表失败:', error);
    res.status(500).json({ success: false, error: '获取CP列表失败' });
  }
};

export const generateTask = async (req: Request, res: Response) => {
  try {
    const couple = await Couple.findById(req.params.id)
      .populate('user1')
      .populate('user2');

    if (!couple) {
      return res.status(404).json({ success: false, error: 'CP不存在' });
    }

    // 构建消息内容
    const messageContent = [];
    
    // 第一个用户的信息
    messageContent.push({ 
      type: "text", 
      text: "第一人基本信息及社交媒体截图" 
    });
    
    // 第一个用户的照片
    if ((couple.user1 as any).images?.length > 0) {
      (couple.user1 as any).images.forEach((imageUrl: string) => {
        messageContent.push({
          type: "image",
          file_url: imageUrl
        });
      });
    }
    
    // 第一个用户的基本信息
    messageContent.push({
      type: "text",
      text: JSON.stringify({
        name: (couple.user1 as any).name,
        gender: (couple.user1 as any).gender === 'male' ? '男' : '女',
        birth_date: (couple.user1 as any).birth_date,
        zodiac: (couple.user1 as any).zodiac,
        mbti: (couple.user1 as any).mbti,
        occupation: (couple.user1 as any).occupation,
        self_intro: (couple.user1 as any).self_intro
      })
    });

    // 第二个用户的信息（格式同上）
    messageContent.push({ 
      type: "text", 
      text: "第二人基本信息及社交媒体截图" 
    });
    
    if ((couple.user2 as any).images?.length > 0) {
      (couple.user2 as any).images.forEach((imageUrl: string) => {
        messageContent.push({
          type: "image",
          file_url: imageUrl
        });
      });
    }
    
    messageContent.push({
      type: "text",
      text: JSON.stringify({
        name: (couple.user2 as any).name,
        gender: (couple.user2 as any).gender === 'male' ? '男' : '女',
        birth_date: (couple.user2 as any).birth_date,
        zodiac: (couple.user2 as any).zodiac,
        mbti: (couple.user2 as any).mbti,
        occupation: (couple.user2 as any).occupation,
        self_intro: (couple.user2 as any).self_intro
      })
    });

    const requestBody = {
      bot_id: process.env.COZE_COUPLE_BOT_ID,
      user_id: "123456789",
      stream: false,
      auto_save_history: true,
      additional_messages: [{
        role: "user",
        content: JSON.stringify(messageContent),
        content_type: "object_string"
      }]
    };

    // 添加详细的日志
    console.log('Coze API 请求详情:', JSON.stringify({
      url: 'https://api.coze.com/v3/chat',
      headers: {
        'Authorization': 'Bearer ***',
        'Content-Type': 'application/json'
      },
      requestBody: requestBody,
      rawMessageContent: messageContent
    }, null, 2));

    // 调用 Coze API
    const initialResponse = await axios.post(
      'https://api.coze.com/v3/chat',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.COZE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 150000
      }
    );

    // 添加响应日志
    console.log('Coze API 响应:', JSON.stringify(initialResponse.data, null, 2));

    const chat_id = initialResponse.data.data.id;
    const conversation_id = initialResponse.data.data.conversation_id;

    if (!chat_id || !conversation_id) {
      throw new Error('Missing chat_id or conversation_id in response');
    }

    // 状态轮询
    let retryCount = 0;
    const maxRetries = 40;
    let finalContent = '';

    // 轮询 retrieve 接口检查状态
    while (retryCount < maxRetries) {
      try {
        const retrieveResponse = await axios.get(
          'https://api.coze.com/v3/chat/retrieve',
          {
            params: { chat_id, conversation_id },
            headers: {
              'Authorization': `Bearer ${process.env.COZE_API_KEY}`
            }
          }
        );

        console.log('Retrieve 完整响应:', JSON.stringify(retrieveResponse.data, null, 2));

        if (retrieveResponse.data?.data?.status === 'failed') {
          console.error('失败详情:', {
            status: retrieveResponse.data?.data?.status,
            error: retrieveResponse.data?.data?.last_error,
            fullResponse: retrieveResponse.data
          });
          throw new Error(`Coze API 处理失败: ${
            retrieveResponse.data?.data?.last_error?.msg || 
            retrieveResponse.data?.data?.error || 
            '未知错误'
          }`);
        }

        if (retrieveResponse.data?.data?.status === 'completed') {
          console.log('状态为completed，准备调用 message/list 接口');
          
          // 调用 message/list 接口
          const messagesResponse = await axios.get(
            'https://api.coze.com/v3/chat/message/list',
            {
              params: { chat_id, conversation_id },
              headers: {
                'Authorization': `Bearer ${process.env.COZE_API_KEY}`
              }
            }
          );

          console.log('message/list 接口响应:', JSON.stringify(messagesResponse.data, null, 2));

          const messages = messagesResponse.data.data;
          const answerMessage = messages.find((msg: any) => 
            msg.type === 'answer' && 
            msg.content_type === 'text' &&
            msg.content && 
            !msg.content.includes('generate_answer_finish')
          );

          console.log('找到的答案消息:', answerMessage);

          if (answerMessage) {
            finalContent = answerMessage.content;
            console.log('设置 finalContent:', finalContent);
            break;
          } else {
            console.log('未找到符合条件的答案消息');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        retryCount++;
      } catch (error: any) {
        console.error('检查聊天状态失败:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          fullError: error
        });
        throw error;
      }
    }

    // 如果达到最大重试次数仍未成功，抛出错误
    if (retryCount >= maxRetries) {
      throw new Error('等待 Coze API 响应超时');
    }

    // 在保存前后添加日志
    console.log('准备保存任务，当前数据:', {
      content: finalContent,
      generatedAt: new Date(),
      generationCount: (couple.task?.generationCount || 0) + 1
    });

    couple.task = {
      content: finalContent,
      generatedAt: new Date(),
      generationCount: (couple.task?.generationCount || 0) + 1
    };

    await couple.save();
    console.log('任务保存完成，更新后的couple:', couple);

    res.json({ success: true, data: couple });
  } catch (error) {
    console.error('生成任务失败:', error);
    res.status(500).json({ success: false, error: '生成任务失败' });
  }
}; 