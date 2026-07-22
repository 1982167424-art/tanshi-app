const db = require('../models/database');
const { generateUid, generateAccessCode } = require('../utils/crypto');

// 查找或创建 OAuth 用户
const findOrCreateOAuthUser = (provider, providerId, email, name) => {
  // 1. 已绑定该平台的用户 → 直接登录
  const existing = db.prepare('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?').get(provider, providerId);
  if (existing) return existing;

  // 2. email 匹配已有用户 → 绑定到该用户
  if (email) {
    const byEmail = db.prepare('SELECT * FROM users WHERE oauth_email = ? OR username = ?').get(email, email);
    if (byEmail) {
      db.prepare('UPDATE users SET oauth_provider = ?, oauth_id = ?, oauth_email = ? WHERE uid = ?')
        .run(provider, providerId, email, byEmail.uid);
      return { ...byEmail, oauth_provider: provider, oauth_id: providerId, oauth_email: email };
    }
  }

  // 3. 新用户 → 自动注册
  let username = `${provider}_${providerId.slice(0, 8)}`;
  // 确保用户名唯一
  let suffix = 0;
  while (db.prepare('SELECT uid FROM users WHERE username = ?').get(username)) {
    suffix++;
    username = `${provider}_${providerId.slice(0, 8)}_${suffix}`;
  }

  let accessCode;
  let attempts = 0;
  do {
    accessCode = generateAccessCode();
    attempts++;
    if (attempts > 10) break;
  } while (db.prepare('SELECT uid FROM users WHERE access_code = ?').get(accessCode));

  const user = {
    uid: generateUid(),
    username,
    password: '',
    birthday: '',
    is_teen_mode: 0,
    avatar: '',
    created_at: new Date().toISOString(),
    access_code: accessCode,
    oauth_provider: provider,
    oauth_id: providerId,
    oauth_email: email || '',
  };

  db.prepare(`INSERT INTO users (uid, username, password, birthday, is_teen_mode, avatar, created_at, access_code, oauth_provider, oauth_id, oauth_email)
    VALUES (@uid, @username, @password, @birthday, @is_teen_mode, @avatar, @created_at, @access_code, @oauth_provider, @oauth_id, @oauth_email)`).run(user);

  return user;
};

module.exports = { findOrCreateOAuthUser };
