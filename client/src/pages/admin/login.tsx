import { Form, Input, Button, Checkbox,message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/auth';
import styles from './login.module.css';


export default function Login() {
  const navigate = useNavigate();
  const [form] = Form.useForm();


  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const result = await authApi.login(values);
      if (result.success) {
        message.success('登录成功');
        navigate('/admin/dashboard');
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('登录失败，请重试');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftSection}>
        <div className={styles.illustration}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
          <div className={styles.shape4}></div>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.loginContent}>
          <div className={styles.loginHeader}>
            <div className={styles.logo}>+</div>
            <h1 className={styles.title}>小伙子们，笑一笑</h1>
            <p className={styles.subtitle}>Have a happy silly day!</p>
          </div>

          <Form 
            form={form} 
            onFinish={handleSubmit} 
            className={styles.form}
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="Email"
              rules={[{ required: true, message: 'Please input your email' }]}
            >
              <Input placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password' }]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" className={styles.submitButton}>
              Log In
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}