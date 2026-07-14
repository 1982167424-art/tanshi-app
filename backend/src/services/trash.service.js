const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const TRASH_EXPIRE_DAYS = 30;

const mapTrash = (row) => {
  if (!row) return null;
  let data = null;
  try {
    data = row.data ? JSON.parse(row.data) : null;
  } catch {
    data = null;
  }
  return {
    id: row.id,
    userUid: row.user_uid,
    type: row.type,
    data,
    deletedAt: row.deleted_at,
  };
};

const purgeExpired = (userUid) => {
  const threshold = new Date(Date.now() - TRASH_EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM trash WHERE user_uid = ? AND deleted_at < ?').run(userUid, threshold);
};

const getTrashByUser = (userUid) => {
  purgeExpired(userUid);
  const rows = db.prepare('SELECT * FROM trash WHERE user_uid = ? ORDER BY deleted_at DESC').all(userUid);
  return rows.map(mapTrash);
};

const getTrashByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM trash WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapTrash(row);
};

// 恢复项目：从 trash 删除，根据 type 恢复到对应表
const restoreItem = (id, userUid) => {
  const row = db.prepare('SELECT * FROM trash WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const item = mapTrash(row);

  const data = item.data || {};
  const now = new Date().toISOString();

  if (item.type === 'day') {
    db.prepare(`INSERT OR REPLACE INTO days
      (id, user_uid, type, title, target_date, note, countdown_seconds, initial_seconds, is_running, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      data.id || generateId(),
      userUid,
      data.type || '',
      data.title || '',
      data.targetDate || null,
      data.note || '',
      data.countdownSeconds ?? 0,
      data.initialSeconds ?? 0,
      data.isRunning ? 1 : 0,
      data.createdAt || now
    );
  } else if (item.type === 'note') {
    db.prepare(`INSERT OR REPLACE INTO notes
      (id, user_uid, category, title, content, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      data.id || generateId(),
      userUid,
      data.category || '',
      data.title || '',
      data.content || '',
      data.updatedAt || now,
      data.createdAt || now
    );
  } else if (item.type === 'habit') {
    db.prepare(`INSERT OR REPLACE INTO habits
      (id, user_uid, emoji, name, check_dates, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      data.id || generateId(),
      userUid,
      data.emoji || '',
      data.name || '',
      JSON.stringify(data.checkDates || []),
      data.createdAt || now
    );
  } else if (item.type === 'mood') {
    db.prepare(`INSERT OR REPLACE INTO moods
      (id, user_uid, mood_type, date, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      data.id || generateId(),
      userUid,
      data.moodType || '',
      data.date || now.slice(0, 10),
      data.note || '',
      data.createdAt || now
    );
  } else if (item.type === 'reminder') {
    db.prepare(`INSERT OR REPLACE INTO reminders
      (id, user_uid, habit_id, habit_name, habit_emoji, time, frequency, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      data.id || generateId(),
      userUid,
      data.habitId || null,
      data.habitName || '',
      data.habitEmoji || '',
      data.time || '',
      data.frequency || '',
      data.enabled === false ? 0 : 1,
      data.createdAt || now
    );
  }

  db.prepare('DELETE FROM trash WHERE id = ?').run(id);
  return item;
};

const deleteItem = (id, userUid) => {
  const row = db.prepare('SELECT * FROM trash WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const item = mapTrash(row);

  db.prepare('DELETE FROM trash WHERE id = ?').run(id);
  return item;
};

module.exports = {
  getTrashByUser,
  getTrashByIdForUser,
  restoreItem,
  deleteItem,
};
