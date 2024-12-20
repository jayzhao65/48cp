import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserOutlined, 
  HeartOutlined, 
  DashboardOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从路径中获取当前选中的菜单项
  const selectedKey = location.pathname.split('/').pop() || 'dashboard';

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: 'couples',
      icon: <HeartOutlined />,
      label: 'CP管理',
    },
    {
      key: 'batch-report',
      icon: <FileTextOutlined />,
      label: '批量生成报告',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        padding: 0, 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <div style={{ marginLeft: 24 }}>48CP 管理系统</div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ 
              height: '100%', 
              borderRight: 0,
              writingMode: 'horizontal-tb'
            }}
            items={menuItems}
            onClick={({ key }) => navigate(`/admin/${key}`)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ 
            background: '#fff', 
            padding: 24, 
            margin: 0, 
            minHeight: 280,
            writingMode: 'horizontal-tb'
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
export default AdminLayout;
