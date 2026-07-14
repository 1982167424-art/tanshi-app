const db = require('../models/database');
const { safeUser } = require('../services/auth.service');
const { success, fail } = require('../utils/response');

// 获取所有用户及数据统计
const getStats = (req, res, next) => {
  try {
    const rawUsers = db.prepare('SELECT * FROM users').all();
    const users = rawUsers.map(safeUser);
    const days = db.prepare('SELECT * FROM days').all();
    const notes = db.prepare('SELECT * FROM notes').all();
    const habits = db.prepare('SELECT * FROM habits').all();
    const moods = db.prepare('SELECT * FROM moods').all();
    const reminders = db.prepare('SELECT * FROM reminders').all();
    const trash = db.prepare('SELECT * FROM trash').all();

    return success(res, {
      counts: {
        users: users.length,
        days: days.length,
        notes: notes.length,
        habits: habits.length,
        moods: moods.length,
        reminders: reminders.length,
        trash: trash.length,
      },
      users: users.map(u => ({
        ...u,
        stats: {
          days: days.filter(d => d.user_uid === u.uid).length,
          notes: notes.filter(n => n.user_uid === u.uid).length,
          habits: habits.filter(h => h.user_uid === u.uid).length,
          moods: moods.filter(m => m.user_uid === u.uid).length,
          reminders: reminders.filter(r => r.user_uid === u.uid).length,
        },
      })),
    }, '获取成功');
  } catch (err) {
    next(err);
  }
};

// 管理员删除用户
const adminDeleteUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    const existing = db.prepare('SELECT uid FROM users WHERE uid = ?').get(uid);
    if (!existing) return fail(res, '用户不存在', 404);

    db.prepare('DELETE FROM users WHERE uid = ?').run(uid);
    return success(res, null, '用户及所有数据已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, adminDeleteUser };
