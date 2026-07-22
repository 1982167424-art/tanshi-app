const statusService = require('../services/status.service');
const { success, fail } = require('../utils/response');

const createStatus = (req, res, next) => {
  try {
    const { content, emoji, background } = req.body;
    if (!content || !content.trim()) return fail(res, '内容不能为空');
    const status = statusService.createStatus(req.user.uid, content.trim(), emoji || '', background || '');
    return success(res, { status }, '状态已发布');
  } catch (err) { next(err); }
};

const getFriendStatuses = (req, res, next) => {
  try {
    const statuses = statusService.getFriendStatuses(req.user.uid);
    return success(res, { statuses });
  } catch (err) { next(err); }
};

const getUserStatuses = (req, res, next) => {
  try {
    const { uid } = req.params;
    const statuses = statusService.getUserStatuses(uid);
    return success(res, { statuses });
  } catch (err) { next(err); }
};

const deleteStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    statusService.deleteStatus(id, req.user.uid);
    return success(res, null, '已删除状态');
  } catch (err) { next(err); }
};

module.exports = { createStatus, getFriendStatuses, getUserStatuses, deleteStatus };
