// OAuth 工具函数
// 当前仅支持华为账号登录

// 华为 OAuth 2.0 流程:
// 1. 重定向到 https://accounts.huawei.com/oauth2/v3/authorize
// 2. 用户授权后回调 /api/auth/huawei/callback
// 3. 用授权码换取 access_token: POST https://oauth-login.cloud.huawei.com/oauth2/v3/token
// 4. 获取用户信息: GET https://oauth-login.cloud.huawei.com/oauth2/v3/userinfo

module.exports = {};
