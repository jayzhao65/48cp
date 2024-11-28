// 从 express 包中导入 Request 和 Response 类型，用于类型声明
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// 导出一个名为 uploadImage 的异步函数，用于处理图片上传
// req: 包含请求信息的对象（如文件、请求头等）
// res: 用于发送响应给客户端的对象
export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('=== Processing Upload ===');
    
    const file = req.file;
    if (!file) {
      throw new Error('No file received');
    }

    // 构建文件路径
    const filePath = path.join(__dirname, '../../uploads', file.filename);
    console.log('File path:', filePath);

    // 检查文件是否成功保存
    if (!fs.existsSync(filePath)) {
      throw new Error('File not saved correctly');
    }

    // 生成访问URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    console.log('Generated URL:', imageUrl);

    res.json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    throw error;
  }
};