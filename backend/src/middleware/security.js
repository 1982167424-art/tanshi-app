/**
 * 综合安全中间件 - DDoS 加固版
 * 防护：空UA、缺失浏览器头、JSON嵌套过深、参数过多、慢速攻击、请求体过大、IP黑名单
 */

// ============ 1. 请求头检查（拦截空UA和缺失浏览器头）============
const checkHeaders = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  // 拦截空 User-Agent
  if (!ua || ua.trim().length < 10) {
    return res.status(403).json({ success: false, message: '请求被拒绝' });
  }

  // 拦截已知恶意爬虫/扫描工具
  const blockedPatterns = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /acunetix/i, /nessus/i, /zgrab/i, /crawler/i, /bot/i, /spider/i];
  for (const pattern of blockedPatterns) {
    if (pattern.test(ua)) {
      return res.status(403).json({ success: false, message: '请求被拒绝' });
    }
  }

  // 放行带浏览器特征的请求（排除健康检查和 Turnstile）
  if (req.path === '/api/health' || req.path === '/api/turnstile/script') {
    return next();
  }

  // 检查 Accept 头（浏览器会发送）
  const accept = req.headers['accept'] || '';
  if (!accept) {
    return res.status(403).json({ success: false, message: '请求被拒绝' });
  }

  next();
};

// ============ 2. JSON 嵌套深度限制 ============
const MAX_DEPTH = 10;

const checkJsonDepth = (obj, depth = 0) => {
  if (depth > MAX_DEPTH) return false;
  if (typeof obj !== 'object' || obj === null) return true;
  for (const key of Object.keys(obj)) {
    if (!checkJsonDepth(obj[key], depth + 1)) return false;
  }
  return true;
};

const jsonDepthLimit = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    if (!checkJsonDepth(req.body)) {
      return res.status(400).json({ success: false, message: '请求数据嵌套过深' });
    }
  }
  next();
};

// ============ 3. 请求参数数量限制 ============
const MAX_PARAMS = 50;

const paramCountLimit = (req, res, next) => {
  const queryCount = req.query ? Object.keys(req.query).length : 0;
  const bodyCount = req.body && typeof req.body === 'object' ? Object.keys(req.body).length : 0;
  const totalCount = queryCount + bodyCount;

  if (totalCount > MAX_PARAMS) {
    return res.status(400).json({ success: false, message: '请求参数过多' });
  }
  next();
};

// ============ 4. 慢速攻击防护（请求超时）============
const requestTimeout = (timeoutMs = 10000) => {
  return (req, res, next) => {
    if (req.path === '/api/health') return next();

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: '请求超时' });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};

// ============ 5. 请求体大小二次校验 ============
const bodySizeLimit = (maxBytes = 102400) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({ success: false, message: '请求体过大' });
    }
    next();
  };
};

// ============ 6. IP 黑名单（DDoS 攻击者自动封禁）============
const ipBlacklist = new Set();
const ipRequestCounts = new Map();

const checkIpAbuse = (req, res, next) => {
  // 跳过健康检查和 Turnstile
  if (req.path === '/api/health' || req.path.startsWith('/api/turnstile')) {
    return next();
  }

  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60000; // 1分钟窗口
  const maxRequests = 60; // 1分钟最多60次

  // 检查 IP 是否在黑名单中
  if (ipBlacklist.has(ip)) {
    return res.status(429).json({ success: false, message: 'IP已被临时封禁' });
  }

  // 记录请求
  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, []);
  }
  const timestamps = ipRequestCounts.get(ip);
  timestamps.push(now);

  // 清理过期记录
  while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
    timestamps.shift();
  }

  // 检查是否超过阈值
  if (timestamps.length > maxRequests) {
    ipBlacklist.add(ip);
    // 10分钟后自动解封
    setTimeout(() => ipBlacklist.delete(ip), 600000);
    return res.status(429).json({ success: false, message: '请求过于频繁，IP已被临时封禁' });
  }

  next();
};

// 定期清理过期记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestCounts) {
    while (timestamps.length > 0 && timestamps[0] < now - 60000) {
      timestamps.shift();
    }
    if (timestamps.length === 0) ipRequestCounts.delete(ip);
  }
}, 60000);

module.exports = {
  checkHeaders,
  jsonDepthLimit,
  paramCountLimit,
  requestTimeout,
  bodySizeLimit,
  checkIpAbuse,
};
