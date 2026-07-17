const authService = require('../services/auth.service');
const { sign } = require('../utils/jwt');
const { success, fail } = require('../utils/response');
const { verifyTurnstileToken } = require('../utils/turnstile');

const register = async (req, res, next) => {
  try {
    const { username, password, birthday, turnstileToken } = req.body;
    
    // 强制要求 Turnstile 验证
    if (!turnstileToken) {
      return fail(res, '请完成人机验证', 403);
    }
    
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.valid) {
      return fail(res, turnstileResult.message, 403);
    }

    const user = await authService.registerUser(username, password, birthday);
    const token = sign({ uid: user.uid, username: user.username });
    return success(res, { user, token }, '注册成功');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password, accessCode, turnstileToken } = req.body;
    
    // 强制要求 Turnstile 验证
    if (!turnstileToken) {
      return fail(res, '请完成人机验证', 403);
    }
    
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.valid) {
      return fail(res, turnstileResult.message, 403);
    }

    const user = await authService.loginUser(username, password, accessCode);
    const token = sign({ uid: user.uid, username: user.username });
    return success(res, { user, token }, '登录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
