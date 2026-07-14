const db = require('../models/database');
const { safeUser } = require('./auth.service');
const { mapDay } = require('./days.service');
const { mapNote } = require('./notes.service');
const { mapHabit } = require('./habits.service');
const { mapMood } = require('./moods.service');
const { mapReminder } = require('./reminders.service');

// 导出用户所有数据
const exportData = (userUid) => {
  const user = safeUser(db.prepare('SELECT * FROM users WHERE uid = ?').get(userUid));
  const days = db.prepare('SELECT * FROM days WHERE user_uid = ?').all(userUid).map(mapDay);
  const notes = db.prepare('SELECT * FROM notes WHERE user_uid = ?').all(userUid).map(mapNote);
  const habits = db.prepare('SELECT * FROM habits WHERE user_uid = ?').all(userUid).map(mapHabit);
  const moods = db.prepare('SELECT * FROM moods WHERE user_uid = ?').all(userUid).map(mapMood);
  const reminders = db.prepare('SELECT * FROM reminders WHERE user_uid = ?').all(userUid).map(mapReminder);

  return { user, days, notes, habits, moods, reminders, exportedAt: new Date().toISOString() };
};

// 导入用户数据（合并模式：跳过已存在的id）
const importData = (userUid, data) => {
  const stats = { days: 0, notes: 0, habits: 0, moods: 0, reminders: 0 };

  const insertDay = db.prepare(`INSERT OR IGNORE INTO days
    (id, user_uid, type, title, target_date, note, countdown_seconds, initial_seconds, is_running, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const d of data.days || []) {
    const r = insertDay.run(d.id, userUid, d.type || '', d.title || '', d.targetDate || null, d.note || '', d.countdownSeconds ?? 0, d.initialSeconds ?? 0, d.isRunning ? 1 : 0, d.createdAt || new Date().toISOString());
    if (r.changes > 0) stats.days++;
  }

  const insertNote = db.prepare(`INSERT OR IGNORE INTO notes
    (id, user_uid, category, title, content, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const n of data.notes || []) {
    const r = insertNote.run(n.id, userUid, n.category || '', n.title || '', n.content || '', n.updatedAt || new Date().toISOString(), n.createdAt || new Date().toISOString());
    if (r.changes > 0) stats.notes++;
  }

  const insertHabit = db.prepare(`INSERT OR IGNORE INTO habits
    (id, user_uid, emoji, name, check_dates, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`);
  for (const h of data.habits || []) {
    const r = insertHabit.run(h.id, userUid, h.emoji || '', h.name || '', JSON.stringify(h.checkDates || []), h.createdAt || new Date().toISOString());
    if (r.changes > 0) stats.habits++;
  }

  const insertMood = db.prepare(`INSERT OR IGNORE INTO moods
    (id, user_uid, mood_type, date, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`);
  for (const m of data.moods || []) {
    const r = insertMood.run(m.id, userUid, m.moodType || '', m.date || new Date().toISOString().slice(0, 10), m.note || '', m.createdAt || new Date().toISOString());
    if (r.changes > 0) stats.moods++;
  }

  const insertReminder = db.prepare(`INSERT OR IGNORE INTO reminders
    (id, user_uid, habit_id, habit_name, habit_emoji, time, frequency, enabled, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of data.reminders || []) {
    const result = insertReminder.run(r.id, userUid, r.habitId || null, r.habitName || '', r.habitEmoji || '', r.time || '', r.frequency || '', r.enabled === false ? 0 : 1, r.createdAt || new Date().toISOString());
    if (result.changes > 0) stats.reminders++;
  }

  return stats;
};

// 全局搜索：在用户的所有数据中搜索关键词
const search = (userUid, keyword) => {
  const kw = `%${keyword}%`;
  const results = { days: [], notes: [], habits: [], moods: [] };

  results.days = db.prepare('SELECT * FROM days WHERE user_uid = ? AND (title LIKE ? OR note LIKE ?)').all(userUid, kw, kw).map(mapDay);
  results.notes = db.prepare('SELECT * FROM notes WHERE user_uid = ? AND (title LIKE ? OR content LIKE ?)').all(userUid, kw, kw).map(mapNote);
  results.habits = db.prepare('SELECT * FROM habits WHERE user_uid = ? AND name LIKE ?').all(userUid, kw).map(mapHabit);
  results.moods = db.prepare('SELECT * FROM moods WHERE user_uid = ? AND note LIKE ?').all(userUid, kw).map(mapMood);

  return results;
};

module.exports = { exportData, importData, search };
