const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const SPUG_API_URL = 'https://push.spug.cc/send/4NbKBjza7GmpxWeP';
const CODE_EXPIRE_MS = 5 * 60 * 1000; // 5分钟过期
const CODE_LENGTH = 6;

// 生成6位随机验证码
const generateCode = () => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
};

// 发送短信验证码
const sendSmsCode = async (phone) => {
  // 验证手机号格式（中国大陆）
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确');
  }

  // 检查频率限制：同一手机号1分钟内只能发1次
  const recent = db.prepare(
    "SELECT created_at FROM verify_codes WHERE target = ? AND type = 'register' ORDER BY created_at DESC LIMIT 1"
  ).get(phone);
  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime();
    if (elapsed < 60000) {
      const waitSec = Math.ceil((60000 - elapsed) / 1000);
      throw new Error(`发送过于频繁，请${waitSec}秒后再试`);
    }
  }

  // 生成验证码
  const code = generateCode();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CODE_EXPIRE_MS).toISOString();

  // 存入数据库
  const id = generateId();
  db.prepare(
    "INSERT INTO verify_codes (id, target, code, type, expires_at, created_at) VALUES (?, ?, ?, 'register', ?, ?)"
  ).run(id, phone, code, expiresAt, now);

  // 调用 Spug API 发送短信
  try {
    const sendUrl = `${SPUG_API_URL}?code=${encodeURIComponent(code)}&targets=${encodeURIComponent(phone)}`;
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();

    if (result.code !== 200) {
      console.warn(`[SmsCode] Spug API 响应:`, result);
    }

    return { success: true, message: '验证码已发送' };
  } catch (error) {
    console.error('[SmsCode] 发送短信失败:', error.message);
    throw new Error('短信发送失败，请稍后重试');
  }
};

// 验证短信验证码
const verifySmsCode = (phone, code) => {
  if (!phone || !code) throw new Error('手机号和验证码不能为空');

  const record = db.prepare(
    "SELECT * FROM verify_codes WHERE target = ? AND code = ? AND type = 'register' AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).get(phone, code);

  if (!record) {
    // 检查是否有过期的验证码
    const expired = db.prepare(
      "SELECT * FROM verify_codes WHERE target = ? AND code = ? AND type = 'register' AND used = 0 ORDER BY created_at DESC LIMIT 1"
    ).get(phone, code);

    if (expired && new Date(expired.expires_at) < new Date()) {
      throw new Error('验证码已过期，请重新获取');
    }
    throw new Error('验证码不正确');
  }

  // 标记为已使用
  db.prepare("UPDATE verify_codes SET used = 1 WHERE id = ?").run(record.id);

  return { valid: true };
};

// 清理过期验证码
const cleanExpired = () => {
  db.prepare("DELETE FROM verify_codes WHERE expires_at <= datetime('now')").run();
};

module.exports = { sendSmsCode, verifySmsCode, cleanExpired };
