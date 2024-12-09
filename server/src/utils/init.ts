import fs from 'fs';
import path from 'path';

export const initializeDirectories = () => {
  const reportsDir = path.join(__dirname, '../../public/reports');
  
  // 确保 reports 目录存在
  if (!fs.existsSync(reportsDir)) {
    console.log('Creating reports directory:', reportsDir);
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 添加 .gitkeep 文件以保持目录在 git 中
  const gitkeepPath = path.join(reportsDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }

  console.log('Directories initialized successfully');
}; 