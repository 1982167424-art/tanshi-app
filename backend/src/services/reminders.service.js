const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const mapReminder = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userUid: row.user_uid,
    habitId: row.habit_id,
    habitName: row.habit_name,
    habitEmoji: row.habit_emoji,
    time: row.time,
    frequency: row.frequency,
    enabled: !!row.enabled,
    createdAt: row.created_at,
  };
};

const getRemindersByUser = (userUid) => {
  const rows = db.prepare('SELECT * FROM reminders WHERE user_uid = ? ORDER BY time ASC').all(userUid);
  return rows.map(mapReminder);
};

const getReminderByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapReminder(row);
};

const createReminder = (data) => {
  const reminder = {
    id: generateId(),
    user_uid: data.userUid,
    habit_id: data.habitId || null,
    habit_name: data.habitName || '',
    habit_emoji: data.habitEmoji || '',
    time: data.time || '',
    frequency: data.frequency || '',
    enabled: data.enabled === false ? 0 : 1,
    created_at: new Date().toISOString(),
  };

  db.prepare(`INSERT INTO reminders
    (id, user_uid, habit_id, habit_name, habit_emoji, time, frequency, enabled, created_at)
    VALUES (@id, @user_uid, @habit_id, @habit_name, @habit_emoji, @time, @frequency, @enabled, @created_at)`).run(reminder);

  return getReminderByIdForUser(reminder.id, data.userUid);
};

const UPDATE_MAP = {
  habitId: 'habit_id',
  habitName: 'habit_name',
  habitEmoji: 'habit_emoji',
  time: 'time',
  frequency: 'frequency',
};

const updateReminder = (id, userUid, updates) => {
  const existing = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!existing) return null;

  const fields = [];
  const values = { id };
  for (const [camel, snake] of Object.entries(UPDATE_MAP)) {
    if (updates[camel] !== undefined) {
      fields.push(`${snake} = @${camel}`);
      values[camel] = updates[camel];
    }
  }
  if (updates.enabled !== undefined) {
    fields.push('enabled = @enabled');
    values.enabled = updates.enabled ? 1 : 0;
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = @id AND user_uid = ?`).run(values, userUid);
  }
  return getReminderByIdForUser(id, userUid);
};

// 删除提醒并移入回收站
const deleteReminder = (id, userUid) => {
  const row = db.prepare('SELECT * FROM reminders WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const reminder = mapReminder(row);

  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

  const trashId = generateId();
  db.prepare('INSERT INTO trash (id, user_uid, type, data, deleted_at) VALUES (?, ?, ?, ?, ?)').run(
    trashId,
    userUid,
    'reminder',
    JSON.stringify(reminder),
    new Date().toISOString()
  );

  return reminder;
};

module.exports = {
  getRemindersByUser,
  getReminderByIdForUser,
  createReminder,
  updateReminder,
  deleteReminder,
  mapReminder,
};
