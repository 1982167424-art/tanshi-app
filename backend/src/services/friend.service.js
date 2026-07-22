const db = require('../models/database');
const { generateId } = require('../utils/crypto');

// 搜索用户（按 UID 或用户名）
const searchUsers = (query, by = 'uid') => {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim();

  if (by === 'uid') {
    return db.prepare(
      "SELECT uid, username, avatar, created_at FROM users WHERE uid = ?"
    ).all(q).map(safeProfile);
  }

  return db.prepare(
    "SELECT uid, username, avatar, created_at FROM users WHERE username LIKE ? LIMIT 20"
  ).all(`%${q}%`).map(safeProfile);
};

// 获取用户公开资料
const getUserProfile = (uid) => {
  const row = db.prepare(
    "SELECT uid, username, avatar, created_at FROM users WHERE uid = ?"
  ).get(uid);
  return row ? safeProfile(row) : null;
};

const safeProfile = (row) => {
  if (!row) return null;
  return { uid: row.uid, username: row.username, avatar: row.avatar || '', createdAt: row.created_at };
};

// 发送好友申请
const sendFriendRequest = (fromUid, toUid, reason = '', permission = 'chat_only') => {
  if (fromUid === toUid) throw new Error('不能添加自己为好友');

  // 检查是否已经是好友
  const existing = db.prepare(
    "SELECT id FROM friends WHERE user_uid = ? AND friend_uid = ?"
  ).get(fromUid, toUid);
  if (existing) throw new Error('已经是好友了');

  // 检查是否有待处理的申请
  const pending = db.prepare(
    "SELECT id FROM friend_requests WHERE from_uid = ? AND to_uid = ? AND status = 'pending'"
  ).get(fromUid, toUid);
  if (pending) throw new Error('已经发送过申请了');

  // 检查对方是否已发过申请给我
  const reverse = db.prepare(
    "SELECT id, status FROM friend_requests WHERE from_uid = ? AND to_uid = ? AND status = 'pending'"
  ).get(toUid, fromUid);
  if (reverse) {
    // 对方已发过申请，自动接受
    acceptFriendRequest(reverse.id, fromUid, permission);
    return { autoAccepted: true };
  }

  const id = generateId();
  db.prepare(
    "INSERT INTO friend_requests (id, from_uid, to_uid, reason, permission, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
  ).run(id, fromUid, toUid, reason, permission, new Date().toISOString());

  return { autoAccepted: false, requestId: id };
};

// 获取收到的好友申请
const getReceivedRequests = (uid) => {
  return db.prepare(
    `SELECT fr.*, u.username, u.avatar
     FROM friend_requests fr
     JOIN users u ON fr.from_uid = u.uid
     WHERE fr.to_uid = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`
  ).all(uid);
};

// 获取发出的好友申请
const getSentRequests = (uid) => {
  return db.prepare(
    `SELECT fr.*, u.username, u.avatar
     FROM friend_requests fr
     JOIN users u ON fr.to_uid = u.uid
     WHERE fr.from_uid = ? AND fr.status = 'pending'
     ORDER BY fr.created_at DESC`
  ).all(uid);
};

// 回复申请
const replyToRequest = (requestId, userId, replyText) => {
  const req = db.prepare("SELECT * FROM friend_requests WHERE id = ?").get(requestId);
  if (!req) throw new Error('申请不存在');
  if (req.to_uid !== userId) throw new Error('无权操作');

  db.prepare("UPDATE friend_requests SET reply = ? WHERE id = ?").run(replyText, requestId);
};

// 接受好友申请
const acceptFriendRequest = (requestId, userId, permission = 'chat_only') => {
  const req = db.prepare("SELECT * FROM friend_requests WHERE id = ? AND status = 'pending'").get(requestId);
  if (!req) throw new Error('申请不存在或已处理');

  // 检查是否是收到的申请（自动接受时不检查）
  if (req.to_uid !== userId && req.from_uid !== userId) {
    throw new Error('无权操作');
  }

  db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").run(requestId);

  // 双向添加好友
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO friends (id, user_uid, friend_uid, permission, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(generateId(), req.from_uid, req.to_uid, permission, now);
  db.prepare("INSERT OR IGNORE INTO friends (id, user_uid, friend_uid, permission, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(generateId(), req.to_uid, req.from_uid, permission, now);
};

// 拒绝好友申请
const rejectFriendRequest = (requestId, userId) => {
  const req = db.prepare("SELECT * FROM friend_requests WHERE id = ? AND status = 'pending'").get(requestId);
  if (!req) throw new Error('申请不存在或已处理');
  if (req.to_uid !== userId) throw new Error('无权操作');

  db.prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = ?").run(requestId);
};

// 获取好友列表
const getFriends = (uid) => {
  return db.prepare(
    `SELECT f.friend_uid, f.permission, f.created_at, u.username, u.avatar
     FROM friends f
     JOIN users u ON f.friend_uid = u.uid
     WHERE f.user_uid = ?
     ORDER BY f.created_at DESC`
  ).all(uid);
};

// 删除好友
const removeFriend = (uid, friendUid) => {
  db.prepare("DELETE FROM friends WHERE user_uid = ? AND friend_uid = ?").run(uid, friendUid);
  db.prepare("DELETE FROM friends WHERE user_uid = ? AND friend_uid = ?").run(friendUid, uid);
};

// 修改好友权限
const updateFriendPermission = (uid, friendUid, permission) => {
  db.prepare("UPDATE friends SET permission = ? WHERE user_uid = ? AND friend_uid = ?")
    .run(permission, uid, friendUid);
};

// 检查是否是好友
const areFriends = (uid1, uid2) => {
  return !!db.prepare("SELECT id FROM friends WHERE user_uid = ? AND friend_uid = ?").get(uid1, uid2);
};

// 获取好友申请未读数
const getUnreadCount = (uid) => {
  const row = db.prepare(
    "SELECT COUNT(*) as cnt FROM friend_requests WHERE to_uid = ? AND status = 'pending'"
  ).get(uid);
  return row ? row.cnt : 0;
};

// 拉黑用户（同时删除好友关系）
const blockUser = (uid, blockedUid) => {
  if (uid === blockedUid) throw new Error('不能拉黑自己');

  // 检查是否已拉黑
  const existing = db.prepare("SELECT 1 FROM blocklist WHERE user_uid = ? AND blocked_uid = ?").get(uid, blockedUid);
  if (existing) throw new Error('已在黑名单中');

  // 写入黑名单
  db.prepare("INSERT INTO blocklist (user_uid, blocked_uid, created_at) VALUES (?, ?, ?)")
    .run(uid, blockedUid, new Date().toISOString());

  // 同时删除好友关系
  removeFriend(uid, blockedUid);
};

// 取消拉黑
const unblockUser = (uid, blockedUid) => {
  db.prepare("DELETE FROM blocklist WHERE user_uid = ? AND blocked_uid = ?").run(uid, blockedUid);
};

// 获取黑名单列表
const getBlocklist = (uid) => {
  return db.prepare(
    `SELECT b.blocked_uid, b.created_at, u.username, u.avatar
     FROM blocklist b JOIN users u ON b.blocked_uid = u.uid
     WHERE b.user_uid = ? ORDER BY b.created_at DESC`
  ).all(uid);
};

// 检查是否被拉黑
const isBlocked = (uid, targetUid) => {
  return !!db.prepare("SELECT 1 FROM blocklist WHERE user_uid = ? AND blocked_uid = ?").get(uid, targetUid);
};

module.exports = {
  searchUsers,
  getUserProfile,
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  replyToRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
  updateFriendPermission,
  areFriends,
  getUnreadCount,
  blockUser,
  unblockUser,
  getBlocklist,
  isBlocked,
};
