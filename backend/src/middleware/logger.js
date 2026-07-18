// 结构化日志中间件
const getIp = (req) => {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
};

function logger(req, res, next) {
  const start = Date.now();
  const { method, path: reqPath } = req;
  const ip = getIp(req);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    const userUid = req.user?.uid || '-';
    const log = JSON.stringify({
      level,
      time: new Date().toISOString(),
      method,
      path: reqPath,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      user: userUid,
    });
    if (level === 'ERROR') console.error(log);
    else if (level === 'WARN') console.warn(log);
    else console.log(log);
  });

  next();
}

module.exports = logger;
