// 文件作用：前端认证服务
// 输入：用户名和密码
// 输出：登录结果（包含token）
// 与其他文件关系：
// - 被前端登录页面调用
// - 通过 apiClient 与后端 /login 接口通信
// - 将token存储在localStorage中供其他API请求使用
import { apiClient } from './api';

export const authApi = {
  // 登录方法：接收用户名和密码，返回登录结果
  login: async (values: { username: string; password: string }) => {
    try {
      // 向后端发送POST请求，路径为/login
      const response = await apiClient.post('/login', values);
      // 如果登录成功，将token保存到浏览器的localStorage中
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
      }
      // 返回后端的响应数据
      return response.data;
    } catch (error) {
      // 如果发生错误，向上抛出异常
      throw error;
    }
  }
};