const moodsService = require('../services/moods.service');
const { success, fail } = require('../utils/response');

const getMoods = (req, res, next) => {
  try {
    const moods = moodsService.getMoodsByUser(req.user.uid);
    return success(res, { moods }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const createMood = (req, res, next) => {
  try {
    const mood = moodsService.createMood({ ...req.body, userUid: req.user.uid });
    return success(res, { mood }, '创建成功');
  } catch (err) {
    next(err);
  }
};

const updateMood = (req, res, next) => {
  try {
    const { id } = req.params;
    const mood = moodsService.updateMood(id, req.user.uid, req.body);
    if (!mood) return fail(res, '未找到该心情', 404);
    return success(res, { mood }, '更新成功');
  } catch (err) {
    next(err);
  }
};

const deleteMood = (req, res, next) => {
  try {
    const { id } = req.params;
    const mood = moodsService.deleteMood(id, req.user.uid);
    if (!mood) return fail(res, '未找到该心情', 404);
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMoods, createMood, updateMood, deleteMood };
