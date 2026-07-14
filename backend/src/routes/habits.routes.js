const express = require('express');
const router = express.Router();
const { getHabits, createHabit, updateHabit, deleteHabit } = require('../controllers/habits.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/habits - 获取当前用户所有习惯
router.get('/', getHabits);

// POST /api/habits - 创建习惯
router.post('/', createHabit);

// PUT /api/habits/:id - 更新习惯
router.put('/:id', updateHabit);

// DELETE /api/habits/:id - 删除习惯
router.delete('/:id', deleteHabit);

module.exports = router;
