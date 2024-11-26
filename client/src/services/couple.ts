import { apiClient } from './api';

export const coupleApi = {
  getAll: async (page = 1, pageSize = 10) => {
    try {
      const response = await apiClient.get('/couple', {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  generateTask: async (coupleId: string) => {
    try {
      const response = await apiClient.post(`/couple/${coupleId}/task`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 