// 统一错误处理中间件（不泄露内部信息 + 异常告警）
const errorHandler = (err, req, res, next) => {
  // 结构化日志
  console.error(JSON.stringify({
    level: 'ERROR',
    time: new Date().toISOString(),
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    ua: req.headers['user-agent'] || '',
  }));

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: '请求格式错误' });
  }

  // 业务错误（有 status 码且 < 500）
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // 服务器错误：返回通用消息，不泄露任何内部信息
  res.status(500).json({ success: false, message: '服务器内部错误' });
};

module.exports = errorHandler;
