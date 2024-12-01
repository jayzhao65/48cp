import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Questionnaire from './pages/questionnaire';
import AdminLogin from './pages/admin/login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/users';
import AdminCouples from './pages/admin/couples';
import SuccessPage from './pages/questionnaire/success';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.defaultAlgorithm],
        token: {
          // 可以在这里自定义主题颜色
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontSize: 14,
          marginXS: 8,
          marginSM: 12,
          marginMD: 16,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/questionnaire/success" element={<SuccessPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="couples" element={<AdminCouples />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/questionnaire" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;