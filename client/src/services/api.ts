import axios from 'axios';

// API 响应接口定义
export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// 统一的 AI 响应格式
export interface AIServiceResponse {
  success: boolean;
  data?: {
    content: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  error?: string;
}

const baseURL = import.meta.env.PROD 
  ? '/api'  // 生产环境
  : 'http://localhost:3001/api';     // 开发环境

export const apiClient = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
    response => response,
    error => {
      // 统一错误处理
      if (error.response) {
        // 服务器返回错误
        console.error('API Error:', error.response.data);
      } else if (error.request) {
        // 请求发送失败
        console.error('Request Error:', error.request);
      } else {
        // 请求配置错误
        console.error('Error:', error.message);
      }
      return Promise.reject(error);
    }
  );