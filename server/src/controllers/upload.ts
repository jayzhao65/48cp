// 从 express 包中导入 Request 和 Response 类型，用于类型声明
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://8.218.98.220'
  : 'http://localhost:3001';
console.log('Selected BASE_URL:', BASE_URL);

// 导出一个名为 uploadImage 的异步函数，用于处理图片上传
// req: 包含请求信息的对象（如文件、请求头等）
// res: 用于发送响应给客户端的对象
export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('====== 图片上传请求开始 ======');
    
    // 如果响应已经发送，直接返回
    if (res.headersSent) {
      console.log('响应已经发送，跳过处理');
      return;
    }

    const file = req.file;
    console.log('接收到的文件信息:', file);

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

    const imageUrl = `${BASE_URL}/uploads/${file.filename}`;
    console.log('生成的访问URL:', imageUrl);
    console.log('====== 图片上传成功 ======');

    // 使用 return 确保函数在此处结束
    return res.json({
      success: true,
      url: imageUrl
    });

  } catch (error) {
    console.error('====== 图片上传失败 ======');
    console.error('错误详情:', error);
    
    // 如果响应已经发送，不再尝试发送错误响应
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      });
    }
  }
};

// 添加删除图片的控制器
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const imageUrl = req.body.url;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: '未提供图片URL'
      });
    }

    // 从URL中提取文件名
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: '无效的图片URL'
      });
    }

    const filePath = path.join(__dirname, '../../uploads', filename);

    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 删除文件
      fs.unlinkSync(filePath);
      console.log(`已删除文件: ${filePath}`);
    } else {
      console.log(`文件不存在: ${filePath}`);
    }

    res.json({
      success: true,
      message: '图片已删除'
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除失败'
    });
  }
};