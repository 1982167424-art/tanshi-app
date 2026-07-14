// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('服务器错误:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || '服务器内部错误',
  });
};

module.exports = errorHandler;
