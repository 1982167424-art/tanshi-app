const authService = require('../services/auth.service');
const { sign } = require('../utils/jwt');
const { success, fail } = require('../utils/response');
const { verifyTurnstileToken } = require('../utils/turnstile');

const register = async (req, res, next) => {
  try {
    const { username, password, birthday, turnstileToken } = req.body;
    
    if (turnstileToken) {
      const turnstileResult = await verifyTurnstileToken(turnstileToken);
      if (!turnstileResult.valid) {
        return fail(res, turnstileResult.message, 403);
      }
    }

    const user = authService.registerUser(username, password, birthday);
    const token = sign({ uid: user.uid, username: user.username });
    return success(res, { user, token }, '注册成功');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password, accessCode, turnstileToken } = req.body;
    
    if (turnstileToken) {
      const turnstileResult = await verifyTurnstileToken(turnstileToken);
      if (!turnstileResult.valid) {
        return fail(res, turnstileResult.message, 403);
      }
    }

    const user = authService.loginUser(username, password, accessCode);
    const token = sign({ uid: user.uid, username: user.username });
    return success(res, { user, token }, '登录成功');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
