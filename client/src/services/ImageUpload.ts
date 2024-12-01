// src/services/ImageUpload.ts
import { apiClient } from './api';

// 添加重试逻辑到 apiClient 的拦截器
apiClient.interceptors.response.use(null, async error => {
  const maxRetries = 3;
  const retryDelay = 1000;
  error.config.retryCount = error.config.retryCount || 0;
  
  if (error.config.retryCount < maxRetries && 
      (error.response?.status === 502 || error.response?.status === 504)) {
    error.config.retryCount++;
    await new Promise(resolve => setTimeout(resolve, retryDelay * error.config.retryCount));
    return apiClient(error.config);
  }
  return Promise.reject(error);
});

export const uploadApi = {
  // 上传单张图片
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      console.log('收到的响应数据:', response.data);
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
      const batchSize = 2;
      const results = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const promises = batch.map(file => uploadApi.uploadImage(file));
        
        // 等待当前批次完成
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        
        // 增加批次间隔时间
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  },

  // 添加删除图片的方法
  deleteImage: async (imageUrl: string) => {
    try {
      const response = await apiClient.post('/delete-image', { url: imageUrl });
      return response.data;
    } catch (error) {
      console.error('Delete image error:', error);
      throw error;
    }
  }
};