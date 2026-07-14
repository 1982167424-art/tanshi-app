const express = require('express');
const router = express.Router();
const { getUser, updateUser, changePassword, deleteUser } = require('../controllers/user.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/users/:uid - 获取用户
router.get('/:uid', getUser);

// PUT /api/users/:uid - 更新用户
router.put('/:uid', updateUser);

// PUT /api/users/:uid/password - 修改密码
router.put('/:uid/password', changePassword);

// DELETE /api/users/:uid - 删除用户
router.delete('/:uid', deleteUser);

module.exports = router;
