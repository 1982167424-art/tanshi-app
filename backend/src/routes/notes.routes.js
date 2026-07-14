const express = require('express');
const router = express.Router();
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/notes.controller');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// GET /api/notes - 获取当前用户所有笔记
router.get('/', getNotes);

// POST /api/notes - 创建笔记
router.post('/', createNote);

// PUT /api/notes/:id - 更新笔记
router.put('/:id', updateNote);

// DELETE /api/notes/:id - 删除笔记
router.delete('/:id', deleteNote);

module.exports = router;
