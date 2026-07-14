const habitsService = require('../services/habits.service');
const { success, fail } = require('../utils/response');

const getHabits = (req, res, next) => {
  try {
    const habits = habitsService.getHabitsByUser(req.user.uid);
    return success(res, { habits }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const createHabit = (req, res, next) => {
  try {
    const habit = habitsService.createHabit({ ...req.body, userUid: req.user.uid });
    return success(res, { habit }, '创建成功');
  } catch (err) {
    next(err);
  }
};

const updateHabit = (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = habitsService.updateHabit(id, req.user.uid, req.body);
    if (!habit) return fail(res, '未找到该习惯', 404);
    return success(res, { habit }, '更新成功');
  } catch (err) {
    next(err);
  }
};

const deleteHabit = (req, res, next) => {
  try {
    const { id } = req.params;
    const habit = habitsService.deleteHabit(id, req.user.uid);
    if (!habit) return fail(res, '未找到该习惯', 404);
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit };
