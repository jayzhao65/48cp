// 从 express 包中导入 Request 和 Response 类型，用于类型声明
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// 导出一个名为 uploadImage 的异步函数，用于处理图片上传
// req: 包含请求信息的对象（如文件、请求头等）
// res: 用于发送响应给客户端的对象
export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('Starting upload process');  // 添加日志
    console.log('Request headers:', req.headers);  // 添加请求头日志
    
    // 检查是否有文件被上传
    // req.file 是由 multer 中间件添加的，包含上传文件的信息
    if (!req.file) {
      console.log('No file in request');  // 添加日志
      return res.status(400).json({
        success: false,
        error: '请选择要上传的图片'
      });
    }

    // 添加文件存在性检查
    const filePath = path.join('uploads', req.file.filename);
    console.log('Checking file path:', filePath);  // 添加日志
    
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist at path:', filePath);  // 添加日志
      throw new Error('文件保存失败');
    }

    // 构建图片的完整访问URL
    // req.protocol: 获取协议（http 或 https）
    // req.get('host'): 获取主机名和端口
    // req.file.filename: 获取保存在服务器上的文件名
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log('Generated URL:', imageUrl);  // 添加日志

    // 上传成功，返回 200 状态码和图片URL
    res.status(200).json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    console.error('Upload error details:', {  // 添加详细错误日志
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      file: req.file,
      body: req.body
    });
    
    // 返回 500 状态码和错误信息给客户端
    res.status(500).json({
      success: false,
      error: '图片上传失败，请重试',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};