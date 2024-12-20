import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Space, Table, message, Typography, Statistic, Progress, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from './BatchReport.module.less';
import { batchReportApi } from '../../services/batchReport';

// 定义页面所需的类型
interface Statistics {
  needReport: number;        // 需要生成报告的用户数
  lastUpdateTime: Date;      // 最后更新时间
}

interface PendingUser {
  _id: string;
  name: string;
  matchedAt: Date;
  matchedWith: {
    _id: string;
    name: string;
  };
}

interface ProcessRecord {
  id: string;
  name: string;
  success: boolean;
  error?: string;
  reportGenerated: boolean;
  pdfGenerated: boolean;
  timestamp: Date;
}

// 添加处理进度的类型
interface ProcessProgress {
  current: number;
  total: number;
  currentUser: string;
  status: string;
}

const BatchReport: React.FC = () => {
  // 状态管理
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    needReport: 0,
    lastUpdateTime: new Date()
  });
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState<string>('');
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  // 添加 ref 来保存 interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await batchReportApi.getPendingReports();
      if (response.success) {
        setStatistics({
          needReport: response.data.needReport,
          lastUpdateTime: new Date(response.data.lastUpdateTime)
        });
        setPendingUsers(response.data.users);
      } else {
        message.error('获取数据失败');
      }
    } catch (error) {
      message.error('更新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 在组件加载时获取数据
  useEffect(() => {
    handleRefresh();
  }, []);

  // 抽取轮询逻辑为单独的函数
  const startPolling = useCallback(() => {
    // 清除可能存在的旧的轮询
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // 立即执行一次获取进度
    const fetchProgress = async () => {
      try {
        const response = await batchReportApi.getProcessProgress();
        if (response.data) {
          setProgress(response.data);
          if (response.data.current === response.data.total && 
              response.data.status.includes('所有处理已完成')) {
            setProcessing(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            message.success('批量处理完成！');
            fetchProcessRecords();
          }
        }
      } catch (error) {
        console.error('获取进度失败:', error);
      }
    };

    // 立即执行一次
    fetchProgress();

    // 设置轮询并保存引用
    pollIntervalRef.current = setInterval(fetchProgress, 1000);
  }, []);  // 依赖项为空数组，因为这个函数不需要依赖任何状态

  // 在组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // 开始批量处理
  const handleStartProcess = async () => {
    try {
      setProcessing(true);
      const selectedUserIds = pendingUsers.map(user => user._id);
      await batchReportApi.startBatchProcess(selectedUserIds);
      // 开始轮询进度
      startPolling();
    } catch (error) {
      message.error('开始处理失败');
      setProcessing(false);
    }
  };

  // 渲染进度显示
  const renderProgress = () => {
    if (!processing || !progress) return null;

    return (
      <Card className={styles.progressCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress 
            percent={Math.floor((progress.current / progress.total) * 100)}
            format={() => `${progress.current}/${progress.total}`}
          />
          <Alert
            message={progress.status}
            type="info"
            showIcon
          />
        </Space>
      </Card>
    );
  };

  // 表格列配置
  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '匹配对象',
      dataIndex: ['matchedWith', 'name'],
      key: 'matchedWith',
    },
    {
      title: '匹配时间',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
  ];

  // 获取处理记录的函数
  const fetchProcessRecords = async () => {
    try {
      const response = await batchReportApi.getProcessRecords();      
      if (response.success) {
        setProcessRecords(response.data);
      }
    } catch (error) {
      message.error('获取处理记录失败');
    }
  };

  // 在组件加载时获取记录
  useEffect(() => {
    console.log('组件加载，开始获取处理记录');
    fetchProcessRecords();
  }, []);

  // 在表格渲染前打印数据
  const renderProcessRecordsTable = () => {
    return (
      <Card title="处理记录" className={styles.tableCard}>
        <Table
          columns={[
            {
              title: '用户名',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '状态',
              key: 'status',
              render: (record: ProcessRecord) => (
                record.success ? '成功' : '失败'
              ),
            },
            {
              title: '报告生成',
              dataIndex: 'reportGenerated',
              key: 'reportGenerated',
              render: (value: boolean) => value ? '成功' : '未生成',
            },
            {
              title: 'PDF生成',
              dataIndex: 'pdfGenerated',
              key: 'pdfGenerated',
              render: (value: boolean) => value ? '成功' : '未生成',
            },
            {
              title: '处理时间',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (date: Date) => new Date(date).toLocaleString(),
            },
            {
              title: '错误信息',
              dataIndex: 'error',
              key: 'error',
            },
          ]}
          dataSource={processRecords}
          rowKey="_id"
        />
      </Card>
    );
  };

  // 在组件加载时检查处理状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await batchReportApi.checkProcessingStatus();
        if (response.data.isProcessing) {
          setProcessing(true);
          // 如果有正在处理的任务，开始轮询进度
          startPolling();
        }
      } catch (error) {
        console.error('检查处理状态失败:', error);
      }
    };
    
    checkStatus();
  }, [startPolling]);  // 添加 startPolling 作为依赖项

  return (
    <div className={styles.container}>
      {/* 统计信息卡片 */}
      <Card className={styles.statsCard}>
        <Space size="large">
          <Statistic title="待生成报告数" value={statistics.needReport} />
          <Typography.Text type="secondary">
            最后更新: {statistics.lastUpdateTime.toLocaleString()}
          </Typography.Text>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <Card className={styles.actionCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新数据
            </Button>
            <Button
              type="primary"
              onClick={handleStartProcess}
              loading={processing}
              disabled={!statistics.needReport}
            >
              开始处理
            </Button>
          </Space>
          
          {currentProcessing && (
            <Typography.Text type="secondary">
              {currentProcessing}
            </Typography.Text>
          )}
        </Space>
      </Card>

      {/* 进度显示 */}
      {renderProgress()}

      {/* 待处理用户列表 */}
      <Card title="待处理用户" className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={pendingUsers}
          rowKey="_id"
          loading={refreshing}
        />
      </Card>

      {/* 处理记录 */}
      {renderProcessRecordsTable()}
    </div>
  );
};

export default BatchReport; 