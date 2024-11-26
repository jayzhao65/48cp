import { Layout, Menu } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  UserOutlined, 
  HeartOutlined, 
  DashboardOutlined 
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: <span style={{ writingMode: 'horizontal-tb' }}> 用户管理 </span>,
    },
    {
      key: 'couples',
      icon: <HeartOutlined />,
      label: <span style={{ writingMode: 'horizontal-tb' }}> CP管理 </span>,
    },
  ];

  return (
    <Layout style={{ 
      minHeight: '100vh',
      writingMode: 'horizontal-tb',
      textOrientation: 'mixed'
    }}>
      <Header style={{ padding: 0, background: '#fff' }}>
        <div style={{ 
          marginLeft: 24,
          writingMode: 'horizontal-tb',
          textOrientation: 'mixed'
        }}>48CP 管理系统</div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(`/admin/${key}`)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;