const db = require('../models/database');
const { generateId } = require('../utils/crypto');

// 发布状态（24小时过期）
const createStatus = (userUid, content, emoji = '', background = '') => {
  const id = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    "INSERT INTO statuses (id, user_uid, content, emoji, background, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, userUid, content, emoji, background, expiresAt, now.toISOString());

  return getStatus(id);
};

// 获取状态
const getStatus = (statusId) => {
  const row = db.prepare(
    `SELECT s.*, u.username, u.avatar
     FROM statuses s JOIN users u ON s.user_uid = u.uid
     WHERE s.id = ?`
  ).get(statusId);
  if (!row) return null;
  return { ...row, isExpired: new Date(row.expires_at) < new Date() };
};

// 获取好友状态列表（不含过期的）
const getFriendStatuses = (userUid) => {
  const friendRows = db.prepare("SELECT friend_uid FROM friends WHERE user_uid = ?").all(userUid);
  const friendUids = friendRows.map(r => r.friend_uid);
  friendUids.push(userUid);

  const placeholders = friendUids.map(() => '?').join(',');

  return db.prepare(
    `SELECT s.*, u.username, u.avatar
     FROM statuses s JOIN users u ON s.user_uid = u.uid
     WHERE s.user_uid IN (${placeholders})
     AND s.expires_at > datetime('now')
     ORDER BY s.created_at DESC
     LIMIT 50`
  ).all(...friendUids).map(s => ({ ...s, isExpired: false }));
};

// 获取某用户的状态
const getUserStatuses = (targetUid) => {
  return db.prepare(
    `SELECT * FROM statuses
     WHERE user_uid = ? AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 10`
  ).all(targetUid);
};

// 删除状态
const deleteStatus = (statusId, userUid) => {
  const status = db.prepare("SELECT * FROM statuses WHERE id = ? AND user_uid = ?").get(statusId, userUid);
  if (!status) throw new Error('状态不存在或无权删除');
  db.prepare("DELETE FROM statuses WHERE id = ?").run(statusId);
};

// 清理过期状态
const cleanExpired = () => {
  db.prepare("DELETE FROM statuses WHERE expires_at <= datetime('now')").run();
};

module.exports = {
  createStatus,
  getStatus,
  getFriendStatuses,
  getUserStatuses,
  deleteStatus,
  cleanExpired,
};
