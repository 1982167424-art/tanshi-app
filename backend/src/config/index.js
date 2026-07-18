require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  adminKey: process.env.ADMIN_KEY,
  accessCode: process.env.ACCESS_CODE,

  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.TURNSTILE_SITE_KEY,
  },

  db: {
    path: process.env.DB_PATH || './data/tanshi.db',
  },

  ai: {
    apiUrl: 'https://text.pollinations.ai/openai',
    model: 'openai',
  },
};

// 启动时校验必要环境变量
if (!config.jwt.secret) { console.error('❌ 缺少环境变量: JWT_SECRET'); process.exit(1); }
if (!config.adminKey) { console.error('❌ 缺少环境变量: ADMIN_KEY'); process.exit(1); }
if (!config.accessCode) { console.error('❌ 缺少环境变量: ACCESS_CODE'); process.exit(1); }
if (!config.turnstile.secretKey) { console.error('❌ 缺少环境变量: TURNSTILE_SECRET_KEY'); process.exit(1); }
if (!config.turnstile.siteKey) { console.error('❌ 缺少环境变量: TURNSTILE_SITE_KEY'); process.exit(1); }

module.exports = config;
