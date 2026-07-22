const postService = require('../services/post.service');
const { getFileUrl } = require('../middleware/upload');
const { success, fail } = require('../utils/response');

// 发布帖子
const createPost = async (req, res, next) => {
  try {
    const { content, visibility } = req.body;
    if (!content || !content.trim()) return fail(res, '内容不能为空');

    // 处理上传的图片
    const images = req.files
      ? req.files.filter(f => f.mimetype.startsWith('image/')).map(f => getFileUrl(f.filename))
      : [];

    // 处理上传的视频
    const videoFile = req.files?.find(f => f.mimetype.startsWith('video/'));
    const video = videoFile ? getFileUrl(videoFile.filename) : '';

    const post = postService.createPost(
      req.user.uid,
      content.trim(),
      JSON.stringify(images),
      video,
      visibility || 'friends'
    );
    return success(res, { post }, '发布成功');
  } catch (err) { next(err); }
};

// 获取信息流
const getFeed = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const posts = postService.getFeed(req.user.uid, page, limit);
    return success(res, { posts });
  } catch (err) { next(err); }
};

// 获取用户帖子
const getUserPosts = (req, res, next) => {
  try {
    const { uid } = req.params;
    const page = parseInt(req.query.page) || 1;
    const posts = postService.getUserPosts(uid, req.user.uid, page);
    return success(res, { posts });
  } catch (err) { next(err); }
};

// 删除帖子
const deletePost = (req, res, next) => {
  try {
    const { id } = req.params;
    postService.deletePost(id, req.user.uid);
    return success(res, null, '已删除');
  } catch (err) { next(err); }
};

// 点赞/取消点赞
const toggleLike = (req, res, next) => {
  try {
    const { id } = req.params;
    const liked = postService.toggleLike(id, req.user.uid);
    return success(res, { liked }, liked ? '已点赞' : '已取消点赞');
  } catch (err) { next(err); }
};

// 添加评论
const addComment = (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return fail(res, '评论内容不能为空');
    const comment = postService.addComment(id, req.user.uid, content.trim());
    return success(res, { comment }, '评论成功');
  } catch (err) { next(err); }
};

// 获取评论
const getComments = (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const comments = postService.getComments(id, page);
    return success(res, { comments });
  } catch (err) { next(err); }
};

// 删除评论
const deleteComment = (req, res, next) => {
  try {
    const { id } = req.params;
    postService.deleteComment(id, req.user.uid);
    return success(res, null, '已删除评论');
  } catch (err) { next(err); }
};

module.exports = { createPost, getFeed, getUserPosts, deletePost, toggleLike, addComment, getComments, deleteComment };
