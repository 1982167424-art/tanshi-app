// 请求日志中间件：记录请求方法、路径及耗时
function logger(req, res, next) {
  const start = Date.now();
  const { method, path: reqPath } = req;

  // 响应结束时输出日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📝 ${method} ${reqPath} ${res.statusCode} ${duration}ms`);
  });

  next();
}

module.exports = logger;
