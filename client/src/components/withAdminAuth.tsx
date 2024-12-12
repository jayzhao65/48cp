import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { authApi } from '../services/auth'; // 需要创建这个服务

export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAdminAuthComponent(props: P) {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      checkAuth();
    }, []);

    const checkAuth = async () => {
      try {
        const response = await authApi.checkAdminAuth();
        if (response.success) {
          setIsAuthorized(true);
        } else {
          message.error('请先登录');
          navigate('/admin/login');
        }
      } catch (error) {
        message.error('认证失败');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return <div>Loading...</div>; // 可以替换成更好看的loading组件
    }

    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };
} 