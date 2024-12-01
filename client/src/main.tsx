// 文件作用：前端应用的入口文件
// 主要功能：
// 1. 初始化React应用
// 2. 将应用挂载到DOM
// 与其他文件关系：
// - 导入并渲染App组件
// - 导入全局样式

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // 导入全局样式
import App from './App'  // 导入根组件

// 添加一些移动端适配的 meta 标签
const meta = document.createElement('meta')
meta.name = 'viewport'
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
document.head.appendChild(meta)

// 创建根元素并渲染应用
// StrictMode用于突出显示应用程序中潜在问题
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
