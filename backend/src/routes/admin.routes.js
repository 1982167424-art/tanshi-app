const express = require('express');
const router = express.Router();
const { getStats, adminDeleteUser } = require('../controllers/admin.controller');
const { adminRequired } = require('../middleware/adminAuth');

// 所有管理接口均需要 Admin-Key 认证
router.use(adminRequired);

// GET /api/admin/stats - 获取统计数据和用户列表
router.get('/stats', getStats);

// DELETE /api/admin/users/:uid - 管理员删除用户
router.delete('/users/:uid', adminDeleteUser);

module.exports = router;
