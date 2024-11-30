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
import { uploadImage } from '../controllers/upload';
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
router.post('/upload', (req, res, next) => {
  console.log('=============== 上传请求开始 ===============');
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer 错误:', err);
      return res.status(400).json({
        success: false,
        error: '文件上传失败，请确保：\n1. 使用 image 作为字段名\n2. 文件大小不超过限制\n3. 文件类型为图片'
      });
    }

    // 调用上传控制器处理请求
    uploadImage(req, res).catch(error => {
      console.error('Upload Error:', error);
      // 确保之前没有发送过响应
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || '文件上传失败'
        });
      }
    });
  });
});

export default router;