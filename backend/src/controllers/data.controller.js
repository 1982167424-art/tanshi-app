const dataService = require('../services/data.service');
const { success, fail } = require('../utils/response');

// 导出当前用户所有数据
const exportData = (req, res, next) => {
  try {
    const data = dataService.exportData(req.user.uid);
    return success(res, data, '导出成功');
  } catch (err) {
    next(err);
  }
};

// 导入数据（合并模式）
const importData = (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') return fail(res, '数据格式错误');
    const stats = dataService.importData(req.user.uid, data);
    return success(res, stats, '导入成功');
  } catch (err) {
    next(err);
  }
};

// 全局搜索
const search = (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return fail(res, '搜索关键词不能为空');
    const results = dataService.search(req.user.uid, q.trim());
    return success(res, results, '搜索成功');
  } catch (err) {
    next(err);
  }
};

module.exports = { exportData, importData, search };
