const { verify } = require('../utils/jwt');
const { fail } = require('../utils/response');
const db = require('../models/database');

const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return fail(res, '未提供认证令牌', 401);

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const decoded = verify(token);
  if (!decoded) return fail(res, '认证令牌无效或已过期', 401);

  const user = db.prepare('SELECT uid FROM users WHERE uid = ?').get(decoded.uid);
  if (!user) return fail(res, '账号不存在或已被删除', 401);

  req.user = { uid: decoded.uid, username: decoded.username };
  next();
};

module.exports = { authRequired };
