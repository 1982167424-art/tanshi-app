require('dotenv').config();

const config = {
  // 服务端口
  port: parseInt(process.env.PORT, 10) || 3001,

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'tanshi_jwt_secret_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // AES 加密密钥
  aesSecret: process.env.AES_SECRET || 'tanshi_secure_key_2024!@#',

  // 管理后台密钥
  adminKey: process.env.ADMIN_KEY || 'tanshi_admin_2024',

  // 注册访问口令
  accessCode: process.env.ACCESS_CODE || 'tetiCmop02I81`E1!2#',

  // Turnstile 人机验证配置
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAD1vY6CN9r0-TJxjwxdUUsmsqUc',
    siteKey: process.env.TURNSTILE_SITE_KEY || '0x4AAAAAAD1vYyHUN3U7Rkdz',
  },

  // SQLite 数据库配置
  db: {
    path: process.env.DB_PATH || './data/tanshi.db',
  },

  // MiMo AI 服务配置
  mimo: {
    apiUrl: process.env.MIMO_API_URL || 'https://api.xiaomimimo.com/v1/chat/completions',
    apiKey: process.env.MIMO_API_KEY || '',
    model: process.env.MIMO_MODEL || 'mimo-v2.5',
  },
};

module.exports = config;
