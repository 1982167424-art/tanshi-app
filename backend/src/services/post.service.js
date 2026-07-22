const db = require('../models/database');
const { generateId } = require('../utils/crypto');
const friendService = require('./friend.service');

// 发布帖子
const createPost = (userUid, content, images = '[]', video = '', visibility = 'friends') => {
  const id = generateId();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO posts (id, user_uid, content, images, video, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, userUid, content, images, video, visibility, now, now);
  return getPost(id, userUid);
};

// 获取帖子详情（含点赞数、评论数、是否已点赞）
const getPost = (postId, viewerUid) => {
  const post = db.prepare(
    `SELECT p.*, u.username, u.avatar
     FROM posts p JOIN users u ON p.user_uid = u.uid
     WHERE p.id = ?`
  ).get(postId);
  if (!post) return null;

  const likeCount = db.prepare("SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ?").get(postId).cnt;
  const commentCount = db.prepare("SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = ?").get(postId).cnt;
  const liked = viewerUid ? !!db.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?").get(postId, viewerUid) : false;

  return { ...post, images: JSON.parse(post.images || '[]'), likeCount, commentCount, liked };
};

// 获取好友动态信息流
const getFeed = (userUid, page = 1, limit = 20) => {
  // 获取好友 UID 列表
  const friendRows = db.prepare("SELECT friend_uid FROM friends WHERE user_uid = ?").all(userUid);
  const friendUids = friendRows.map(r => r.friend_uid);
  friendUids.push(userUid); // 也包含自己

  // 构建 IN 占位符
  const placeholders = friendUids.map(() => '?').join(',');

  const offset = (page - 1) * limit;
  const posts = db.prepare(
    `SELECT p.*, u.username, u.avatar
     FROM posts p JOIN users u ON p.user_uid = u.uid
     WHERE p.user_uid IN (${placeholders})
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...friendUids, limit, offset);

  return posts.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    likeCount: db.prepare("SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ?").get(p.id).cnt,
    commentCount: db.prepare("SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = ?").get(p.id).cnt,
    liked: !!db.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?").get(p.id, userUid),
  }));
};

// 获取某用户的帖子
const getUserPosts = (targetUid, viewerUid, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const posts = db.prepare(
    `SELECT p.*, u.username, u.avatar
     FROM posts p JOIN users u ON p.user_uid = u.uid
     WHERE p.user_uid = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(targetUid, limit, offset);

  return posts.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    likeCount: db.prepare("SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ?").get(p.id).cnt,
    commentCount: db.prepare("SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = ?").get(p.id).cnt,
    liked: viewerUid ? !!db.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?").get(p.id, viewerUid) : false,
  }));
};

// 删除帖子
const deletePost = (postId, userUid) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ? AND user_uid = ?").get(postId, userUid);
  if (!post) throw new Error('帖子不存在或无权删除');
  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
};

// 点赞/取消点赞
const toggleLike = (postId, userUid) => {
  const existing = db.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_uid = ?").get(postId, userUid);
  if (existing) {
    db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_uid = ?").run(postId, userUid);
    return false;
  } else {
    db.prepare("INSERT INTO post_likes (post_id, user_uid, created_at) VALUES (?, ?, ?)").run(postId, userUid, new Date().toISOString());
    return true;
  }
};

// 添加评论
const addComment = (postId, userUid, content) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) throw new Error('帖子不存在');

  const id = generateId();
  db.prepare(
    "INSERT INTO post_comments (id, post_id, user_uid, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, postId, userUid, content, new Date().toISOString());

  return getComment(id);
};

// 获取评论
const getComments = (postId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  return db.prepare(
    `SELECT pc.*, u.username, u.avatar
     FROM post_comments pc JOIN users u ON pc.user_uid = u.uid
     WHERE pc.post_id = ?
     ORDER BY pc.created_at ASC
     LIMIT ? OFFSET ?`
  ).all(postId, limit, offset);
};

// 删除评论
const deleteComment = (commentId, userUid) => {
  const comment = db.prepare("SELECT * FROM post_comments WHERE id = ? AND user_uid = ?").get(commentId, userUid);
  if (!comment) throw new Error('评论不存在或无权删除');
  db.prepare("DELETE FROM post_comments WHERE id = ?").run(commentId);
};

const getComment = (id) => {
  return db.prepare(
    `SELECT pc.*, u.username, u.avatar
     FROM post_comments pc JOIN users u ON pc.user_uid = u.uid
     WHERE pc.id = ?`
  ).get(id);
};

module.exports = {
  createPost,
  getPost,
  getFeed,
  getUserPosts,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
};
