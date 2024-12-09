import React, { useState, useEffect, Key } from 'react';
import { Table, Tag, Space, Button, Drawer, message, Select, Image, Descriptions, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { questionnaireApi } from '../../services/questionnaire';
import commonStyles from './common.module.css';
import { MatchingSection } from './components/MatchingSection';
import { UserDetailContent } from './components/UserDetailContent';
import { PersonalityReport } from './components/PersonalityReport';


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
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [genderFilter, setGenderFilter] = useState<string[]>([]);
  const [orientationFilter, setOrientationFilter] = useState<string[]>([]);
  const [nestedDrawerVisible, setNestedDrawerVisible] = useState(false);
  const [nestedUser, setNestedUser] = useState<UserData | null>(null);
  const [nestedGeneratingReport, setNestedGeneratingReport] = useState(false);
  const [originalUsers, setOriginalUsers] = useState<UserData[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);  // 添加 PDF 生成的 loading 状态

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
      render: (gender: string) => (
        <span className={`${commonStyles.genderTag} ${gender === 'male' ? commonStyles.genderMale : commonStyles.genderFemale}`}>
          {gender === 'male' ? '男' : '女'}
        </span>
      ),
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '微信号',
      dataIndex: 'wechat',
      key: 'wechat',
      width: 120,
    },
    {
      title: '性取向',
      dataIndex: 'orientation',
      key: 'orientation',
      width: 100,
      render: (orientation: string) => {
        const config = {
          straight: { text: '异性恋', className: commonStyles.orientationStraight },
          gay: { text: '同性恋', className: commonStyles.orientationGay },
          bisexual: { text: '双性恋', className: commonStyles.orientationBisexual }
        };
        const orientationConfig = config[orientation as keyof typeof config];
        return (
          <span className={`${commonStyles.orientationTag} ${orientationConfig.className}`}>
            {orientationConfig.text}
          </span>
        );
      },
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
          submitted: { className: commonStyles.statusSubmitted, text: '已提交' },
          reported: { className: commonStyles.statusReported, text: '已报告' },
          matched: { className: commonStyles.statusMatched, text: '已匹配' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <span className={`${commonStyles.statusTag} ${config.className}`}>
            {config.text}
          </span>
        );
      },
      filters: [
        { text: '已提交', value: 'submitted' },
        { text: '已报告', value: 'reported' },
        { text: '已匹配', value: 'matched' },
      ],
      onFilter: (value: boolean | Key, record: UserData) => record.status === String(value),
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

  // 修改生成报告的处理函数
  const handleGenerateReport = async () => {
    if (!selectedUser) return;
    setGeneratingReport(true);
    try {
      const result = await questionnaireApi.generateReport(selectedUser._id);
      if (result.success) {
        message.success('报告生成成功');
        setSelectedUser(result.data);
        fetchAllUsers();
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('报告生成失败');
    } finally {
      setGeneratingReport(false);
    }
  };

  // 添加生成 PDF 的处理函数
  const handleGeneratePDF = async () => {
    if (!selectedUser) return;
    setPdfLoading(true);
    try {
      const result = await questionnaireApi.generatePDF(selectedUser._id);
      if (result.success) {
        message.success('PDF生成成功');
        setSelectedUser(result.data);
        fetchAllUsers();
      }
    } catch (error) {
      console.error('生成PDF失败:', error);
      message.error('PDF生成失败');
    } finally {
      setPdfLoading(false);
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
        fetchAllUsers();
      }
    } catch (error) {
      console.error('匹配失败:', error);
      message.error('匹配失败');
    } finally {
      setMatchLoading(false);
    }
  };

  // 修改 fetchUsers 函数，将其拆分为两个函数
  const fetchAllUsers = async () => {
    try {
      const response = await questionnaireApi.getAll();
      if (response && response.success && Array.isArray(response.data)) {
        setOriginalUsers(response.data);
        applyFilters(response.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: UserData[]) => {
    let filteredData = [...data];

    // 应用所有筛选条件
    if (statusFilter.length > 0) {
      filteredData = filteredData.filter((user) => statusFilter.includes(user.status));
    }

    if (genderFilter.length > 0) {
      filteredData = filteredData.filter((user) => genderFilter.includes(user.gender));
    }

    if (orientationFilter.length > 0) {
      filteredData = filteredData.filter((user) => orientationFilter.includes(user.orientation));
    }

    if (searchText) {
      const keyword = searchText.toLowerCase();
      filteredData = filteredData.filter((user) => 
        user.name.toLowerCase().includes(keyword) ||
        user.phone.includes(keyword) ||
        user._id.toLowerCase().includes(keyword) ||
        user.location.toLowerCase().includes(keyword) ||
        user.occupation.toLowerCase().includes(keyword) ||
        user.wechat.toLowerCase().includes(keyword)
      );
    }

    setUsers(filteredData);
  };

  // 修改 useEffect
  useEffect(() => {
    fetchAllUsers();
  }, []); // 只在组件挂载时获取所有用户

  // 修改筛选条件的 useEffect
  useEffect(() => {
    if (originalUsers.length > 0) {
      applyFilters(originalUsers);
    }
  }, [statusFilter, genderFilter, orientationFilter, searchText]);

  // 修改处理函数以支持多选
  const handleStatusChange = (value: string[]) => {
    setStatusFilter(value);
  };

  const handleGenderChange = (value: string[]) => {
    setGenderFilter(value);
  };

  const handleOrientationChange = (value: string[]) => {
    setOrientationFilter(value);
  };

  // 修改搜索处理函数
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  // 添加新的处理函数
  const handleNestedGenerateReport = async () => {
    if (!nestedUser) return;
    setNestedGeneratingReport(true);
    try {
      const result = await questionnaireApi.generateReport(nestedUser._id);
      if (result.success) {
        message.success('报告生成成功');
        setNestedUser(result.data);
        fetchAllUsers(); // 更新用户列表
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('报告生成失败');
    } finally {
      setNestedGeneratingReport(false);
    }
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
              placeholder="搜索用户编号/姓名/手机号/微信/所在地/职业"
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 400 }}
            />
            <Select
              mode="multiple"  // 启用多选模式
              placeholder="性别筛选"
              style={{ width: 120 }}
              onChange={handleGenderChange}
              allowClear
              maxTagCount="responsive"  // 自动处理多选标签的显示
            >
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
            <Select
              mode="multiple"
              placeholder="性取向筛选"
              style={{ width: 120 }}
              onChange={handleOrientationChange}
              allowClear
              maxTagCount="responsive"
            >
              <Select.Option value="straight">异性恋</Select.Option>
              <Select.Option value="gay">同性恋</Select.Option>
              <Select.Option value="bisexual">双性恋</Select.Option>
            </Select>
            <Select
              mode="multiple"
              placeholder="状态筛选"
              style={{ width: 120 }}
              onChange={handleStatusChange}
              allowClear
              maxTagCount="responsive"
            >
              <Select.Option value="submitted">已提交</Select.Option>
              <Select.Option value="reported">已报告</Select.Option>
              <Select.Option value="matched">已匹配</Select.Option>
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
        title={selectedUser ? `${selectedUser.name}详情` : '用户详情'}
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedUser && (
          <div className={commonStyles.drawerContent}>
            <UserDetailContent user={selectedUser} />
            <PersonalityReport
              user={selectedUser}
              onGenerate={handleGenerateReport}
              onGeneratePDF={handleGeneratePDF}
              loading={generatingReport}
              pdfLoading={pdfLoading}
            />

            {/* 匹配 CP 部分 */}
            {selectedUser.matched_with ? (
              <section className={commonStyles.section}>
                <div className={commonStyles.sectionHeader}>
                  <h3 className={commonStyles.sectionTitle}>匹配 CP</h3>
                </div>
                <div className={commonStyles.matchInfo}>
                  <p>已匹配用户：{users.find(u => u._id === selectedUser.matched_with)?.name}</p>
                  <p>匹配时间：{new Date(selectedUser.matched_at!).toLocaleString()}</p>
                  <Button 
                    type="primary" 
                    danger
                    onClick={() => handleMatch('')}
                    loading={matchLoading}
                  >
                    取消匹配
                  </Button>
                </div>
              </section>
            ) : (
              <MatchingSection
                currentUser={selectedUser}
                allUsers={originalUsers.filter(u => 
                  u._id !== selectedUser._id && 
                  u.status !== 'matched' && 
                  !u.matched_with
                )}
                onViewDetails={(user) => {
                  setNestedUser(user);
                  setNestedDrawerVisible(true);
                }}
                onMatch={handleMatch}
              />
            )}
          </div>
        )}
      </Drawer>

      {/* 嵌套抽屉 */}
      <Drawer
        title={nestedUser ? `CP匹配 - ${nestedUser.name}详情` : '用户详情'}
        placement="right"
        width={720}
        onClose={() => setNestedDrawerVisible(false)}
        open={nestedDrawerVisible}
        push={false}
      >
        {nestedUser && (
          <div className={commonStyles.drawerContent}>
            <UserDetailContent user={nestedUser} />
            <PersonalityReport
              user={nestedUser}
              onGenerate={handleNestedGenerateReport}
              loading={nestedGeneratingReport}
              onGeneratePDF={handleGeneratePDF}
              pdfLoading={pdfLoading}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
