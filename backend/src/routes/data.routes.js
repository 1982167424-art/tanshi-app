const express = require('express');
const router = express.Router();
const { exportData, importData, search } = require('../controllers/data.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/data/export - 导出所有数据
router.get('/export', exportData);

// POST /api/data/import - 导入数据
router.post('/import', importData);

// GET /api/data/search?q=关键词 - 全局搜索
router.get('/search', search);

module.exports = router;
