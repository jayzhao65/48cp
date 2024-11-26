import { Request, Response } from 'express';
import { Couple } from '../models/couple';
import axios from 'axios';

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

    // 构建提示词
    const prompt = `
      请为以下两位用户生成一个有趣的约会任务：
      用户1：${(couple.user1 as any).name}
      性别：${(couple.user1 as any).gender === 'male' ? '男' : '女'}
      年龄：${(couple.user1 as any).age}
      职业：${(couple.user1 as any).occupation}
      
      用户2：${(couple.user2 as any).name}
      性别：${(couple.user2 as any).gender === 'male' ? '男' : '女'}
      年龄：${(couple.user2 as any).age}
      职业：${(couple.user2 as any).occupation}
      
      请生成一个JSON格式的任务，包含以下字段：
      1. title: 任务标题
      2. description: 任务描述
      3. steps: 任务步骤（数组）
      4. tips: 注意事项（数组）
      5. expectedDuration: 预计时长（小时）
    `;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "anthropic/claude-3-sonnet",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'CP Task Generator'
      }
    });

    const taskContent = JSON.parse(response.data.choices[0].message.content);

    // 确保解析后的数据包含所有必需字段
    if (!taskContent.title || !taskContent.description || !taskContent.steps || 
        !taskContent.tips || !taskContent.expectedDuration) {
      throw new Error('Invalid task content format');
    }

    couple.task = {
      content: taskContent,
      generatedAt: new Date(),
      generationCount: (couple.task?.generationCount || 0) + 1
    };

    await couple.save();

    // 在返回之前确保数据被正确填充
    await couple.populate('user1');
    await couple.populate('user2');

    res.json({ success: true, data: couple });
  } catch (error) {
    console.error('生成任务失败:', error);
    res.status(500).json({ success: false, error: '生成任务失败' });
  }
}; 