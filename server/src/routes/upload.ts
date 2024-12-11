import 'dotenv/config';
// 文件作用：处理文件上传相关的路由配置
// 主要功能：
// 1. 配置文件上传中间件
// 2. 处理图片上传请求
// 与其他文件关系：
// - 使用 multer 处理文件上传
// - 使用 ../controllers/upload 中的控制器函数
// - 被 app.ts 引用并注册到 /api 路径下

import express, { NextFunction } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/upload';
import path from 'path';
import fs from 'fs';
import Client from 'ssh2-sftp-client';

// 添加环境变量检查
console.log('环境变量检查:', {
  SFTP_HOST: process.env.SFTP_HOST,
  SFTP_PORT: process.env.SFTP_PORT,
  SFTP_USERNAME: process.env.SFTP_USERNAME,
  // 不要打印密码
});

// SFTP 客户端配置
const sftpConfig = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT) || 22,
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_PASSWORD
};

// 配置 multer 存储选项
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp-uploads'); // 临时目录
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    console.log('Multer destination:', uploadDir);
    console.log('File info:', file);
    cb(null, uploadDir);
  },
  // 设置文件名生成规则
  filename: (req, file, cb) => {
    // 生成文件名：MMDD-随机数.扩展名
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = month + day;
    
    // 生成随机数
    const randomSuffix = Math.round(Math.random() * 1E4);
    
    // 获取文件扩展名
    const fileExt = file.originalname.split('.').pop();
    
    // 组合新的文件名: 名字-MMDD-随机数.扩展名
    const filename = `${dateStr}-${randomSuffix}.${fileExt}`;
    
    console.log('Generated filename:', filename);  // 添加日志
    cb(null, filename);
  }
});

// 创建 multer 实例并配置
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 限制文件大小为10MB
    files: 10                     // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    console.log('Checking file type:', file.mimetype);  // 添加日志
    // 检查文件类型是否为图片
    if (!file.mimetype.startsWith('image/')) {
      console.log('File rejected: not an image');  // 添加日志
      // 如果不是图片类型，返回错误
      cb(new Error('只能上传图片文件'));
      return;
    }
    cb(null, true);
  }
});

const router = express.Router();

// POST /api/upload - 处理图片上传
router.post('/upload', async (req, res) => {
  try {
    console.log('=============== 上传请求开始 ===============');

    // 使用 Promise 处理文件上传
    await new Promise((resolve, reject) => {
      upload.single('image')(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          reject(err);
          return;
        }
        resolve(req.file);
      });
    });

    // 确保文件已上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有接收到文件'
      });
    }

    // 添加更详细的 SFTP 日志
    console.log('开始 SFTP 连接，配置:', {
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USERNAME
    });

    const sftp = new Client();
    await sftp.connect(sftpConfig);
    console.log('SFTP 连接成功');
    
    const localPath = req.file.path;
    const remotePath = `/var/www/48cp/server/uploads/${req.file.filename}`;
    
    console.log('准备上传文件:', {
      localPath,
      remotePath,
      fileSize: req.file.size
    });

    await sftp.put(localPath, remotePath);
    console.log('SFTP 上传完成');
    
    await sftp.end();
    console.log('SFTP 连接已关闭');

    // 构建响应 URL
    const filename = req.file.filename;
    const imageUrl = `http://8.218.98.220:8080/uploads/${filename}`;

    // 返回响应
    return res.json({
      success: true,
      url: imageUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      console.error('详细错误信息:', {
        message: error.message,
        code: (error as any).code,  // code 可能不存在于 Error 类型
        stack: error.stack
      });
    }
    // 确保只发送一次错误响应
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '文件上传失败'
      });
    }
  }
});

// 添加删除图片的路由
router.post('/delete-image', deleteImage);

export default router;