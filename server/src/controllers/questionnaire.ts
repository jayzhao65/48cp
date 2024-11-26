import { Request, Response } from 'express';
import { Questionnaire } from '../models/questionnaire';

export const submitQuestionnaire = async (req: Request, res: Response) => {
  try {
    const questionnaireData = req.body;
    
    // 创建新的问卷记录
    const questionnaire = new Questionnaire(questionnaireData);
    await questionnaire.save();

    res.status(201).json({
      success: true,
      message: '问卷提交成功',
      data: questionnaire
    });
  } catch (error) {
    console.error('提交问卷失败:', error);
    res.status(500).json({
      success: false,
      error: '提交失败，请重试'
    });
  }
};