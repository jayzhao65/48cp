import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import Client from 'ssh2-sftp-client';

const BASE_URL = 'http://beyondcrush.love:8080';

// SFTP 配置
const sftpConfig = {
  host: process.env.SFTP_HOST,
  port: Number(process.env.SFTP_PORT) || 22,
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_PASSWORD
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log('====== 图片上传请求开始 ======');
    console.log('BASE_URL:', BASE_URL);
    
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

    // 使用 SFTP 上传到生产服务器
    const sftp = new Client();
    await sftp.connect(sftpConfig);
    
    const localPath = file.path;
    const remotePath = `/var/www/48cp/server/uploads/${file.filename}`;
    
    console.log('开始SFTP上传:', { localPath, remotePath });
    await sftp.put(localPath, remotePath);
    await sftp.end();
    
    // 删除临时文件
    fs.unlinkSync(localPath);

    const imageUrl = `${BASE_URL}/uploads/${file.filename}`;
    console.log('构建的图片URL:', imageUrl);
    
    const response = { success: true, url: imageUrl };
    console.log('返回的响应:', response);
    
    return res.json(response);

  } catch (error) {
    console.error('====== 图片上传失败 ======');
    console.error('错误详情:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      });
    }
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const imageUrl = req.body.url;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: '未提供图片URL'
      });
    }

    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: '无效的图片URL'
      });
    }

    // 使用 SFTP 删除远程文件
    const sftp = new Client();
    await sftp.connect(sftpConfig);
    
    const remotePath = `/var/www/48cp/server/uploads/${filename}`;
    
    // 检查文件是否存在
    const exists = await sftp.exists(remotePath);
    if (exists) {
      await sftp.delete(remotePath);
      console.log(`已删除远程文件: ${remotePath}`);
    } else {
      console.log(`远程文件不存在: ${remotePath}`);
    }
    
    await sftp.end();

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