const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const mapMood = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userUid: row.user_uid,
    moodType: row.mood_type,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
  };
};

const getMoodsByUser = (userUid) => {
  const rows = db.prepare('SELECT * FROM moods WHERE user_uid = ? ORDER BY date DESC').all(userUid);
  return rows.map(mapMood);
};

const getMoodByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM moods WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapMood(row);
};

const createMood = (data) => {
  const now = new Date().toISOString();
  const mood = {
    id: generateId(),
    user_uid: data.userUid,
    mood_type: data.moodType || '',
    date: data.date || now.slice(0, 10),
    note: data.note || '',
    created_at: now,
  };

  db.prepare(`INSERT INTO moods
    (id, user_uid, mood_type, date, note, created_at)
    VALUES (@id, @user_uid, @mood_type, @date, @note, @created_at)`).run(mood);

  return getMoodByIdForUser(mood.id, data.userUid);
};

const UPDATE_MAP = {
  moodType: 'mood_type',
  date: 'date',
  note: 'note',
};

const updateMood = (id, userUid, updates) => {
  const existing = db.prepare('SELECT * FROM moods WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!existing) return null;

  const fields = [];
  const values = { id };
  for (const [camel, snake] of Object.entries(UPDATE_MAP)) {
    if (updates[camel] !== undefined) {
      fields.push(`${snake} = @${camel}`);
      values[camel] = updates[camel];
    }
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE moods SET ${fields.join(', ')} WHERE id = @id AND user_uid = ?`).run(values, userUid);
  }
  return getMoodByIdForUser(id, userUid);
};

// 删除心情并移入回收站
const deleteMood = (id, userUid) => {
  const row = db.prepare('SELECT * FROM moods WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const mood = mapMood(row);

  db.prepare('DELETE FROM moods WHERE id = ?').run(id);

  const trashId = generateId();
  db.prepare('INSERT INTO trash (id, user_uid, type, data, deleted_at) VALUES (?, ?, ?, ?, ?)').run(
    trashId,
    userUid,
    'mood',
    JSON.stringify(mood),
    new Date().toISOString()
  );

  return mood;
};

module.exports = {
  getMoodsByUser,
  getMoodByIdForUser,
  createMood,
  updateMood,
  deleteMood,
  mapMood,
};
