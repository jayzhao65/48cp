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
    } catch (error: any) {
      // 提供更详细的错误信息
      const errorMessage = error.response?.data?.error || error.message || '上传失败';
      console.error('上传错误:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // 上传多张图片
  uploadImages: async (files: File[]) => {
    try {
      const uploadPromises = files.map(file => uploadApi.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw error;
    }
  }
};