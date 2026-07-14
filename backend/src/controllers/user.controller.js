const userService = require('../services/user.service');
const { sign } = require('../utils/jwt');
const { success, fail } = require('../utils/response');

// 获取用户（只能获取自己的信息）
const getUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    if (req.user.uid !== uid) return fail(res, '无权访问该用户', 403);
    const user = userService.getUserByUid(uid);
    if (!user) return fail(res, '用户不存在', 404);
    return success(res, { user }, '获取成功');
  } catch (err) {
    next(err);
  }
};

// 更新用户（只能更新自己的信息，修改username时返回新token）
const updateUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    if (req.user.uid !== uid) return fail(res, '无权修改该用户', 403);
    const user = userService.updateUser(uid, req.body);
    if (!user) return fail(res, '用户不存在', 404);

    let token;
    if (req.body.username !== undefined) {
      token = sign({ uid: user.uid, username: user.username });
    }

    return success(res, { user, ...(token ? { token } : {}) }, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 修改密码
const changePassword = (req, res, next) => {
  try {
    const { uid } = req.params;
    if (req.user.uid !== uid) return fail(res, '无权修改该用户', 403);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return fail(res, '请提供原密码和新密码');
    userService.changePassword(uid, oldPassword, newPassword);
    return success(res, null, '密码修改成功');
  } catch (err) {
    next(err);
  }
};

// 删除用户（只能删除自己的账号）
const deleteUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    if (req.user.uid !== uid) return fail(res, '无权删除该用户', 403);
    const deleted = userService.deleteUser(uid);
    if (!deleted) return fail(res, '用户不存在', 404);
    return success(res, null, '用户及所有数据已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUser, updateUser, changePassword, deleteUser };
