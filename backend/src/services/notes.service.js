const db = require('../models/database');
const { generateId } = require('../utils/crypto');

const mapNote = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userUid: row.user_uid,
    category: row.category,
    title: row.title,
    content: row.content,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
};

const getNotesByUser = (userUid) => {
  const rows = db.prepare('SELECT * FROM notes WHERE user_uid = ? ORDER BY updated_at DESC').all(userUid);
  return rows.map(mapNote);
};

const getNoteByIdForUser = (id, userUid) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uid = ?').get(id, userUid);
  return mapNote(row);
};

const createNote = (data) => {
  const now = new Date().toISOString();
  const note = {
    id: generateId(),
    user_uid: data.userUid,
    category: data.category || '',
    title: data.title || '',
    content: data.content || '',
    updated_at: now,
    created_at: now,
  };

  db.prepare(`INSERT INTO notes
    (id, user_uid, category, title, content, updated_at, created_at)
    VALUES (@id, @user_uid, @category, @title, @content, @updated_at, @created_at)`).run(note);

  return getNoteByIdForUser(note.id, data.userUid);
};

const UPDATE_MAP = {
  category: 'category',
  title: 'title',
  content: 'content',
};

const updateNote = (id, userUid, updates) => {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!existing) return null;

  const fields = [];
  const values = { id };
  for (const [camel, snake] of Object.entries(UPDATE_MAP)) {
    if (updates[camel] !== undefined) {
      fields.push(`${snake} = @${camel}`);
      values[camel] = updates[camel];
    }
  }
  fields.push('updated_at = @updated_at');
  values.updated_at = new Date().toISOString();

  db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = @id AND user_uid = ?`).run(values, userUid);
  return getNoteByIdForUser(id, userUid);
};

const deleteNote = (id, userUid) => {
  const row = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uid = ?').get(id, userUid);
  if (!row) return null;
  const note = mapNote(row);

  db.prepare('DELETE FROM notes WHERE id = ?').run(id);

  const trashId = generateId();
  db.prepare('INSERT INTO trash (id, user_uid, type, data, deleted_at) VALUES (?, ?, ?, ?, ?)').run(
    trashId,
    userUid,
    'note',
    JSON.stringify(note),
    new Date().toISOString()
  );

  return note;
};

module.exports = {
  getNotesByUser,
  getNoteByIdForUser,
  createNote,
  updateNote,
  deleteNote,
  mapNote,
};
