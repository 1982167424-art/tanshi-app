// 统一错误处理中间件（不泄露内部信息）
const errorHandler = (err, req, res, next) => {
  console.error('服务器错误:', err.message);

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: '请求格式错误' });
  }

  // CORS 错误
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: '不允许的跨域请求' });
  }

  // 其他错误：只返回通用消息，不泄露内部信息
  const status = err.status || 500;
  const message = status === 500 ? '服务器内部错误' : (err.message || '请求失败');
  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
