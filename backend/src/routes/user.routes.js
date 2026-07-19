const express = require('express');
const router = express.Router();
const { getUser, updateUser, changePassword, deleteUser } = require('../controllers/user.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// UID 格式验证（防枚举）：TS 前缀 + base36 字符
// generateUid 生成 TS + 14位（时间戳8位 + 随机6位），未来时间戳增长会变长，上限放宽到 20
const uidPattern = /^TS[A-Z0-9]{8,20}$/;
const validateUid = (req, res, next) => {
  if (!uidPattern.test(req.params.uid)) {
    return res.status(400).json({ success: false, message: '用户ID格式无效' });
  }
  next();
};

router.get('/:uid', validateUid, getUser);
router.put('/:uid', validateUid, updateUser);
router.put('/:uid/password', validateUid, changePassword);
router.delete('/:uid', validateUid, deleteUser);

module.exports = router;
