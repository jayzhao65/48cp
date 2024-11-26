import { apiClient } from './api';

export const authApi = {
  login: async (values: { username: string; password: string }) => {
    try {
      const response = await apiClient.post('/api/login', values);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};