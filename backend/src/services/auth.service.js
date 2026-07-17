const db = require('../models/database');
const { encryptPassword, verifyPassword, validatePassword, generateUid, generateAccessCode } = require('../utils/crypto');

// 抛出带状态码的业务错误
const throwError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

// 计算年龄
const calculateAge = (birthday) => {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 移除密码字段并转换字段命名 snake_case -> camelCase
const safeUser = (row) => {
  if (!row) return null;
  return {
    uid: row.uid,
    username: row.username,
    birthday: row.birthday,
    isTeenMode: !!row.is_teen_mode,
    avatar: row.avatar,
    createdAt: row.created_at,
    accessCode: row.access_code || '',
  };
};

// 注册用户：自动生成专属访问口令，返回用户信息（含口令）
const registerUser = async (username, password, birthday) => {
  const name = (username || '').trim();
  if (!name) throwError('用户名不能为空');
  if (!birthday) throwError('请选择出生日期');

  const check = validatePassword(password);
  if (!check.valid) throwError(check.message);

  const exists = db.prepare('SELECT uid FROM users WHERE username = ?').get(name);
  if (exists) throwError('用户名已存在');

  // 生成唯一的访问口令（确保不重复）
  let accessCode;
  let attempts = 0;
  do {
    accessCode = generateAccessCode();
    attempts++;
    if (attempts > 10) break;
  } while (db.prepare('SELECT uid FROM users WHERE access_code = ?').get(accessCode));

  const isTeenMode = calculateAge(birthday) < 14 ? 1 : 0;
  const hashedPassword = await encryptPassword(password);

  const user = {
    uid: generateUid(),
    username: name,
    password: hashedPassword,
    birthday,
    is_teen_mode: isTeenMode,
    avatar: '',
    created_at: new Date().toISOString(),
    access_code: accessCode,
  };

  db.prepare(`INSERT INTO users (uid, username, password, birthday, is_teen_mode, avatar, created_at, access_code)
    VALUES (@uid, @username, @password, @birthday, @is_teen_mode, @avatar, @created_at, @access_code)`).run(user);

  return safeUser(user);
};

// 登录用户：若传了 accessCode 则校验是否匹配
const loginUser = async (username, password, accessCode) => {
  if (!username || !password) throwError('用户名和密码不能为空');

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!row) throwError('用户不存在');

  const isValid = await verifyPassword(password, row.password);
  if (!isValid) throwError('密码错误');

  if (accessCode && accessCode !== row.access_code) {
    throwError('访问口令错误');
  }

  return safeUser(row);
};

module.exports = {
  registerUser,
  loginUser,
  safeUser,
};
