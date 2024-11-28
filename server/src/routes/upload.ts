// 导入所需的外部依赖包
import express, { NextFunction } from 'express';  // 导入express框架，用于创建Web服务器和路由
import multer from 'multer';    // 导入multer中间件，用于处理文件上传
import { uploadImage } from '../controllers/upload';  // 导入上传图片的控制器函数

// 配置 multer 的存储选项
const storage = multer.diskStorage({
  // 设置文件存储的目标路径
  destination: (req, file, cb) => {
    console.log('Multer destination:', 'uploads/');  // 添加日志
    console.log('File info:', file);  // 添加文件信息日志
    cb(null, 'uploads/');  // 将上传的文件保存到 uploads 文件夹中
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
router.post('/upload', upload.single('image'), async (req, res, next) => {
  console.log('Upload request received');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('Files:', req.files); // 检查是否有多个文件
  
  try {
    await uploadImage(req, res);
  } catch (error) {
    console.error('Upload error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    next(error);
  }
});

// 导出路由供其他文件使用
export default router;