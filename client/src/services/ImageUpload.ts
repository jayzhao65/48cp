// src/services/upload.ts
import { apiClient } from './api';

// 可以定义一个基础 URL
const API_BASE_URL = 'http://8.218.98.220:3001/api';

export const uploadApi = {
  // 上传单张图片
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/upload`);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    } catch (error: any) {
      const errorMessage = error.message || '上传失败';
      console.error('上传错误:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // 上传多张图片
  uploadImages: async (files: File[]) => {
    try {
      // 一次上传一个文件
      const results = [];
      for (const file of files) {
        const result = await uploadApi.uploadImage(file);
        results.push(result);
      }
      return results;
    } catch (error) {
      throw error;
    }
  }
};