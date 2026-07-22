const express = require('express');
const router = express.Router();
const { authRequired: auth } = require('../middleware/auth');
const ctrl = require('../controllers/friend.controller');

// 搜索用户
router.get('/search', auth, ctrl.searchUsers);

// 获取用户公开资料
router.get('/profile/:uid', auth, ctrl.getUserProfile);

// 好友申请
router.post('/request', auth, ctrl.sendRequest);
router.get('/requests/received', auth, ctrl.getReceivedRequests);
router.get('/requests/sent', auth, ctrl.getSentRequests);
router.post('/requests/:id/reply', auth, ctrl.replyRequest);
router.post('/requests/:id/accept', auth, ctrl.acceptRequest);
router.post('/requests/:id/reject', auth, ctrl.rejectRequest);

// 好友管理
router.get('/', auth, ctrl.getFriends);
router.delete('/:uid', auth, ctrl.removeFriend);
router.put('/:uid/permission', auth, ctrl.updatePermission);

// 黑名单
router.post('/block/:uid', auth, ctrl.blockUser);
router.delete('/block/:uid', auth, ctrl.unblockUser);
router.get('/blocklist', auth, ctrl.getBlocklist);

// 未读数
router.get('/unread', auth, ctrl.getUnreadCount);

module.exports = router;
