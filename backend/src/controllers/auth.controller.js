const authService = require('../services/auth.service');
const { sign } = require('../utils/jwt');
const { success, fail } = require('../utils/response');
const { verifyTurnstileToken } = require('../utils/turnstile');
const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const MAX_DEVICES = 5;

const getIp = (req) => {
  // 优先使用 Cloudflare 传递的真实 IP
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp;
  // 回退到 X-Forwarded-For 链中的第一个 IP
  const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return req.ip;
};

const register = async (req, res, next) => {
  try {
    const { username, password, birthday, turnstileToken } = req.body;
    // Turnstile 可选：有 token 则验证，验证失败降级放行（国内代理模式下 token 可能异常）
    if (turnstileToken) {
      const tr = await verifyTurnstileToken(turnstileToken);
      if (!tr.valid) console.warn(`[Turnstile] 注册验证降级放行: ${tr.message}`, tr.errors || '');
    }

    // 同一 IP 只能注册一个账号
    const ip = getIp(req);
    const existingIp = db.prepare('SELECT user_uid FROM registered_ips WHERE ip_address = ?').get(ip);
    if (existingIp) return fail(res, '该网络已注册过账号', 403);

    const user = await authService.registerUser(username, password, birthday);
    const token = sign({ uid: user.uid, username: user.username });

    // 记录注册 IP
    db.prepare('INSERT INTO registered_ips (ip_address, user_uid, created_at) VALUES (?, ?, ?)')
      .run(ip, user.uid, new Date().toISOString());

    return success(res, { user, token }, '注册成功');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { username, password, accessCode, turnstileToken } = req.body;
    // Turnstile 可选：有 token 则验证，验证失败降级放行（国内代理模式下 token 可能异常）
    if (turnstileToken) {
      const tr = await verifyTurnstileToken(turnstileToken);
      if (!tr.valid) console.warn(`[Turnstile] 登录验证降级放行: ${tr.message}`, tr.errors || '');
    }

    const user = await authService.loginUser(username, password, accessCode);
    const ip = getIp(req);
    const deviceInfo = req.headers['user-agent'] || 'unknown';

    // 检查设备数量限制
    const deviceCount = db.prepare('SELECT COUNT(*) as cnt FROM login_sessions WHERE user_uid = ?').get(user.uid).cnt;
    if (deviceCount >= MAX_DEVICES) {
      // 删除最早的登录记录
      const oldest = db.prepare('SELECT id FROM login_sessions WHERE user_uid = ? ORDER BY login_at ASC LIMIT 1').get(user.uid);
      if (oldest) db.prepare('DELETE FROM login_sessions WHERE id = ?').run(oldest.id);
    }

    // 记录登录设备
    db.prepare('INSERT INTO login_sessions (id, user_uid, device_info, ip_address, login_at) VALUES (?, ?, ?, ?, ?)')
      .run(generateId(), user.uid, deviceInfo, ip, new Date().toISOString());

    const token = sign({ uid: user.uid, username: user.username });
    return success(res, { user, token }, '登录成功');
  } catch (err) { next(err); }
};

module.exports = { register, login };
