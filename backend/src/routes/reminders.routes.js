const express = require('express');
const router = express.Router();
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminders.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/reminders - 获取当前用户所有提醒
router.get('/', getReminders);

// POST /api/reminders - 创建提醒
router.post('/', createReminder);

// PUT /api/reminders/:id - 更新提醒
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id - 删除提醒
router.delete('/:id', deleteReminder);

module.exports = router;
