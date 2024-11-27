import axios from 'axios';

const baseURL = import.meta.env.PROD 
  ? 'http://8.218.98.220:3001/api'  // 生产环境
  : 'http://localhost:3001/api';     // 开发环境

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
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