import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Typography } from 'antd';
import { UserOutlined, HeartOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import { dashboardApi, DashboardStats } from '../../services/dashboard';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCouples: 0,
    recentUsers: [],
    recentCouples: [],
    genderDistribution: { male: 0, female: 0 },
    statusDistribution: { submitted: 0, reported: 0, matched: 0 }
  });

  const fetchStats = async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>数据概览</h1>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="报名用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="匹配CP数"
              value={stats.totalCouples}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="男生数量"
              value={stats.genderDistribution.male}
              prefix={<ManOutlined />}
              valueStyle={{ color: '#0066ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="女生数量"
              value={stats.genderDistribution.female}
              prefix={<WomanOutlined />}
              valueStyle={{ color: '#ff66cc' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card title="最近注册用户">
            <List
              dataSource={stats.recentUsers}
              renderItem={user => (
                <List.Item>
                  <Typography.Text>{user.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近匹配CP">
            <List
              dataSource={stats.recentCouples}
              renderItem={couple => (
                <List.Item>
                  <Typography.Text>
                    {couple.user1.name} ❤ {couple.user2.name}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {new Date(couple.matchedAt).toLocaleDateString()}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="状态分布">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="已提交" value={stats.statusDistribution.submitted} />
              </Col>
              <Col span={8}>
                <Statistic title="已举报" value={stats.statusDistribution.reported} />
              </Col>
              <Col span={8}>
                <Statistic title="已匹配" value={stats.statusDistribution.matched} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
