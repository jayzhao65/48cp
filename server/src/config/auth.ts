// 文件作用：认证相关配置
// 输入：环境变量
// 输出：配置常量
// 与其他文件关系：
// - 被 controllers/auth.ts 使用
// - 提供管理员凭据和JWT配置

// 管理员登录凭据配置
// 优先使用环境变量，否则使用默认值
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

// JWT配置
export const JWT_CONFIG = {
// JWT签名密钥
secret: process.env.JWT_SECRET || 'fallback-secret-key',
// Token有效期：100天
expiresIn: '100d'
};