const favoriteService = require('../services/favorite.service');
const { success, fail } = require('../utils/response');

const addFavorite = (req, res, next) => {
  try {
    const { favType, favId, title, subtitle, url, icon } = req.body;
    if (!favType || !favId) return fail(res, '缺少参数');
    const fav = favoriteService.addFavorite(req.user.uid, favType, favId, title || '', subtitle || '', url || '', icon || '');
    return success(res, { favorite: fav }, '收藏成功');
  } catch (err) {
    if (err.message === '已收藏') return fail(res, err.message);
    next(err);
  }
};

const removeFavorite = (req, res, next) => {
  try {
    const { favType, favId } = req.params;
    favoriteService.removeFavorite(req.user.uid, favType, favId);
    return success(res, null, '已取消收藏');
  } catch (err) { next(err); }
};

const getFavorites = (req, res, next) => {
  try {
    const { type } = req.query;
    const favorites = favoriteService.getFavorites(req.user.uid, type || null);
    return success(res, { favorites });
  } catch (err) { next(err); }
};

module.exports = { addFavorite, removeFavorite, getFavorites };
