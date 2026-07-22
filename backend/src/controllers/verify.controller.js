const verifyService = require('../services/verify.service');
const { success, fail } = require('../utils/response');

// 发送短信验证码
const sendCode = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return fail(res, '请输入手机号');
    const result = await verifyService.sendSmsCode(phone);
    return success(res, null, result.message);
  } catch (err) {
    if (err.message.includes('手机号') || err.message.includes('频繁') || err.message.includes('发送失败')) {
      return fail(res, err.message);
    }
    next(err);
  }
};

// 验证短信验证码
const verifyCode = (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return fail(res, '请输入手机号和验证码');
    const result = verifyService.verifySmsCode(phone, code);
    return success(res, result, '验证通过');
  } catch (err) {
    if (err.message.includes('验证码') || err.message.includes('过期') || err.message.includes('不正确')) {
      return fail(res, err.message);
    }
    next(err);
  }
};

module.exports = { sendCode, verifyCode };
