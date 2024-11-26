import { Form, Input, Button } from 'antd';

export default function Login() {
  return (
    <div style={{ maxWidth: 300, margin: '100px auto' }}>
      <h1>登录</h1>
      <Form>
        <Form.Item label="账号" name="username">
          <Input />
        </Form.Item>
        <Form.Item label="密码" name="password">
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}