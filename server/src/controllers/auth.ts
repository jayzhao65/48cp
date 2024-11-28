// 文件作用：后端认证控制器
// 输入：HTTP请求中的用户名和密码
// 输出：JWT token或错误信息
// 与其他文件关系：
// - 被 routes/auth.ts 调用
// - 使用 config/auth.ts 中的配置信息
// - 生成JWT token供前端存储和使用

import { Request, Response } from 'express';
import { ADMIN_CREDENTIALS } from '../config/auth';
import jwt from 'jsonwebtoken';

// JWT签名密钥，优先使用环境变量，否则使用默认值
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (req: Request, res: Response) => {
  console.log('收到登录请求:', req.body);  // 添加日志
  
  const { username, password } = req.body;
  
  console.log('验证凭据:', { username, password });  // 添加日志
  
  // 验证用户名和密码是否与配置中的管理员凭据匹配
  if (username === ADMIN_CREDENTIALS.username && 
      password === ADMIN_CREDENTIALS.password) {
    // 如果验证通过，生成JWT token
    // token中包含用户名信息，24小时后过期
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // 返回成功响应和token
    res.json({
      success: true,
      token
    });
  } else {
    // 如果验证失败，返回401状态码和错误信息
    res.status(401).json({
      success: false,
      error: '账号或密码错误'
    });
  }
};