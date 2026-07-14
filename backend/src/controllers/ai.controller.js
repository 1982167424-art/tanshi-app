const aiService = require('../services/ai.service');
const { success } = require('../utils/response');

// AI 对话
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const response = await aiService.chat(message);
    return success(res, { response }, '操作成功');
  } catch (err) {
    next(err);
  }
};

// AI 心情分析
const analysis = async (req, res, next) => {
  try {
    const { moodData } = req.body;
    const result = await aiService.analysis(moodData);
    return success(res, { analysis: result }, '操作成功');
  } catch (err) {
    next(err);
  }
};

module.exports = { chat, analysis };
