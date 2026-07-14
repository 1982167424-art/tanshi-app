const jwt = require('jsonwebtoken');
const config = require('../config');

// 签发 token
const sign = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

// 校验 token，失败返回 null
const verify = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
};

module.exports = { sign, verify };
