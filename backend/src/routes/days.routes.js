const express = require('express');
const router = express.Router();
const { getDays, createDay, updateDay, deleteDay } = require('../controllers/days.controller');
const { authRequired } = require('../middleware/auth');

// 所有日子接口均需要登录认证，userUid 从 req.user.uid 获取
router.use(authRequired);

// GET /api/days - 获取当前用户所有日子
router.get('/', getDays);

// POST /api/days - 创建日子
router.post('/', createDay);

// PUT /api/days/:id - 更新日子
router.put('/:id', updateDay);

// DELETE /api/days/:id - 删除日子
router.delete('/:id', deleteDay);

module.exports = router;
