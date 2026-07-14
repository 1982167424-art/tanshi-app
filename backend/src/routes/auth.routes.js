const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

// POST /api/auth/register - 注册
router.post('/register', register);

// POST /api/auth/login - 登录
router.post('/login', login);

module.exports = router;
