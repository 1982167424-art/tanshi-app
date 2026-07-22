const express = require('express');
const router = express.Router();
const { authRequired: auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/message.controller');

router.use(auth);

// 聊天列表
router.get('/', ctrl.getChatList);

// 与好友的聊天记录
router.get('/:friendUid', ctrl.getMessages);

// 发送消息（支持图片/视频/文件上传）
router.post('/', upload.single('file'), ctrl.sendMessage);

module.exports = router;
