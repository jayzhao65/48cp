// src/services/ImageUpload.ts
import { apiClient } from './api';
import axios from 'axios';

// Create custom instance with retry logic
const uploadClient = axios.create();
uploadClient.interceptors.response.use(null, async error => {
  const maxRetries = 2;
  error.config.retryCount = error.config.retryCount || 0;
  
  if (error.config.retryCount < maxRetries) {
    error.config.retryCount++;
    return uploadClient(error.config);
  }
  return Promise.reject(error);
});

export const uploadApi = {
  // 上传单张图片
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    // 添加调试日志
    console.log('Using baseURL:', apiClient.defaults.baseURL);

    try {
      const response = await uploadClient.post('/upload', formData, {
        headers: {},
        // 添加超时和重试配置
        timeout: 30000, // 30秒超时
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // 优化多张图片上传
  uploadImages: async (files: File[]) => {
    try {
      // 限制并发数量
      const batchSize = 4; // 每批处理4个文件
      const results = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const promises = batch.map(file => uploadApi.uploadImage(file));
        
        // 等待当前批次完成
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        
        // 添加延迟，避免服务器压力过大
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  }
};