// 成功响应
const success = (res, data = null, message = '操作成功') => {
  return res.json({ success: true, message, data });
};

// 失败响应
const fail = (res, message = '操作失败', status = 400) => {
  return res.status(status).json({ success: false, message });
};

module.exports = { success, fail };
