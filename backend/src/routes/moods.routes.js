const express = require('express');
const router = express.Router();
const { getMoods, createMood, updateMood, deleteMood } = require('../controllers/moods.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/moods - 获取当前用户所有心情
router.get('/', getMoods);

// POST /api/moods - 创建心情
router.post('/', createMood);

// PUT /api/moods/:id - 更新心情
router.put('/:id', updateMood);

// DELETE /api/moods/:id - 删除心情
router.delete('/:id', deleteMood);

module.exports = router;
