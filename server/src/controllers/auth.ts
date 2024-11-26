import { Request, Response } from 'express';
import { ADMIN_CREDENTIALS } from '../config/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && 
      password === ADMIN_CREDENTIALS.password) {
    // 生成 JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      success: true,
      token
    });
  } else {
    res.status(401).json({
      success: false,
      error: '账号或密码错误'
    });
  }
};