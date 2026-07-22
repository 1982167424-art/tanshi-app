const crypto = require('crypto');

// 阿里云验证码 2.0 (SmartCaptcha) 服务端验证
// 文档: https://help.aliyun.com/zh/captcha/developer-reference/api-captcha-2023-03-03-captchaverify

const ALIYUN_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  sceneId: process.env.ALIYUN_CAPTCHA_SCENE_ID || '',
};

// 签名
function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function hmacSha256(key, data) { return crypto.createHmac('sha256', key).update(data).digest(); }

function signRequest(method, path, query, headers, body, accessKeyId, accessKeySecret) {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k.toLowerCase()}:${headers[k].trim()}`).join('\n') + '\n';
  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');
  const hashedPayload = sha256(body || '');

  const canonicalRequest = `${method}\n${path}\n${query || ''}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const algorithm = 'ACS3-HMAC-SHA256';
  const credentialScope = `${dateStamp}/captcha/acs3_request`;
  const stringToSign = `${algorithm}\n${sha256(canonicalRequest)}`;

  const dateKey = hmacSha256(`ACS3${accessKeySecret}`, dateStamp);
  const regionKey = hmacSha256(dateKey, 'cn-hangzhou');
  const serviceKey = hmacSha256(regionKey, 'captcha');
  const signingKey = hmacSha256(serviceKey, 'acs3_request');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return {
    authorization: `${algorithm} Credential=${accessKeyId}/${credentialScope},SignedHeaders=${signedHeaders},Signature=${signature}`,
    date: amzDate,
  };
}

const verifyCaptcha = async (token, userIp) => {
  if (!token) return { valid: false, message: '缺少验证码票据' };

  if (!ALIYUN_CONFIG.accessKeyId || !ALIYUN_CONFIG.accessKeySecret) {
    console.warn('[AliCaptcha] 未配置阿里云 AccessKey，降级放行');
    return { valid: true, message: '验证服务未配置，已放行' };
  }

  try {
    const body = JSON.stringify({
      CaptchaVerifyParam: token,
      SceneId: ALIYUN_CONFIG.sceneId,
      UserIp: userIp || '',
      Lang: 'zh',
    });

    const query = 'Action=CaptchaVerify&Version=2023-03-03';
    const headers = {
      'host': 'captcha.cn-hangzhou.aliyuncs.com',
      'x-acs-action': 'CaptchaVerify',
      'x-acs-version': '2023-03-03',
      'x-acs-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
      'content-type': 'application/json',
    };

    const { authorization } = signRequest(
      'POST', '/', query, headers, body,
      ALIYUN_CONFIG.accessKeyId, ALIYUN_CONFIG.accessKeySecret
    );

    headers['authorization'] = authorization;

    const res = await fetch(`https://captcha.cn-hangzhou.aliyuncs.com/?Action=CaptchaVerify&Version=2023-03-03`, {
      method: 'POST', headers, body,
    });

    const data = await res.json();
    const resp = data.Response;
    if (!resp) return { valid: false, message: '验证服务响应异常' };

    if (resp.CaptchaCode === 1) return { valid: true, message: '验证通过' };

    console.warn(`[AliCaptcha] 验证失败: code=${resp.CaptchaCode}, msg=${resp.CaptchaMsg}`);
    return { valid: false, message: '人机验证失败，请重试' };
  } catch (error) {
    console.error('[AliCaptcha] 验证异常:', error.message);
    return { valid: true, message: '验证服务异常，已放行' };
  }
};

module.exports = {
  verifyTurnstileToken: (ticket, randstr, userIp) => verifyCaptcha(randstr || ticket, userIp),
};
