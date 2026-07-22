const friendService = require('../services/friend.service');
const { success, fail } = require('../utils/response');

// 搜索用户
const searchUsers = (req, res, next) => {
  try {
    const { q, by } = req.query;
    if (!q) return fail(res, '请输入搜索内容');
    const users = friendService.searchUsers(q, by || 'uid');
    return success(res, { users });
  } catch (err) { next(err); }
};

// 获取用户公开资料
const getUserProfile = (req, res, next) => {
  try {
    const { uid } = req.params;
    const profile = friendService.getUserProfile(uid);
    if (!profile) return fail(res, '用户不存在', 404);

    // 附加好友状态
    const isFriend = friendService.areFriends(req.user.uid, uid);
    return success(res, { profile, isFriend });
  } catch (err) { next(err); }
};

// 发送好友申请
const sendRequest = (req, res, next) => {
  try {
    const { toUid, reason, permission } = req.body;
    if (!toUid) return fail(res, '缺少目标用户');
    const result = friendService.sendFriendRequest(req.user.uid, toUid, reason || '', permission || 'chat_only');
    return success(res, result, result.autoAccepted ? '已自动接受好友申请' : '申请已发送');
  } catch (err) {
    if (err.message.includes('不能添加自己') || err.message.includes('已经是好友') || err.message.includes('已经发送过')) {
      return fail(res, err.message);
    }
    next(err);
  }
};

// 获取收到的申请
const getReceivedRequests = (req, res, next) => {
  try {
    const requests = friendService.getReceivedRequests(req.user.uid);
    return success(res, { requests });
  } catch (err) { next(err); }
};

// 获取发出的申请
const getSentRequests = (req, res, next) => {
  try {
    const requests = friendService.getSentRequests(req.user.uid);
    return success(res, { requests });
  } catch (err) { next(err); }
};

// 回复申请
const replyRequest = (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply) return fail(res, '请输入回复内容');
    friendService.replyToRequest(id, req.user.uid, reply);
    return success(res, null, '回复成功');
  } catch (err) { next(err); }
};

// 接受申请
const acceptRequest = (req, res, next) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;
    friendService.acceptFriendRequest(id, req.user.uid, permission || 'chat_only');
    return success(res, null, '已接受好友申请');
  } catch (err) { next(err); }
};

// 拒绝申请
const rejectRequest = (req, res, next) => {
  try {
    const { id } = req.params;
    friendService.rejectFriendRequest(id, req.user.uid);
    return success(res, null, '已拒绝');
  } catch (err) { next(err); }
};

// 获取好友列表
const getFriends = (req, res, next) => {
  try {
    const friends = friendService.getFriends(req.user.uid);
    return success(res, { friends });
  } catch (err) { next(err); }
};

// 删除好友
const removeFriend = (req, res, next) => {
  try {
    const { uid } = req.params;
    friendService.removeFriend(req.user.uid, uid);
    return success(res, null, '已删除好友');
  } catch (err) { next(err); }
};

// 修改权限
const updatePermission = (req, res, next) => {
  try {
    const { uid } = req.params;
    const { permission } = req.body;
    if (!permission) return fail(res, '缺少权限参数');
    friendService.updateFriendPermission(req.user.uid, uid, permission);
    return success(res, null, '权限已更新');
  } catch (err) { next(err); }
};

// 获取未读数
const getUnreadCount = (req, res, next) => {
  try {
    const count = friendService.getUnreadCount(req.user.uid);
    return success(res, { count });
  } catch (err) { next(err); }
};

// 拉黑用户
const blockUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    friendService.blockUser(req.user.uid, uid);
    return success(res, null, '已拉黑');
  } catch (err) { next(err); }
};

// 取消拉黑
const unblockUser = (req, res, next) => {
  try {
    const { uid } = req.params;
    friendService.unblockUser(req.user.uid, uid);
    return success(res, null, '已取消拉黑');
  } catch (err) { next(err); }
};

// 获取黑名单
const getBlocklist = (req, res, next) => {
  try {
    const list = friendService.getBlocklist(req.user.uid);
    return success(res, { list });
  } catch (err) { next(err); }
};

module.exports = {
  searchUsers,
  getUserProfile,
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  replyRequest,
  acceptRequest,
  rejectRequest,
  getFriends,
  removeFriend,
  updatePermission,
  getUnreadCount,
  blockUser,
  unblockUser,
  getBlocklist,
};
