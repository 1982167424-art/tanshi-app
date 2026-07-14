import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, CalendarDays, NotebookPen, Repeat, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { DeletedItem, Day, Note, Habit } from '@/types';
import { formatDateTime, getDaysDiff } from '@/utils/date';

const moodsMap: Record<string, { emoji: string; label: string }> = {
  good: { emoji: '😊', label: '很好' },
  normal: { emoji: '😐', label: '一般' },
  bad: { emoji: '😢', label: '不好' },
};

const Trash: React.FC = () => {
  const {
    getUserDeletedDays,
    restoreDay,
    permanentlyDeleteDay,
  } = useDaysStore();
  const {
    getUserDeletedNotes,
    restoreNote,
    permanentlyDeleteNote,
  } = useNotesStore();
  const {
    getUserDeletedHabits,
    restoreHabit,
    permanentlyDeleteHabit,
  } = useHabitsStore();

  const [activeTab, setActiveTab] = useState<'all' | 'day' | 'note' | 'habit'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const deletedDays = getUserDeletedDays();
  const deletedNotes = getUserDeletedNotes();
  const deletedHabits = getUserDeletedHabits();

  const allItems: DeletedItem[] = [...deletedDays, ...deletedNotes, ...deletedHabits].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );

  const getFilteredItems = () => {
    if (activeTab === 'all') return allItems;
    return allItems.filter(item => item.type === activeTab);
  };

  const getDaysUntilExpiry = (deletedAt: string) => {
    const expiryDate = new Date(deletedAt);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const diff = getDaysDiff(formatDateTime(expiryDate).split(' ')[0]);
    return Math.max(0, diff);
  };

  const handleRestore = (item: DeletedItem) => {
    if (item.type === 'day') restoreDay(item.id);
    else if (item.type === 'note') restoreNote(item.id);
    else if (item.type === 'habit') restoreHabit(item.id);
    setRestoredId(item.id);
    setTimeout(() => setRestoredId(null), 2000);
  };

  const handlePermanentDelete = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    if (item.type === 'day') permanentlyDeleteDay(itemId);
    else if (item.type === 'note') permanentlyDeleteNote(itemId);
    else if (item.type === 'habit') permanentlyDeleteHabit(itemId);
    setConfirmDelete(null);
  };

  const tabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'day' as const, label: '日子' },
    { key: 'note' as const, label: '笔记' },
    { key: 'habit' as const, label: '习惯' },
  ];

  const renderItem = (item: DeletedItem) => {
    const daysLeft = getDaysUntilExpiry(item.deletedAt);
    const isRestored = restoredId === item.id;

    if (item.type === 'day') {
      const day = item.data as Day;
      return (
        <GlassCard key={item.id} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-sm">
                <CalendarDays size={16} />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-amber-900 dark:text-gray-100">{day.title}</h4>
              <p className="text-xs text-amber-600 dark:text-gray-400">日子 · {day.type === 'anniversary' ? '纪念日' : day.type === 'countdown' ? '倒计日' : day.type === 'past' ? '过去日' : day.type === 'timer' ? '倒计时' : '小倒数'}</p>
              </div>
            </div>
            <span className="text-xs text-amber-500 font-serif dark:text-gray-500">{daysLeft}天后过期</span>
          </div>
          <p className="text-sm text-amber-700 mb-3 dark:text-gray-300">日期：{day.targetDate}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleRestore(item)}>
              <RotateCcw size={14} className="mr-1" /> 恢复
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => setConfirmDelete(item.id)}>
              <Trash2 size={14} className="mr-1" /> 永久删除
            </Button>
          </div>
          {isRestored && (
            <p className="mt-2 text-xs text-green-600 font-serif text-center dark:text-green-400">已恢复到原位置</p>
          )}
        </GlassCard>
      );
    }

    if (item.type === 'note') {
      const note = item.data as Note;
      return (
        <GlassCard key={item.id} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white shadow-sm">
                <NotebookPen size={16} />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-amber-900 line-clamp-1 dark:text-gray-100">{note.title}</h4>
                <p className="text-xs text-amber-600 dark:text-gray-400">笔记 · {note.category === 'note' ? '笔记' : note.category === 'todo' ? '待办' : note.category === 'inspiration' ? '灵感' : '生活'}</p>
              </div>
            </div>
            <span className="text-xs text-amber-500 font-serif dark:text-gray-500">{daysLeft}天后过期</span>
          </div>
          {note.content && (
            <p className="text-sm text-amber-700 line-clamp-2 mb-3 font-serif dark:text-gray-300">{note.content}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleRestore(item)}>
              <RotateCcw size={14} className="mr-1" /> 恢复
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => setConfirmDelete(item.id)}>
              <Trash2 size={14} className="mr-1" /> 永久删除
            </Button>
          </div>
          {isRestored && (
            <p className="mt-2 text-xs text-green-600 font-serif text-center dark:text-green-400">已恢复到原位置</p>
          )}
        </GlassCard>
      );
    }

    if (item.type === 'habit') {
      const habit = item.data as Habit;
      return (
        <GlassCard key={item.id} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-sm">
                <Repeat size={16} />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-amber-900 dark:text-gray-100">{habit.name}</h4>
                <p className="text-xs text-amber-600 dark:text-gray-400">习惯</p>
              </div>
            </div>
            <span className="text-xs text-amber-500 font-serif dark:text-gray-500">{daysLeft}天后过期</span>
          </div>
          <p className="text-sm text-amber-700 mb-3 dark:text-gray-300">
            <span className="text-lg mr-1">{habit.emoji}</span>
            已打卡 {habit.checkDates.length} 天
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleRestore(item)}>
              <RotateCcw size={14} className="mr-1" /> 恢复
            </Button>
            <Button size="sm" variant="danger" className="flex-1" onClick={() => setConfirmDelete(item.id)}>
              <Trash2 size={14} className="mr-1" /> 永久删除
            </Button>
          </div>
          {isRestored && (
            <p className="mt-2 text-xs text-green-600 font-serif text-center dark:text-green-400">已恢复到原位置</p>
          )}
        </GlassCard>
      );
    }

    return null;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center text-white shadow-md">
            <Trash2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">回收站</h2>
            <p className="text-sm text-amber-600 font-serif dark:text-gray-400">
              共 {allItems.length} 项 · 30天后自动清理
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl font-serif whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                : 'bg-white/60 text-amber-700 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:text-gray-300 dark:hover:bg-[#0f3460]/60 dark:border-white/10'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-80">
              {tab.key === 'all'
                ? allItems.length
                : tab.key === 'day'
                ? deletedDays.length
                : tab.key === 'note'
                ? deletedNotes.length
                : deletedHabits.length}
            </span>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">🗑️</div>
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">
            回收站是空的
          </h3>
          <p className="text-amber-600 font-serif dark:text-gray-400">
            删除的内容会在这里保留30天
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(renderItem)}
        </div>
      )}

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="确认永久删除"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-3">
            <AlertTriangle size={48} className="mx-auto text-red-500" />
          </div>
          <p className="text-amber-800 font-serif mb-6 dark:text-gray-200">
            确定要永久删除这个项目吗？此操作不可恢复。
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handlePermanentDelete(confirmDelete)}
              className="flex-1"
            >
              永久删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trash;
