import { apiClient } from './api';
import { UserData } from './questionnaire';  // 复用现有的 UserData 类型

// 定义接口类型
export interface BatchReportStats {
  needReport: number;        // 需要生成报告的用户数
  lastUpdateTime: Date;      // 最后更新时间
}

export interface ProcessRecord {
  id: string;
  name: string;
  success: boolean;
  error?: string;
  status: string;  // 添加状态字段
  reportGenerated: boolean;
  pdfGenerated: boolean;
  timestamp: Date;
}

// 批量报告相关的 API 方法
export const batchReportApi = {
  // 获取待处理用户列表和统计信息
  getPendingReports: async () => {
    try {
      const response = await apiClient.get('/batch-report/pending');
      return response.data;
    } catch (error) {
      console.error('获取待处理列表失败:', error);
      throw error;
    }
  },

  // 开始批量处理
  startBatchProcess: async (userIds: string[]) => {
    try {
      const response = await apiClient.post('/batch-report/process', {
        userIds
      }, {
        timeout: 0,  // 不设置超时时间，因为批量处理可能需要较长时间
      });
      return response.data;
    } catch (error) {
      console.error('批量处理失败:', error);
      throw error;
    }
  },

  // 获取处理记录
  getProcessRecords: async () => {
    try {
      const response = await apiClient.get('/batch-report/records');
      return response.data;
    } catch (error) {
      console.error('获取处理记录失败:', error);
      throw error;
    }
  },

  // 获取处理进度
  getProcessProgress: async () => {
    try {
      const response = await apiClient.get('/batch-report/progress');
      return response.data;
    } catch (error) {
      console.error('获取处理进度失败:', error);
      throw error;
    }
  },

  // 检查是否有正在进行的处理任务
  checkProcessingStatus: async () => {
    try {
      const response = await apiClient.get('/batch-report/status');
      return response.data;
    } catch (error) {
      console.error('获取处理状态失败:', error);
      throw error;
    }
  }
}; 