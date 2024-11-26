import { Request, Response } from 'express';
import { Questionnaire } from '../models/questionnaire';
import { Couple } from '../models/couple';

export const getStats = async (req: Request, res: Response) => {
  try {
    // 获取总用户数
    const totalUsers = await Questionnaire.countDocuments();

    // 获取总CP数
    const totalCouples = await Couple.countDocuments();

    // 获取最近注册的用户（限制5个）
    const recentUsers = await Questionnaire.find()
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // 获取最近匹配的CP（限制5个）
    const recentCouples = await Couple.find()
      .populate('user1', 'name')
      .populate('user2', 'name')
      .select('matchedAt')
      .sort({ matchedAt: -1 })
      .limit(5);

    // 获取性别分布
    const genderDistribution = {
      male: await Questionnaire.countDocuments({ gender: 'male' }),
      female: await Questionnaire.countDocuments({ gender: 'female' })
    };

    // 获取状态分布
    const statusDistribution = {
      submitted: await Questionnaire.countDocuments({ status: 'submitted' }),
      reported: await Questionnaire.countDocuments({ status: 'reported' }),
      matched: await Questionnaire.countDocuments({ status: 'matched' })
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCouples,
        recentUsers,
        recentCouples,
        genderDistribution,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
};