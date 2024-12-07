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


// 配置 multer 存储选项
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
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

    // 构建响应 URL
    const filename = req.file.filename;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'http://8.218.98.220'
      : 'http://localhost:3001';
    const imageUrl = `${baseUrl}/uploads/${filename}`;

    // 返回响应
    return res.json({
      success: true,
      url: imageUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
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