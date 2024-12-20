import { Request, Response } from 'express';
import { Questionnaire, IQuestionnaire } from '../models/questionnaire';
import { generateReport, handlePDFGeneration } from './questionnaire';
import { ProcessRecord } from '../models/processRecord';

// 存储处理进度的全局变量（实际项目中可能需要使用 Redis 等存储）
let processProgress = {
  current: 0,
  total: 0,
  currentUser: '',
  status: ''
};

// 添加全局变量来跟踪处理状态
let isProcessing = false;

// 获取待处理用户列表和统计信息
export const getPendingReports = async (req: Request, res: Response) => {
  try {
    console.log('开始获取待处理用户列表...');
    
    // 获取所有已匹配的用户，但还没有生成报告的
    const matchedUsers = await Questionnaire.find({
      status: 'matched',
      matched_with: { $exists: true },
      $or: [
        { 'personality_report': { $exists: false } },
        { 'personality_report.generation_count': { $in: [null, 0] } }
      ]
    }).populate<{ matched_with: IQuestionnaire }>('matched_with', 'name');

    // 格式化返回数据
    const formattedUsers = matchedUsers.map(user => ({
      _id: user._id,
      name: user.name,
      matchedAt: user.matched_at,
      matchedWith: user.matched_with ? {
        _id: user.matched_with._id,
        name: user.matched_with.name
      } : null
    }));

    res.json({
      success: true,
      data: {
        needReport: matchedUsers.length,
        users: formattedUsers,
        lastUpdateTime: new Date()
      }
    });
  } catch (error: any) {
    console.error('获取待处理列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取待处理列表失败'
    });
  }
};

// 开始批量处理
export const startBatchProcess = async (req: Request, res: Response) => {
  if (isProcessing) {
    return res.status(400).json({
      success: false,
      error: '已有正在进行的处理任务'
    });
  }

  isProcessing = true;
  try {
    const { userIds } = req.body;
    const processRecords = [];

    // 初始化进度
    processProgress = {
      current: 0,
      total: userIds.length,
      currentUser: '',
      status: '准备开始处理...'
    };

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      processProgress.current = i + 1;
      
      const record = {
        userId,
        name: '',
        success: false,
        error: '',
        reportGenerated: false,
        pdfGenerated: false,
        timestamp: new Date(),
        status: '开始处理',
        pdf_url: ''
      };

      try {
        // 1. 获取用户信息
        const user = await Questionnaire.findById(userId);
        if (!user) {
          throw new Error('用户不存在');
        }
        record.name = user.name;
        processProgress.currentUser = user.name;
        processProgress.status = `正在为 ${user.name} 生成报告...`;
        record.status = processProgress.status;

        // 2. 生成报告
        const reportReq = {
          params: { id: userId },
          body: {},
          query: {},
          headers: {}
        } as unknown as Request;
        
        const reportRes = {
          json: (data: any) => {
            if (data.success) {
              record.reportGenerated = true;
            }
          }
        } as Response;
        
        await generateReport(reportReq, reportRes);
        record.reportGenerated = true;
        processProgress.status = `${user.name} 的报告已生成，正在生成PDF...`;
        record.status = processProgress.status;

        // 3. 生成PDF - 使用现有环境配置
        const pdfReq = {
          params: { id: userId },
          protocol: 'http',
          get: (header: string) => {
            if (header === 'host') {
              return process.env.NODE_ENV === 'production' 
                ? req.get('host')  // 在生产环境中使用原始请求的 host
                : `localhost:${process.env.PORT || 3001}`; // 在开发环境中使用环境变量中的端口
            }
            return null;
          }
        } as unknown as Request;
        
        let pdfData: any = null;
        const pdfRes = {
          json: (data: any) => {
            pdfData = data;
            if (data.success) {
              record.pdfGenerated = true;
            }
          }
        } as Response;
        
        await handlePDFGeneration(pdfReq, pdfRes);
        
        const updatedQuestionnaire = await Questionnaire.findById(userId);
        const pdfUrl = updatedQuestionnaire?.personality_report?.pdf_reports?.[0]?.url;

        // 更新处理记录
        record.pdf_url = pdfUrl || '';

        if (pdfData && pdfData.success) {
          record.pdfGenerated = true;
          processProgress.status = `${user.name} 的PDF已生成`;
          record.status = processProgress.status;
        }

        record.success = true;

        // 保存处理记录到数据库
        await ProcessRecord.create(record);
      } catch (error: any) {
        record.error = error.message;
        processProgress.status = `处理 ${record.name} 时出错: ${error.message}`;
        record.status = processProgress.status;
        // 即使处理失败也保存记录
        await ProcessRecord.create(record);
      }

      processRecords.push(record);
    }

    // 处理完成后更新状态
    processProgress.status = '所有处理已完成';

    res.json({
      success: true,
      data: processRecords
    });
  } finally {
    isProcessing = false;
  }
};

// 获取处理记录
export const getProcessRecords = async (req: Request, res: Response) => {
  try {
    // 获取最近的100条处理记录
    const records = await ProcessRecord.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      data: records
    });
  } catch (error: any) {
    console.error('获取处理记录失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取处理记录失败'
    });
  }
};

// 获取处理进度
export const getProcessProgress = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: processProgress
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取进度失败'
    });
  }
};

// 添加状态检查控制器
export const checkProcessingStatus = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      isProcessing
    }
  });
}; 