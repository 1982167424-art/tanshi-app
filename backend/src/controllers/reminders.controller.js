const remindersService = require('../services/reminders.service');
const { success, fail } = require('../utils/response');

const getReminders = (req, res, next) => {
  try {
    const reminders = remindersService.getRemindersByUser(req.user.uid);
    return success(res, { reminders }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const createReminder = (req, res, next) => {
  try {
    const reminder = remindersService.createReminder({ ...req.body, userUid: req.user.uid });
    return success(res, { reminder }, '创建成功');
  } catch (err) {
    next(err);
  }
};

const updateReminder = (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = remindersService.updateReminder(id, req.user.uid, req.body);
    if (!reminder) return fail(res, '未找到该提醒', 404);
    return success(res, { reminder }, '更新成功');
  } catch (err) {
    next(err);
  }
};

const deleteReminder = (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = remindersService.deleteReminder(id, req.user.uid);
    if (!reminder) return fail(res, '未找到该提醒', 404);
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };
