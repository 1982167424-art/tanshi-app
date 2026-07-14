const db = require('../models/database');
const { safeUser } = require('./auth.service');
const { encryptPassword, verifyPassword, validatePassword } = require('../utils/crypto');

// 根据 uid 获取用户（不含密码）
const getUserByUid = (uid) => {
  const row = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  return safeUser(row);
};

// 更新用户：仅允许 avatar / is_teen_mode / username / birthday
const updateUser = (uid, updates) => {
  const existing = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  if (!existing) return null;

  const fields = [];
  const values = { uid };

  if (updates.username !== undefined) {
    const name = String(updates.username).trim();
    if (!name) {
      const err = new Error('用户名不能为空'); err.status = 400; throw err;
    }
    const dup = db.prepare('SELECT uid FROM users WHERE username = ? AND uid != ?').get(name, uid);
    if (dup) {
      const err = new Error('用户名已存在'); err.status = 400; throw err;
    }
    fields.push('username = @username');
    values.username = name;
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = @avatar');
    values.avatar = updates.avatar;
  }
  if (updates.isTeenMode !== undefined) {
    fields.push('is_teen_mode = @is_teen_mode');
    values.is_teen_mode = updates.isTeenMode ? 1 : 0;
  }
  if (updates.birthday !== undefined) {
    fields.push('birthday = @birthday');
    values.birthday = updates.birthday;
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE uid = @uid`).run(values);
  }

  return safeUser(db.prepare('SELECT * FROM users WHERE uid = ?').get(uid));
};

// 修改密码：验证旧密码后更新
const changePassword = (uid, oldPassword, newPassword) => {
  const row = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
  if (!row) return false;

  if (!verifyPassword(oldPassword, row.password)) {
    const err = new Error('原密码错误'); err.status = 400; throw err;
  }

  const check = validatePassword(newPassword);
  if (!check.valid) {
    const err = new Error(check.message); err.status = 400; throw err;
  }

  db.prepare('UPDATE users SET password = ? WHERE uid = ?').run(encryptPassword(newPassword), uid);
  return true;
};

// 删除用户：级联删除所有用户数据
const deleteUser = (uid) => {
  const existing = db.prepare('SELECT uid FROM users WHERE uid = ?').get(uid);
  if (!existing) return false;

  // 外键 ON DELETE CASCADE 会自动清理子表
  db.prepare('DELETE FROM users WHERE uid = ?').run(uid);
  return true;
};

module.exports = {
  getUserByUid,
  updateUser,
  changePassword,
  deleteUser,
};
