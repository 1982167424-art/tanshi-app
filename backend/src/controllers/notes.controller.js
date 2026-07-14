const notesService = require('../services/notes.service');
const { success, fail } = require('../utils/response');

const getNotes = (req, res, next) => {
  try {
    const notes = notesService.getNotesByUser(req.user.uid);
    return success(res, { notes }, '获取成功');
  } catch (err) {
    next(err);
  }
};

const createNote = (req, res, next) => {
  try {
    const note = notesService.createNote({ ...req.body, userUid: req.user.uid });
    return success(res, { note }, '创建成功');
  } catch (err) {
    next(err);
  }
};

const updateNote = (req, res, next) => {
  try {
    const { id } = req.params;
    const note = notesService.updateNote(id, req.user.uid, req.body);
    if (!note) return fail(res, '未找到该笔记', 404);
    return success(res, { note }, '更新成功');
  } catch (err) {
    next(err);
  }
};

const deleteNote = (req, res, next) => {
  try {
    const { id } = req.params;
    const note = notesService.deleteNote(id, req.user.uid);
    if (!note) return fail(res, '未找到该笔记', 404);
    return success(res, null, '已删除');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
