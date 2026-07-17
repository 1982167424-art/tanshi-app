const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 10;

// 加密密码（bcrypt 单向哈希）
const encryptPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// 验证密码
const verifyPassword = async (inputPassword, storedPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};

// 校验密码格式：至少8位，包含字母、数字、符号
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: '密码至少需要8位' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password);
  if (!hasLetter || !hasNumber || !hasSymbol) {
    return { valid: false, message: '密码需要包含字母、数字和符号' };
  }
  return { valid: true, message: '' };
};

// 生成用户 UID
const generateUid = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TS${timestamp}${random}`.toUpperCase();
};

// 生成普通记录 ID
const generateId = () => {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
};

// 生成用户专属访问口令：ttimeex-{32位含字母数字符号}
const ACCESS_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?';
const generateAccessCode = () => {
  let suffix = '';
  for (let i = 0; i < 32; i++) {
    suffix += ACCESS_CODE_CHARS[Math.floor(Math.random() * ACCESS_CODE_CHARS.length)];
  }
  return `ttimeex-${suffix}`;
};

module.exports = {
  encryptPassword,
  verifyPassword,
  validatePassword,
  generateUid,
  generateId,
  generateAccessCode,
};
