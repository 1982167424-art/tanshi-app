/**
 * API 安全中间件集合
 * 包含：Origin校验、API Key、用户ID防枚举、JWT安全、异常告警
 */

const config = require('../config');
const crypto = require('crypto');

// ============ 1. Origin 校验（请求来源验证）============
const originVerification = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const allowedPatterns = [
    'textime.top',
    'exteenfit.vercel.app',
    'localhost',
  ];

  // 健康检查和 Turnstile 代理允许所有来源
  if (req.path === '/api/health' || req.path.startsWith('/api/turnstile')) {
    return next();
  }

  // 无 Origin 的请求（直接 curl/Postman）需要 API Key
  if (!origin) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && verifyApiKey(apiKey)) {
      return next();
    }
    return res.status(403).json({ success: false, message: '请求来源无效' });
  }

  // 有 Origin 的请求检查白名单
  const isAllowed = allowedPatterns.some(p => origin.includes(p));
  if (!isAllowed) {
    console.warn(JSON.stringify({
      level: 'WARN', time: new Date().toISOString(),
      event: 'BLOCKED_ORIGIN', origin, path: req.path, ip: req.ip,
    }));
    return res.status(403).json({ success: false, message: '不允许的请求来源' });
  }

  next();
};

// ============ 2. API Key 机制（用于外部调用）============
const API_KEY_HASH = crypto.createHash('sha256')
  .update(config.adminKey || 'tanshi_admin_2024')
  .digest('hex');

const verifyApiKey = (key) => {
  if (!key) return false;
  const hashed = crypto.createHash('sha256').update(key).digest('hex');
  return hashed === API_KEY_HASH;
};

// ============ 6. 用户 ID 防枚举 ============
const uidPattern = /^TS[A-Z0-9]{8,12}$/;
const preventUidEnumeration = (req, res, next) => {
  const uid = req.params.uid;
  if (uid && !uidPattern.test(uid)) {
    return res.status(400).json({ success: false, message: '用户ID格式无效' });
  }
  next();
};

// ============ 10. 异常告警（Webhook）============
let alertCooldown = {};
const sendAlert = (type, details) => {
  const now = Date.now();
  if (alertCooldown[type] && now - alertCooldown[type] < 60000) return;
  alertCooldown[type] = now;

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = JSON.stringify({
    text: `[探时安全告警] ${type}`,
    details: {
      time: new Date().toISOString(),
      ...details,
    },
  });

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(() => {});
};

// ============ 11. 应急响应：异常请求计数器 ============
const requestCounts = new Map();
const checkAbnormalTraffic = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip);
  timestamps.push(now);

  // 清理过期记录
  while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
    timestamps.shift();
  }

  // 检测异常流量（1分钟内超过100次请求）
  if (timestamps.length > 100) {
    sendAlert('ABNORMAL_TRAFFIC', { ip, count: timestamps.length, path: req.path });
    return res.status(429).json({ success: false, message: '请求异常频繁，已被临时限制' });
  }

  next();
};

// 定期清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestCounts) {
    while (timestamps.length > 0 && timestamps[0] < now - 60000) {
      timestamps.shift();
    }
    if (timestamps.length === 0) requestCounts.delete(ip);
  }
}, 60000);

module.exports = {
  originVerification,
  verifyApiKey,
  preventUidEnumeration,
  sendAlert,
  checkAbnormalTraffic,
};
