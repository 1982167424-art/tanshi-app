const daysService = require('../services/days.service');
const { success, fail } = require('../utils/response');

const getDays = (req, res, next) => {
  try {
    const days = daysService.getDaysByUser(req.user.uid);
    return success(res, { days }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const createDay = (req, res, next) => {
  try {
    const day = daysService.createDay({ ...req.body, userUid: req.user.uid });
    return success(res, { day }, '创建成功');
  } catch (err) {
    next(err);
  }
};

const updateDay = (req, res, next) => {
  try {
    const { id } = req.params;
    const day = daysService.updateDay(id, req.user.uid, req.body);
    if (!day) return fail(res, '未找到该日子', 404);
    return success(res, { day }, '更新成功');
  } catch (err) {
    next(err);
  }
};

const deleteDay = (req, res, next) => {
  try {
    const { id } = req.params;
    const day = daysService.deleteDay(id, req.user.uid);
    if (!day) return fail(res, '未找到该日子', 404);
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDays, createDay, updateDay, deleteDay };
