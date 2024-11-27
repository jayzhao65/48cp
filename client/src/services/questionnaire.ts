import { apiClient } from './api';
import axios from 'axios';

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
      const response = await apiClient.post('/questionnaire', data, {
        timeout: 30000, // 添加超时设置
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请重试');
      }
      throw error;
    }
  },

  getAll: async () => {
    try {
      const response = await apiClient.get('/questionnaire');
      console.log('API Response:', response);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/questionnaire/${id}`);
    return response.data;
  },

  generateReport: async (userId: string) => {
    try {
      const response = await apiClient.post(
        `/questionnaire/${userId}/report`,
        {},
        {
          timeout: 180000, // 3分钟超时
        }
      );
      return response.data;
    } catch (error: any) {
      // 增加错误处理
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          '生成报告失败';
      throw new Error(errorMessage);
    }
  },

  // 匹配用户
  matchUsers: async (userId: string, targetUserId: string) => {
    try {
      const response = await apiClient.post(`/questionnaire/${userId}/match`, {
        targetUserId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};