const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const mapDay = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userUid: row.user_uid,
    type: row.type,
    title: row.title,
    targetDate: row.target_date,
    note: row.note,
    countdownSeconds: row.countdown_seconds,
    initialSeconds: row.initial_seconds,
    isRunning: !!row.is_running,
    createdAt: row.created_at,
  };
};

const getDaysByUser = (userUid) => {
  const rows = db.prepare('SELECT * FROM days WHERE user_uid = ? ORDER BY created_at DESC').all(userUid);
  return rows.map(mapDay);
};

// 按 id 查询并校验所有权
const getDayByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM days WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapDay(row);
};

const createDay = (data) => {
  const now = new Date().toISOString();
  const day = {
    id: generateId(),
    user_uid: data.userUid,
    type: data.type || '',
    title: data.title || '',
    target_date: data.targetDate || null,
    note: data.note || '',
    countdown_seconds: data.countdownSeconds ?? 0,
    initial_seconds: data.initialSeconds ?? 0,
    is_running: data.isRunning ? 1 : 0,
    created_at: now,
  };

  db.prepare(`INSERT INTO days
    (id, user_uid, type, title, target_date, note, countdown_seconds, initial_seconds, is_running, created_at)
    VALUES (@id, @user_uid, @type, @title, @target_date, @note, @countdown_seconds, @initial_seconds, @is_running, @created_at)`).run(day);

  return getDayByIdForUser(day.id, data.userUid);
};

const UPDATE_MAP = {
  type: 'type',
  title: 'title',
  targetDate: 'target_date',
  note: 'note',
  countdownSeconds: 'countdown_seconds',
  initialSeconds: 'initial_seconds',
  isRunning: 'is_running',
};

const updateDay = (id, userUid, updates) => {
  const existing = db.prepare('SELECT * FROM days WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!existing) return null;

  const fields = [];
  const values = { id };
  for (const [camel, snake] of Object.entries(UPDATE_MAP)) {
    if (updates[camel] !== undefined) {
      fields.push(`${snake} = @${camel}`);
      values[camel] = camel === 'isRunning' ? (updates[camel] ? 1 : 0) : updates[camel];
    }
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE days SET ${fields.join(', ')} WHERE id = @id AND user_uid = ?`).run(values, userUid);
  }
  return getDayByIdForUser(id, userUid);
};

// 删除日子并移入回收站
const deleteDay = (id, userUid) => {
  const row = db.prepare('SELECT * FROM days WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const day = mapDay(row);

  db.prepare('DELETE FROM days WHERE id = ?').run(id);

  const trashId = generateId();
  db.prepare('INSERT INTO trash (id, user_uid, type, data, deleted_at) VALUES (?, ?, ?, ?, ?)').run(
    trashId,
    userUid,
    'day',
    JSON.stringify(day),
    new Date().toISOString()
  );

  return day;
};

module.exports = {
  getDaysByUser,
  getDayByIdForUser,
  createDay,
  updateDay,
  deleteDay,
  mapDay,
};
