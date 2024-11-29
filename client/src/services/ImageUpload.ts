// src/services/upload.ts
import { apiClient } from './api';

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
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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