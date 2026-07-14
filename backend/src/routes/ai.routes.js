const express = require('express');
const router = express.Router();
const { chat, analysis } = require('../controllers/ai.controller');
const { authRequired } = require('../middleware/auth');

// 所有 AI 接口均需要登录认证
router.use(authRequired);

// POST /api/ai/chat - AI 对话
router.post('/chat', chat);

// POST /api/ai/analysis - AI 心情分析
router.post('/analysis', analysis);

module.exports = router;
