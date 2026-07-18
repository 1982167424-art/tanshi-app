const config = require('../config');

const verifyTurnstileToken = async (token) => {
  if (!token) {
    return { valid: false, message: '缺少人机验证' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: config.turnstile.secretKey, response: token }),
    });

    const data = await response.json();
    if (!data.success) {
      return { valid: false, message: '人机验证失败', errors: data.error_codes };
    }
    return { valid: true, message: '验证通过' };
  } catch (error) {
    return { valid: false, message: '验证服务异常' };
  }
};

module.exports = {
  verifyTurnstileToken,
};
