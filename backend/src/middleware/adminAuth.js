const config = require('../config');
const { fail } = require('../utils/response');

// 管理后台认证中间件：通过 Admin-Key 请求头验证
const adminRequired = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== config.adminKey) {
    return fail(res, '管理密钥无效', 403);
  }
  next();
};

module.exports = { adminRequired };
