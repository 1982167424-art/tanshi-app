const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const daysRoutes = require('./days.routes');
const notesRoutes = require('./notes.routes');
const habitsRoutes = require('./habits.routes');
const moodsRoutes = require('./moods.routes');
const remindersRoutes = require('./reminders.routes');
const trashRoutes = require('./trash.routes');
const aiRoutes = require('./ai.routes');
const dataRoutes = require('./data.routes');
const adminRoutes = require('./admin.routes');
const checkinRoutes = require('./checkin.routes');

// 聚合所有路由，统一前缀 /api 由 server.js 挂载
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/days', daysRoutes);
router.use('/notes', notesRoutes);
router.use('/habits', habitsRoutes);
router.use('/moods', moodsRoutes);
router.use('/reminders', remindersRoutes);
router.use('/trash', trashRoutes);
router.use('/ai', aiRoutes);
router.use('/data', dataRoutes);
router.use('/admin', adminRoutes);
router.use('/checkin', checkinRoutes);

module.exports = router;
