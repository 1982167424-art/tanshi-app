import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit3, FileText, CheckSquare, Lightbulb, Coffee } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useNotesStore } from '@/store/useNotesStore';
import { NoteCategory, Note } from '@/types';
import { formatDateTime } from '@/utils/date';

const categories: { category: NoteCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { category: 'note', label: '笔记', icon: <FileText size={18} />, color: 'from-blue-400 to-cyan-400' },
  { category: 'todo', label: '待办', icon: <CheckSquare size={18} />, color: 'from-green-400 to-emerald-400' },
  { category: 'inspiration', label: '灵感', icon: <Lightbulb size={18} />, color: 'from-yellow-400 to-amber-400' },
  { category: 'life', label: '生活', icon: <Coffee size={18} />, color: 'from-pink-400 to-rose-400' },
];

const Notes: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<NoteCategory | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<NoteCategory>('note');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { getUserNotes, addNote, deleteNote, updateNote, searchNotes } = useNotesStore();

  const allNotes = getUserNotes();
  let displayNotes = allNotes;

  if (searchKeyword) {
    displayNotes = searchNotes(searchKeyword);
  } else if (activeCategory !== 'all') {
    displayNotes = allNotes.filter(n => n.category === activeCategory);
  }

  const openAddModal = () => {
    setEditingNote(null);
    setNewTitle('');
    setNewContent('');
    setNewCategory(activeCategory === 'all' ? 'note' : activeCategory);
    setShowAddModal(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setNewCategory(note.category);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!newTitle.trim()) return;

    if (editingNote) {
      updateNote(editingNote.id, {
        title: newTitle.trim(),
        content: newContent,
        category: newCategory,
      });
    } else {
      addNote({
        category: newCategory,
        title: newTitle.trim(),
        content: newContent,
      });
    }

    setShowAddModal(false);
  };

  const getCategoryInfo = (category: NoteCategory) => {
    return categories.find(c => c.category === category)!;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 dark:text-amber-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full pl-12 pr-4 py-3 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-2xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-400 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2.5 rounded-xl font-serif whitespace-nowrap transition-all duration-200 ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
              : 'bg-white/60 text-amber-700 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:text-gray-300 dark:hover:bg-[#0f3460]/60 dark:border-white/10'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-serif whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.category
                ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                : 'bg-white/60 text-amber-700 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:text-gray-300 dark:hover:bg-[#0f3460]/60 dark:border-white/10'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {displayNotes.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">
            {searchKeyword ? '没有找到相关笔记' : '还没有笔记'}
          </h3>
          <p className="text-amber-600 font-serif mb-6 dark:text-gray-400">
            {searchKeyword ? '换个关键词试试吧～' : '记录下你的想法和灵感吧～'}
          </p>
          {!searchKeyword && (
            <Button onClick={openAddModal}>
              <Plus size={18} /> 写笔记
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayNotes.map((note) => {
            const catInfo = getCategoryInfo(note.category);
            return (
              <GlassCard
                key={note.id}
                hover
                className="p-5 cursor-pointer group"
                onClick={() => openEditModal(note)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${catInfo.color} flex items-center justify-center text-white shadow-sm`}>
                      {catInfo.icon}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-[#0f3460]/30 dark:text-gray-300">
                      {catInfo.label}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(note.id);
                    }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-amber-400 hover:text-red-500 transition-all dark:hover:bg-red-900/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h4 className="font-serif font-semibold text-amber-900 text-lg mb-2 line-clamp-1 dark:text-gray-100">
                  {note.title}
                </h4>

                {note.content && (
                  <p className="text-sm text-amber-700 font-serif line-clamp-3 mb-3 leading-relaxed dark:text-gray-300">
                    {note.content}
                  </p>
                )}

                <p className="text-xs text-amber-500 font-serif dark:text-gray-500">
                  更新于 {formatDateTime(note.updatedAt)}
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}

      <button
        onClick={openAddModal}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingNote ? '编辑笔记' : '新建笔记'}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setNewCategory(cat.category)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-serif transition-all ${
                  newCategory === cat.category
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <Input
            label="标题"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="给笔记起个标题"
          />

          <div>
            <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
              内容
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="写下你的想法..."
              className="w-full px-4 py-3 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none h-48 text-gray-400 placeholder:text-gray-300 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!newTitle.trim()}>
              {editingNote ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-3">🗑️</div>
          <p className="text-amber-800 font-serif mb-6 dark:text-gray-200">确定要删除这条笔记吗？删除后无法恢复。</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (showDeleteConfirm) deleteNote(showDeleteConfirm);
                setShowDeleteConfirm(null);
              }}
              className="flex-1"
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Notes;
