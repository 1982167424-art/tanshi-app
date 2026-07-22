const db = require('../models/database');
const { generateId } = require('../utils/crypto');

// 发送私聊消息
const sendMessage = (fromUid, toUid, content, msgType = 'text', extra = '{}') => {
  const friend = db.prepare("SELECT id FROM friends WHERE user_uid = ? AND friend_uid = ?").get(fromUid, toUid);
  if (!friend) throw new Error('只能给好友发送消息');

  const id = generateId();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO friend_messages (id, from_uid, to_uid, content, msg_type, extra, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, fromUid, toUid, content, msgType, extra, now);

  return { id, from_uid: fromUid, to_uid: toUid, content, msg_type: msgType, extra: JSON.parse(extra), created_at: now };
};

// 获取聊天记录
const getMessages = (userUid, friendUid, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const rows = db.prepare(
    `SELECT fm.*, u.username, u.avatar
     FROM friend_messages fm
     JOIN users u ON fm.from_uid = u.uid
     WHERE (fm.from_uid = ? AND fm.to_uid = ?) OR (fm.from_uid = ? AND fm.to_uid = ?)
     ORDER BY fm.created_at ASC
     LIMIT ? OFFSET ?`
  ).all(userUid, friendUid, friendUid, userUid, limit, offset);

  return rows.map(r => ({ ...r, extra: JSON.parse(r.extra || '{}') }));
};

// 聊天列表
const getChatList = (userUid) => {
  return db.prepare(
    `SELECT
      CASE WHEN fm.from_uid = ? THEN fm.to_uid ELSE fm.from_uid END as friend_uid,
      u.username, u.avatar,
      fm.content as lastMessage,
      fm.msg_type as lastMsgType,
      fm.created_at as lastMessageAt
     FROM friend_messages fm
     JOIN users u ON u.uid = CASE WHEN fm.from_uid = ? THEN fm.to_uid ELSE fm.from_uid END
     WHERE fm.from_uid = ? OR fm.to_uid = ?
     GROUP BY friend_uid
     ORDER BY MAX(fm.created_at) DESC`
  ).all(userUid, userUid, userUid, userUid);
};

module.exports = { sendMessage, getMessages, getChatList };
