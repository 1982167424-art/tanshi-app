const express = require('express');
const router = express.Router();
const { sign } = require('../utils/jwt');
const { findOrCreateOAuthUser } = require('../services/oauth.service');
const config = require('../config');

const BASE = config.oauth.redirectBase;
const FRONTEND = config.oauth.frontendBase;

// ============ 微信登录 ============
// 微信开放平台 OAuth 2.0 网页授权
// 文档: https://open.weixin.qq.com/doc/wiki/detail?id=105411

router.get('/wechat', (req, res) => {
  if (!config.oauth.wechat.clientId) {
    return res.redirect(`${FRONTEND}/login?error=wechat_not_configured`);
  }
  const state = Buffer.from(JSON.stringify({ provider: 'wechat' })).toString('base64url');
  const params = new URLSearchParams({
    appid: config.oauth.wechat.clientId,
    redirect_uri: `${BASE}/api/auth/wechat/callback`,
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  });
  res.redirect(`https://open.weixin.qq.com/connect/qrconnect?${params}#wechat_redirect`);
});

router.get('/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect(`${FRONTEND}/login?error=no_code`);

    if (req.query.errcode) {
      return res.redirect(`${FRONTEND}/login?error=wechat_auth_denied`);
    }

    // 用授权码换取 access_token
    const tokenUrl = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
    tokenUrl.searchParams.set('appid', config.oauth.wechat.clientId);
    tokenUrl.searchParams.set('secret', config.oauth.wechat.clientSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('grant_type', 'authorization_code');

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect(`${FRONTEND}/login?error=wechat_token_failed`);

    // 获取用户信息
    const userUrl = new URL('https://api.weixin.qq.com/sns/userinfo');
    userUrl.searchParams.set('access_token', tokenData.access_token);
    userUrl.searchParams.set('openid', tokenData.openid);
    userUrl.searchParams.set('lang', 'zh_CN');

    const userRes = await fetch(userUrl.toString());
    const profile = await userRes.json();
    if (!profile.openid) return res.redirect(`${FRONTEND}/login?error=wechat_profile_failed`);

    const user = findOrCreateOAuthUser('wechat', profile.openid, '', profile.nickname || 'wechat_user');
    const jwtToken = sign({ uid: user.uid, username: user.username });
    return res.redirect(`${FRONTEND}/auth/callback/wechat?token=${jwtToken}&uid=${user.uid}&username=${encodeURIComponent(user.username)}`);
  } catch (e) {
    console.error('[OAuth WeChat]', e);
    return res.redirect(`${FRONTEND}/login?error=wechat_error`);
  }
});

module.exports = router;
