// 导入所需的外部依赖包
import express, { NextFunction } from 'express';  // 导入express框架，用于创建Web服务器和路由
import multer from 'multer';    // 导入multer中间件，用于处理文件上传
import { uploadImage } from '../controllers/upload';  // 导入上传图片的控制器函数
import path from 'path';
import fs from 'fs';

// 在文件顶部添加确保上传目录存在的代码
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 的存储选项
const storage = multer.diskStorage({
  // 设置文件存储的目标路径
  destination: (req, file, cb) => {
    console.log('Multer destination:', uploadDir);  // 添加日志
    console.log('File info:', file);  // 添加文件信息日志
    cb(null, uploadDir);  // 使用定义的上传目录
  },
  // 设置保存的文件名
  filename: (req, file, cb) => {
    console.log('Processing file:', file.originalname);  // 添加日志
    
    // 生成 MMDD 格式的日期
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
  storage: storage,  // 使用上面定义的存储配置
  limits: {
    fileSize: 10 * 1024 * 1024  // 限制文件大小为10MB (10 * 1024 * 1024 字节)
  },
  // 文件过滤器，用于限制上传的文件类型
  fileFilter: (req, file, cb) => {
    console.log('Checking file type:', file.mimetype);  // 添加日志
    // 检查文件类型是否为图片
    if (!file.mimetype.startsWith('image/')) {
      console.log('File rejected: not an image');  // 添加日志
      // 如果不是图片类型，返回错误
      cb(new Error('只能上传图片文件'));
      return;
    }
    console.log('File accepted');  // 添加日志
    // 如果是图片类型，允许上传
    cb(null, true);
  }
});

// 创建 Express 路由实例
const router = express.Router();

// 定义 POST 路由 '/upload'
// upload.single('image') 是中间件，表示接受一个名为 'image' 的单个文件
// uploadImage 是处理上传的控制器函数
router.post('/upload', (req, res, next) => {
  console.log('=== Upload Request Start ===');
  
  // 使用回调方式处理 multer 错误
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || '文件上传失败'
      });
    }

    // 检查文件是否存在
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件'
      });
    }

    console.log('File received:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 检查文件权限
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
    } catch (error) {
      console.error('Upload directory not writable:', uploadDir);
      return res.status(500).json({
        success: false,
        error: '服务器配置错误'
      });
    }

    // 处理上传
    uploadImage(req, res).catch(error => {
      console.error('Upload Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || '文件上传失败'
      });
    });
  });
});

// 导出路由供其他文件使用
export default router;