const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const mapHabit = (row) => {
  if (!row) return null;
  let checkDates = [];
  try {
    checkDates = row.check_dates ? JSON.parse(row.check_dates) : [];
  } catch {
    checkDates = [];
  }
  return {
    id: row.id,
    userUid: row.user_uid,
    emoji: row.emoji,
    name: row.name,
    checkDates,
    createdAt: row.created_at,
  };
};

const getHabitsByUser = (userUid) => {
  const rows = db.prepare('SELECT * FROM habits WHERE user_uid = ? ORDER BY created_at DESC').all(userUid);
  return rows.map(mapHabit);
};

const getHabitByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM habits WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapHabit(row);
};

const createHabit = (data) => {
  const habit = {
    id: generateId(),
    user_uid: data.userUid,
    emoji: data.emoji || '',
    name: data.name || '',
    check_dates: JSON.stringify(data.checkDates || []),
    created_at: new Date().toISOString(),
  };

  db.prepare(`INSERT INTO habits
    (id, user_uid, emoji, name, check_dates, created_at)
    VALUES (@id, @user_uid, @emoji, @name, @check_dates, @created_at)`).run(habit);

  return getHabitByIdForUser(habit.id, data.userUid);
};

const UPDATE_MAP = {
  emoji: 'emoji',
  name: 'name',
};

const updateHabit = (id, userUid, updates) => {
  const existing = db.prepare('SELECT * FROM habits WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!existing) return null;

  const fields = [];
  const values = { id };
  for (const [camel, snake] of Object.entries(UPDATE_MAP)) {
    if (updates[camel] !== undefined) {
      fields.push(`${snake} = @${camel}`);
      values[camel] = updates[camel];
    }
  }
  if (updates.checkDates !== undefined) {
    fields.push('check_dates = @check_dates');
    values.check_dates = JSON.stringify(updates.checkDates || []);
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE habits SET ${fields.join(', ')} WHERE id = @id AND user_uid = ?`).run(values, userUid);
  }
  return getHabitByIdForUser(id, userUid);
};

// 删除习惯并移入回收站，同时清理关联提醒
const deleteHabit = (id, userUid) => {
  const row = db.prepare('SELECT * FROM habits WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const habit = mapHabit(row);

  db.prepare('DELETE FROM reminders WHERE habit_id = ?').run(id);
  db.prepare('DELETE FROM habits WHERE id = ?').run(id);

  const trashId = generateId();
  db.prepare('INSERT INTO trash (id, user_uid, type, data, deleted_at) VALUES (?, ?, ?, ?, ?)').run(
    trashId,
    userUid,
    'habit',
    JSON.stringify(habit),
    new Date().toISOString()
  );

  return habit;
};

module.exports = {
  getHabitsByUser,
  getHabitByIdForUser,
  createHabit,
  updateHabit,
  deleteHabit,
  mapHabit,
};
