export const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  };

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  expiresIn: '100d'  // Token 过期时间
};