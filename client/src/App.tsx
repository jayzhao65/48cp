import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Questionnaire from './pages/questionnaire';
import AdminLogin from './pages/admin/login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/users';
import AdminCouples from './pages/admin/couples';
import SuccessPage from './pages/questionnaire/success';

function App() {
  return (
    <BrowserRouter>
   <Routes>
  {/* 问卷页面 */}
  <Route path="/questionnaire" element={<Questionnaire />} />
  <Route path="/questionnaire/success" element={<SuccessPage />} />
        {/* 管理员登录 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* 管理后台（需要登录） */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="couples" element={<AdminCouples />} />
        </Route>
        
        {/* 默认重定向到问卷页面 */}
        <Route path="/" element={<Navigate to="/questionnaire" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;