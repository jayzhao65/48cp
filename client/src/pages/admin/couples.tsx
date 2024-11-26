import React, { useState, useEffect } from 'react';
import { Table, Button, Drawer, Descriptions, message, Space, Image } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { coupleApi } from '../../services/couple';
import styles from './couples.module.css';
import { UserData } from './users';

interface CoupleData {
  _id: string;
  coupleId: number;
  user1: UserData;
  user2: UserData;
  matchedAt: string;
  task?: {
    content: {
      title: string;
      description: string;
      steps: string[];
      tips: string[];
      expectedDuration: number;
    };
    generatedAt: string;
    generationCount: number;
  } | null;
}

export default function Couples() {
  const [couples, setCouples] = useState<CoupleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCouple, setSelectedCouple] = useState<CoupleData | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [generatingTask, setGeneratingTask] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [userDrawerVisible, setUserDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const columns: ColumnsType<CoupleData> = [
    {
      title: 'CP编号',
      dataIndex: 'coupleId',
      key: 'coupleId',
      width: 100,
    },
    {
      title: '用户1',
      key: 'user1',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.user1.name}</div>
          <div className={styles.userInfo}>
            {record.user1.gender === 'male' ? '男' : '女'} · {record.user1.age}岁 · {record.user1.location}
          </div>
        </div>
      ),
    },
    {
      title: '用户2',
      key: 'user2',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.user2.name}</div>
          <div className={styles.userInfo}>
            {record.user2.gender === 'male' ? '男' : '女'} · {record.user2.age}岁 · {record.user2.location}
          </div>
        </div>
      ),
    },
    {
      title: '匹配时间',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      width: 200,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '任务状态',
      key: 'taskStatus',
      width: 150,
      render: (_, record) => (
        <span className={record.task ? styles.taskGenerated : styles.taskPending}>
          {record.task ? `已生成(${record.task.generationCount}次)` : '未生成'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const fetchCouples = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await coupleApi.getAll(page, pageSize);
      setCouples(response.data.list);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: response.data.total
      });
    } catch (error) {
      message.error('获取CP列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (couple: CoupleData) => {
    setSelectedCouple(couple);
    setDrawerVisible(true);
  };

  const handleGenerateTask = async () => {
    if (!selectedCouple) return;
    
    try {
      setGeneratingTask(true);
      const result = await coupleApi.generateTask(selectedCouple._id);
      if (result.success) {
        message.success('任务生成成功');
        setSelectedCouple(result.data);
        fetchCouples(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error('生成任务失败');
    } finally {
      setGeneratingTask(false);
    }
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setUserDrawerVisible(true);
  };

  useEffect(() => {
    fetchCouples();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CP管理</h1>
      </div>

      <Table
        columns={columns}
        dataSource={couples}
        loading={loading}
        rowKey="_id"
        pagination={pagination}
        onChange={(pagination) => {
          fetchCouples(pagination.current, pagination.pageSize);
        }}
      />

      <Drawer
        title="CP详情"
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedCouple && (
          <div className={styles.drawerContent}>
            <div className={styles.coupleInfo}>
              <div className={styles.userCards}>
                <div 
                  className={styles.userCard}
                  onClick={() => handleUserClick(selectedCouple.user1)}
                >
                  <h3>用户1</h3>
                  <p>ID: {selectedCouple.user1._id.slice(-6).toUpperCase()}</p>
                  <p>姓名: {selectedCouple.user1.name}</p>
                  <p>年龄: {selectedCouple.user1.age}岁</p>
                  <p>性别: {selectedCouple.user1.gender === 'male' ? '男' : '女'}</p>
                  <p>所在地: {selectedCouple.user1.location}</p>
                </div>

                <div 
                  className={styles.userCard}
                  onClick={() => handleUserClick(selectedCouple.user2)}
                >
                  <h3>用户2</h3>
                  <p>ID: {selectedCouple.user2._id.slice(-6).toUpperCase()}</p>
                  <p>姓名: {selectedCouple.user2.name}</p>
                  <p>年龄: {selectedCouple.user2.age}岁</p>
                  <p>性别: {selectedCouple.user2.gender === 'male' ? '男' : '女'}</p>
                  <p>所在地: {selectedCouple.user2.location}</p>
                </div>
              </div>

              <div className={styles.matchInfo}>
                <p>匹配时间：{new Date(selectedCouple.matchedAt).toLocaleString()}</p>
              </div>

              <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
                <Button
                  type="primary"
                  onClick={handleGenerateTask}
                  loading={generatingTask}
                  disabled={generatingTask}
                >
                  {selectedCouple.task ? '生成任务' : 'chogn xin生成任务'}
                </Button>

                {selectedCouple.task && selectedCouple.task.content && (
                  <div className={styles.taskContent}>
                    <div className={styles.taskMeta}>
                      <span>生成时间：{new Date(selectedCouple.task.generatedAt).toLocaleString()}</span>
                      <span>生成次数：{selectedCouple.task.generationCount}</span>
                    </div>
                    <div className={styles.taskDetails}>
                      <h3>{selectedCouple.task.content.title}</h3>
                      <p>{selectedCouple.task.content.description}</p>
                      
                      <h4>任务步骤：</h4>
                      <ul>
                        {selectedCouple.task.content.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                      
                      <h4>注意事项：</h4>
                      <ul>
                        {selectedCouple.task.content.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                      
                      <p>预计时长：{selectedCouple.task.content.expectedDuration}小时</p>
                    </div>
                  </div>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title="用户详情"
        placement="right"
        width={720}
        onClose={() => setUserDrawerVisible(false)}
        open={userDrawerVisible}
      >
        {selectedUser && <UserDetail user={selectedUser} />}
      </Drawer>
    </div>
  );
}

function UserDetail({ user }: { user: UserData }) {
  return (
    <div className={styles.drawerContent}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>基本信息</h3>
        <Descriptions column={2}>
          <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
          <Descriptions.Item label="性别">
            {user.gender === 'male' ? '男' : '女'}
          </Descriptions.Item>
          <Descriptions.Item label="手机">{user.phone || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="微信">{user.wechat || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{user.birth_date || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="星座">{user.zodiac || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="MBTI">{user.mbti || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="所在地">{user.location}</Descriptions.Item>
          <Descriptions.Item label="职业">{user.occupation || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="性取向">
            {user.orientation ? {
              straight: '异性恋',
              gay: '同性恋',
              bisexual: '双性恋'
            }[user.orientation] : '未填写'}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">{user.age ? `${user.age}岁` : '未填写'}</Descriptions.Item>
        </Descriptions>
      </section>

      {user.self_intro && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>自我介绍</h3>
          <p>{user.self_intro}</p>
        </section>
      )}

      {user.images && user.images.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>照片</h3>
          <div className={styles.imageGrid}>
            {user.images.map((url, index) => (
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
      )}

      {user.personality_report?.content?.raw_response && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>性格报告</h3>
          <div className={styles.reportSection}>
            <div className={styles.reportMeta}>
              <span>生成时间：{new Date(user.personality_report.generated_at).toLocaleString()}</span>
              <span>生成次数：{user.personality_report.generation_count}</span>
            </div>
            <div className={styles.reportContent}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {user.personality_report.content.raw_response}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
