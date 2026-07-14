const trashService = require('../services/trash.service');
const { success, fail } = require('../utils/response');

const getTrash = (req, res, next) => {
  try {
    const trash = trashService.getTrashByUser(req.user.uid);
    return success(res, { trash }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const restoreItem = (req, res, next) => {
  try {
    const { id } = req.params;
    const item = trashService.restoreItem(id, req.user.uid);
    if (!item) return fail(res, '未找到该回收站项目', 404);
    return success(res, item.data, '已恢复');
  } catch (err) {
    next(err);
  }
};

const deleteItem = (req, res, next) => {
  try {
    const { id } = req.params;
    const item = trashService.deleteItem(id, req.user.uid);
    if (!item) return fail(res, '未找到该回收站项目', 404);
    return success(res, null, '已永久删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTrash, restoreItem, deleteItem };
