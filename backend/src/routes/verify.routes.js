const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/verify.controller');

// 发送验证码（不需要登录）
router.post('/sms/send', ctrl.sendCode);

// 验证验证码（不需要登录）
router.post('/sms/verify', ctrl.verifyCode);

module.exports = router;
