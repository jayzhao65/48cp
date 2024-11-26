import { apiClient } from './api';

export interface DashboardStats {
  totalUsers: number;
  totalCouples: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    createdAt: string;
  }>;
  recentCouples: Array<{
    _id: string;
    user1: {
      name: string;
    };
    user2: {
      name: string;
    };
    matchedAt: string;
  }>;
  genderDistribution: {
    male: number;
    female: number;
  };
  statusDistribution: {
    submitted: number;
    reported: number;
    matched: number;
  };
}

export const dashboardApi = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};