// 从 express 包中导入 Request 和 Response 类型，用于类型声明
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// 导出一个名为 uploadImage 的异步函数，用于处理图片上传
// req: 包含请求信息的对象（如文件、请求头等）
// res: 用于发送响应给客户端的对象
export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('====== 图片上传请求开始 ======');
    console.log('请求头:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    }, null, 2));
    
    const file = req.file;
    console.log('接收到的文件信息:', file ? {
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    } : 'No file');

    if (!file) {
      console.log('错误：未接收到文件');
      return res.status(400).json({
        success: false,
        error: 'No file received'
      });
    }

    // 构建文件路径
    const filePath = path.join(__dirname, '../../uploads', file.filename);
    console.log('文件保存路径:', filePath);

    // 检查文件是否成功保存
    if (!fs.existsSync(filePath)) {
      console.log('错误：文件未正确保存');
      return res.status(500).json({
        success: false,
        error: 'File not saved correctly'
      });
    }

    // 生成访问URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    console.log('生成的访问URL:', imageUrl);
    console.log('====== 图片上传成功 ======');

    res.json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    console.error('====== 图片上传失败 ======');
    console.error('错误详情:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    });
  }
};