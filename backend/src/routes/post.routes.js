const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/post.controller');

router.use(authRequired);

// 发布帖子（支持图片/视频上传，最多9张图片+1个视频）
router.post('/', upload.array('images', 9), ctrl.createPost);

// 获取好友信息流
router.get('/feed', ctrl.getFeed);

// 获取用户帖子
router.get('/user/:uid', ctrl.getUserPosts);

// 删除帖子
router.delete('/:id', ctrl.deletePost);

// 点赞/取消点赞
router.post('/:id/like', ctrl.toggleLike);

// 评论
router.get('/:id/comments', ctrl.getComments);
router.post('/:id/comments', ctrl.addComment);
router.delete('/comments/:id', ctrl.deleteComment);

module.exports = router;
