import { apiClient } from './api';

// 定义问卷数据类型
export interface QuestionnaireData {
  name: string;
  phone: string;
  wechat: string;
  birth_date: string;
  zodiac: string;
  mbti: string;
  location: string;
  gender: 'male' | 'female';
  orientation: 'straight' | 'gay' | 'bisexual';
  occupation: string;
  self_intro: string;
  images: string[];
}

// 问卷相关API方法
export const questionnaireApi = {
  // 提交问卷
  submit: async (data: QuestionnaireData) => {
    try {
      const response = await apiClient.post('/questionnaire', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};