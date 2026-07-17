/**
 * 综合安全中间件
 * 防护：空UA、缺失浏览器头、JSON嵌套过深、参数过多、慢速攻击
 */

// ============ 1. 请求头检查（拦截空UA和缺失浏览器头）============
const checkHeaders = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  // 拦截空 User-Agent
  if (!ua || ua.trim().length < 10) {
    return res.status(403).json({ success: false, message: '请求被拒绝' });
  }

  // 拦截已知恶意爬虫/扫描工具
  const blockedPatterns = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /acunetix/i, /nessus/i, /zgrab/i, /crawler/i];
  for (const pattern of blockedPatterns) {
    if (pattern.test(ua)) {
      return res.status(403).json({ success: false, message: '请求被拒绝' });
    }
  }

  // 放行带浏览器特征的请求（排除 Turnstile 脚本代理和健康检查）
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
  // 统计 query + body 顶层字段数
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
    // 跳过健康检查
    if (req.path === '/api/health') return next();

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: '请求超时' });
      }
    }, timeoutMs);

    // 请求结束后清除定时器
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

module.exports = {
  checkHeaders,
  jsonDepthLimit,
  paramCountLimit,
  requestTimeout,
  bodySizeLimit,
};
