const express = require('express');
const router = express.Router();
const { getTrash, restoreItem, deleteItem } = require('../controllers/trash.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/trash - 获取回收站项目
router.get('/', getTrash);

// POST /api/trash/:id/restore - 恢复项目
router.post('/:id/restore', restoreItem);

// DELETE /api/trash/:id - 永久删除项目
router.delete('/:id', deleteItem);

module.exports = router;
