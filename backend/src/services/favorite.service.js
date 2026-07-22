const db = require('../models/database');
const { generateId } = require('../utils/crypto');

// 添加收藏
const addFavorite = (userUid, favType, favId, title = '', subtitle = '', url = '', icon = '') => {
  const existing = db.prepare("SELECT id FROM favorites WHERE user_uid = ? AND fav_type = ? AND fav_id = ?").get(userUid, favType, favId);
  if (existing) throw new Error('已收藏');

  const id = generateId();
  db.prepare(
    "INSERT INTO favorites (id, user_uid, fav_type, fav_id, title, subtitle, url, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, userUid, favType, favId, title, subtitle, url, icon, new Date().toISOString());

  return { id, fav_type: favType, fav_id: favId, title, subtitle, url, icon };
};

// 取消收藏
const removeFavorite = (userUid, favType, favId) => {
  db.prepare("DELETE FROM favorites WHERE user_uid = ? AND fav_type = ? AND fav_id = ?").run(userUid, favType, favId);
};

// 获取收藏列表
const getFavorites = (userUid, type = null) => {
  if (type) {
    return db.prepare("SELECT * FROM favorites WHERE user_uid = ? AND fav_type = ? ORDER BY created_at DESC").all(userUid, type);
  }
  return db.prepare("SELECT * FROM favorites WHERE user_uid = ? ORDER BY created_at DESC").all(userUid);
};

// 检查是否已收藏
const isFavorited = (userUid, favType, favId) => {
  return !!db.prepare("SELECT id FROM favorites WHERE user_uid = ? AND fav_type = ? AND fav_id = ?").get(userUid, favType, favId);
};

module.exports = { addFavorite, removeFavorite, getFavorites, isFavorited };
