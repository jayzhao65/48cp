// 导入所需的外部依赖包
import express, { NextFunction } from 'express';  // 导入express框架，用于创建Web服务器和路由
import multer from 'multer';    // 导入multer中间件，用于处理文件上传
import { uploadImage } from '../controllers/upload';  // 导入上传图片的控制器函数

// 配置 multer 的存储选项
const storage = multer.diskStorage({
  // 设置文件存储的目标路径
  destination: (req, file, cb) => {
    // cb 是回调函数，第一个参数是错误（null表示没有错误），第二个参数是目标路径
    cb(null, 'uploads/');  // 将上传的文件保存到 uploads 文件夹中
  },
  // 设置保存的文件名
  filename: (req, file, cb) => {
    
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
    cb(null, `${dateStr}-${randomSuffix}.${fileExt}`);
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
    // 检查文件类型是否为图片
    if (!file.mimetype.startsWith('image/')) {
      // 如果不是图片类型，返回错误
      cb(new Error('只能上传图片文件'));
      return;
    }
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
  try {
    console.log('收到上传请求:', req.file);
    await uploadImage(req, res);
  } catch (error) {
    console.error('上传错误:', error);
    next(error);
  }
});

// 导出路由供其他文件使用
export default router;