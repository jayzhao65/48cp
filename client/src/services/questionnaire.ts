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

// 定义前端表单数据类型
interface FormSubmitData {
  name: string;
  phone: string;
  wechat: string;
  birth_year: string;
  birth_month: string;
  zodiac: string;
  mbti: string;
  location: string;
  gender: 'male' | 'female';
  orientation: 'straight' | 'gay' | 'bisexual';
  occupation: string;
  self_intro: string;
  images: string[];
}

// 定义用户数据类型
export interface UserData {
  _id: string;
  name: string;
  gender: 'male' | 'female';
  location: string;
  orientation: 'straight' | 'gay' | 'bisexual';
  occupation: string;
  status: 'submitted' | 'reported' | 'matched';
  createdAt: string;
  mbti: string;
  zodiac: string;
  birth_date: string;
  wechat: string;
  phone: string;
  self_intro: string;
  images: string[];
  personality_report?: {
    content?: {
      raw_response?: string;
    };
    generated_at: string;
    generation_count: number;
  };
  matched_with?: string;
  matched_at?: string;
  age?: number;
}

// 问卷相关API方法
export const questionnaireApi = {
  // 提交问卷
  submit: async (formData: FormSubmitData) => {
    try {
      // 转换为API需要的格式
      const apiData: QuestionnaireData = {
        ...formData,
        birth_date: `${formData.birth_year}-${formData.birth_month}`,
      };

      const response = await apiClient.post('/questionnaire', apiData, {
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