const messageService = require('../services/message.service');
const { getFileUrl } = require('../middleware/upload');
const { success, fail } = require('../utils/response');

const sendMessage = async (req, res, next) => {
  try {
    const { toUid, content, msgType, extra } = req.body;
    if (!toUid) return fail(res, '缺少接收方');

    let finalContent = content || '';
    let finalType = msgType || 'text';
    let finalExtra = extra || '{}';

    // 如果是图片/文件消息，处理上传的文件
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      const fileUrl = getFileUrl(file.filename);
      finalContent = fileUrl;
      finalType = file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'file';
      finalExtra = JSON.stringify({ filename: file.originalname, size: file.size, mimetype: file.mimetype });
    }

    if (!finalContent && finalType === 'text') return fail(res, '消息内容不能为空');

    const msg = messageService.sendMessage(req.user.uid, toUid, finalContent, finalType, finalExtra);
    return success(res, { message: msg }, '发送成功');
  } catch (err) {
    if (err.message.includes('只能给好友')) return fail(res, err.message);
    next(err);
  }
};

const getMessages = (req, res, next) => {
  try {
    const { friendUid } = req.params;
    const page = parseInt(req.query.page) || 1;
    const messages = messageService.getMessages(req.user.uid, friendUid, page);
    return success(res, { messages });
  } catch (err) { next(err); }
};

const getChatList = (req, res, next) => {
  try {
    const list = messageService.getChatList(req.user.uid);
    return success(res, { list });
  } catch (err) { next(err); }
};

module.exports = { sendMessage, getMessages, getChatList };
