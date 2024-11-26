import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Drawer, message, Select, Image, Descriptions, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { questionnaireApi } from '../../services/questionnaire';
import commonStyles from './common.module.css';


// 定义用户数据的类型接口，描述了用户的所有属性
export interface UserData {
  _id: string;           // 用户唯一标识ID
  name: string;          // 用户姓名
  gender: 'male' | 'female';  // 性别（男/女）
  location: string;      // 所在地
  orientation: 'straight' | 'gay' | 'bisexual';  // 性取向
  occupation: string;    // 职业
  status: 'submitted' | 'reported' | 'matched';  // 用户状态
  createdAt: string;     // 创建时间
  mbti: string;         // MBTI性格类型
  zodiac: string;       // 星座
  birth_date: string;   // 出生日期
  wechat: string;       // 微信号
  phone: string;        // 手机号
  self_intro: string;   // 自我介绍
  images: string[];     // 用户上传的图片数组
  personality_report?: {  // 性格报告（可选）
    content?: {
      raw_response?: string;
    };
    generated_at: string; // 报告生成时间
    generation_count: number; // 报告生成次数
  };
  matched_with?: string;    // 匹配的用户ID
  matched_at?: string;      // 匹配时间
  age?: number;            // 年龄
}


// 用户管理页面的主组件
export default function Users() {
  // 使用useState定义组件的状态
  const [users, setUsers] = useState<UserData[]>([]); // 存储用户列表
  const [loading, setLoading] = useState(true);       // 加载状态
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null); // 当前选中的用户
  const [drawerVisible, setDrawerVisible] = useState(false); // 抽屉组件是否可见
  const [generatingReport, setGeneratingReport] = useState(false); // 是否正在生成报告
  const [matchLoading, setMatchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 定义表格的列配置
  const columns: ColumnsType<UserData> = [
    {
      title: '用户编号',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id: string) => id.slice(-6).toUpperCase(), // 只显示ID的后6位
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => (gender === 'male' ? '男' : '女'),
      filters: [
        { text: '男', value: 'male' },
        { text: '女', value: 'female' },
      ],
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '性取向',
      dataIndex: 'orientation',
      key: 'orientation',
      width: 100,
      render: (orientation: string) => ({
        straight: '异性恋',
        gay: '同性恋',
        bisexual: '双性恋'
      }[orientation]),
    },
    {
      title: '职业',
      dataIndex: 'occupation',
      key: 'occupation',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          submitted: { className: commonStyles.taskGenerated, text: '已提交' },
          reported: { className: commonStyles.taskPending, text: '已报告' },
          matched: { className: commonStyles.taskGenerated, text: '已匹配' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <span className={`${commonStyles.taskTag} ${config.className}`}>
            {config.text}
          </span>
        );
      },
      filters: [
        { text: '已提交', value: 'submitted' },
        { text: '已报告', value: 'reported' },
        { text: '已匹配', value: 'matched' },
      ],
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (age: number) => `${age}岁`,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <button 
          className={commonStyles.actionButton}
          onClick={() => handleViewDetails(record)}
        >
          查看详情
        </button>
      ),
    },
  ];

  // 处理查看详情按钮的点击事件
  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setDrawerVisible(true);
  };

  // 处理生成报告的函数
  const handleGenerateReport = async () => {
    if (!selectedUser) return;
    setGeneratingReport(true);
    try {
      const result = await questionnaireApi.generateReport(selectedUser._id);
      if (result.success) {
        message.success('报告生成成功');
        setSelectedUser(result.data);
        fetchUsers();
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('报告生成失败');
    } finally {
      setGeneratingReport(false);
    }
  };

  // 处理匹配用户的函数
  const handleMatch = async (targetUserId: string) => {
    if (!selectedUser) return;
    setMatchLoading(true);
    try {
      const result = await questionnaireApi.matchUsers(selectedUser._id, targetUserId);
      if (result.success) {
        message.success('匹配成功');
        setSelectedUser(result.data);
        fetchUsers();
      }
    } catch (error) {
      console.error('匹配失败:', error);
      message.error('匹配失败');
    } finally {
      setMatchLoading(false);
    }
  };

  // 组件加载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  // 获取用户列表的函数
  const fetchUsers = async () => {
    try {
      const response = await questionnaireApi.getAll();
      console.log('完整的响应:', response); // 打印完整响应
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('设置用户数据:', response.data);
        setUsers(response.data);
      } else {
        console.error('响应格式不正确:', response);
        message.error('数据格式错误');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value);
    // TODO: Implement filtering logic based on status
  };

  const handleSearch = (value: string) => {
    // TODO: Implement search logic
    console.log('Searching for:', value);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  // 渲染页面内容
  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.pageHeader}>
        <h1 className={commonStyles.pageTitle}>用户管理</h1>
        <p className={commonStyles.pageDescription}>
          管理系统中的所有用户，查看用户详情和审核状态
        </p>
      </div>

      <div className={commonStyles.contentCard}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Input.Search
              placeholder="搜索用户名或手机号"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="审核状态"
              style={{ width: 120 }}
              onChange={handleStatusChange}
              allowClear
            >
              <Select.Option value="pending">待审核</Select.Option>
              <Select.Option value="approved">已通过</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="_id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </div>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedUser && (
          <div className={commonStyles.drawerContent}>
            {/* 基本信息部分 */}
            <section className={commonStyles.section}>
              <h3 className={commonStyles.sectionTitle}>基本信息</h3>
              <Descriptions column={2}>
                <Descriptions.Item label="姓名">{selectedUser.name}</Descriptions.Item>
                <Descriptions.Item label="性别">
                  {selectedUser.gender === 'male' ? '男' : '女'}
                </Descriptions.Item>
                <Descriptions.Item label="手机">{selectedUser.phone}</Descriptions.Item>
                <Descriptions.Item label="微信">{selectedUser.wechat}</Descriptions.Item>
                <Descriptions.Item label="出生日期">{selectedUser.birth_date}</Descriptions.Item>
                <Descriptions.Item label="星座">{selectedUser.zodiac}</Descriptions.Item>
                <Descriptions.Item label="MBTI">{selectedUser.mbti}</Descriptions.Item>
                <Descriptions.Item label="所在地">{selectedUser.location}</Descriptions.Item>
                <Descriptions.Item label="职业">{selectedUser.occupation}</Descriptions.Item>
                <Descriptions.Item label="性取向">
                  {{
                    straight: '异性恋',
                    gay: '同性恋',
                    bisexual: '双性恋'
                  }[selectedUser.orientation]}
                </Descriptions.Item>
                <Descriptions.Item label="年龄">{selectedUser.age}岁</Descriptions.Item>
              </Descriptions>
            </section>

            {/* 自我介绍部分 */}
            <section className={commonStyles.section}>
              <h3 className={commonStyles.sectionTitle}>自我介绍</h3>
              <p>{selectedUser.self_intro}</p>
            </section>

            {/* 照片展示部分 */}
            <section className={commonStyles.section}>
              <h3 className={commonStyles.sectionTitle}>照片</h3>
              <div className={commonStyles.imageGrid}>
                {selectedUser.images.map((url, index) => (
                  <Image
                    key={index}
                    src={url}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover' }}
                  />
                ))}
              </div>
            </section>

            {/* 性格报告部分 */}
            <section className={commonStyles.section}>
              <div className={commonStyles.sectionHeader}>
                <h3 className={commonStyles.sectionTitle}>性格报告</h3>
                <Button
                  type="primary"
                  onClick={handleGenerateReport}
                  loading={generatingReport}
                  disabled={generatingReport}
                >
                  {selectedUser.personality_report?.content?.raw_response ? '重新生成报告' : '生成报告'}
                </Button>
              </div>

              {/* 如果存在性格报告则显示报告内容 */}
              {selectedUser.personality_report?.content?.raw_response && (
                <div className={commonStyles.reportSection}>
                  <div className={commonStyles.reportMeta}>
                    <span>生成时间：{new Date(selectedUser.personality_report.generated_at).toLocaleString()}</span>
                    <span>生成次数：{selectedUser.personality_report.generation_count}</span>
                  </div>
                  <div className={commonStyles.reportContent}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedUser.personality_report.content.raw_response}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 添加匹配 CP 部分 */}
            <section className={commonStyles.section}>
              <div className={commonStyles.sectionHeader}>
                <h3 className={commonStyles.sectionTitle}>匹配 CP</h3>
              </div>
              
              {selectedUser.matched_with ? (
                // 如果已经匹配，显示匹配信息
                <div className={commonStyles.matchInfo}>
                  <p>已匹配用户：{users.find(u => u._id === selectedUser.matched_with)?.name}</p>
                  <p>匹配时间：{new Date(selectedUser.matched_at!).toLocaleString()}</p>
                  <Button 
                    type="primary" 
                    danger
                    onClick={() => handleMatch('')} // 传空字符串表示取消匹配
                  >
                    取消匹配
                  </Button>
                </div>
              ) : (
                // 如果未匹配，显示用户选择框
                <div className={commonStyles.matchSelector}>
                  <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder="选择要匹配的用户"
                    optionFilterProp="children"
                    loading={matchLoading}
                    onChange={handleMatch}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={users
                      .filter(u => {
                        // 基本条件：不能是自己且未被匹配
                        const basicCondition = u._id !== selectedUser._id && !u.matched_with;
                        
                        // 根据性取向判断性别匹配条件
                        let genderMatch = false;
                        
                        switch(selectedUser.orientation) {
                          case 'straight':
                            // 异性恋：只匹配异性且对方也是异性恋
                            genderMatch = u.gender !== selectedUser.gender && u.orientation === 'straight';
                            break;
                          case 'gay':
                            // 同性恋：只匹配同性且对方也是同性恋
                            genderMatch = u.gender === selectedUser.gender && u.orientation === 'gay';
                            break;
                          case 'bisexual':
                            // 双性恋：可以匹配异性恋的异性或同性恋的同性
                            genderMatch = (u.gender !== selectedUser.gender && u.orientation === 'straight') || 
                                        (u.gender === selectedUser.gender && u.orientation === 'gay');
                            break;
                        }
                        
                        return basicCondition && genderMatch;
                      })
                      .map(u => ({
                        value: u._id,
                        label: `${u.name} (${u.gender === 'male' ? '男' : '女'}, ${u.age || '未知'}岁, ${u.location})`
                      }))}
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
