const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/status.controller');

router.use(authRequired);

// 发布状态
router.post('/', ctrl.createStatus);

// 获取好友状态
router.get('/friends', ctrl.getFriendStatuses);

// 获取用户状态
router.get('/user/:uid', ctrl.getUserStatuses);

// 删除状态
router.delete('/:id', ctrl.deleteStatus);

module.exports = router;
