import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, NotebookPen, CheckSquare, Lightbulb, Coffee,
  Calendar, Hourglass, Clock, Timer, Zap, Repeat,
  Command,
} from 'lucide-react';
import { useNotesStore } from '@/store/useNotesStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { NoteCategory, DayType } from '@/types';
import { formatDateTime } from '@/utils/date';

type SearchFilter = 'all' | 'note' | 'day' | 'habit';

interface SearchResultItem {
  id: string;
  type: 'note' | 'day' | 'habit';
  subType?: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  url: string;
}

interface SearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

const filterLabels: Record<SearchFilter, string> = {
  all: '全部',
  note: '笔记',
  day: '日子',
  habit: '习惯',
};

const fuzzyMatch = (text: string, query: string): boolean => {
  if (!text) return false;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
};

const getNoteMeta = (category: NoteCategory) => {
  switch (category) {
    case 'note': return { label: '笔记', color: 'from-blue-400 to-cyan-400', Icon: NotebookPen };
    case 'todo': return { label: '备忘录', color: 'from-green-400 to-emerald-400', Icon: CheckSquare };
    case 'inspiration': return { label: '灵感', color: 'from-yellow-400 to-amber-400', Icon: Lightbulb };
    case 'life': return { label: '生活', color: 'from-pink-400 to-rose-400', Icon: Coffee };
    default: return { label: '笔记', color: 'from-blue-400 to-cyan-400', Icon: NotebookPen };
  }
};

const getDayMeta = (type: DayType) => {
  switch (type) {
    case 'anniversary': return { label: '纪念日', color: 'from-pink-400 to-rose-400', Icon: Calendar };
    case 'countdown': return { label: '倒计日', color: 'from-amber-400 to-orange-400', Icon: Hourglass };
    case 'past': return { label: '过去日', color: 'from-blue-400 to-cyan-400', Icon: Clock };
    case 'timer': return { label: '倒计时', color: 'from-green-400 to-emerald-400', Icon: Timer };
    case 'minicountdown': return { label: '小倒数', color: 'from-purple-400 to-violet-400', Icon: Zap };
    default: return { label: '日子', color: 'from-amber-400 to-orange-400', Icon: Calendar };
  }
};

const SearchModal: React.FC<SearchModalProps> = ({ isOpen = false, onClose, inline = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const { getUserNotes } = useNotesStore();
  const { getUserDays } = useDaysStore();
  const { getUserHabits } = useHabitsStore();

  const notes = getUserNotes();
  const days = getUserDays();
  const habits = getUserHabits();

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    if (filter === 'all' || filter === 'note') {
      notes.forEach((note) => {
        if (fuzzyMatch(note.title, q) || fuzzyMatch(note.content, q)) {
          const meta = getNoteMeta(note.category);
          items.push({
            id: note.id,
            type: 'note',
            subType: note.category,
            title: note.title,
            subtitle: `${meta.label} · ${note.content.slice(0, 50) || '无内容'}`,
            updatedAt: note.updatedAt,
            url: '/notes',
          });
        }
      });
    }

    if (filter === 'all' || filter === 'day') {
      days.forEach((day) => {
        if (fuzzyMatch(day.title, q) || fuzzyMatch(day.note, q)) {
          const meta = getDayMeta(day.type);
          items.push({
            id: day.id,
            type: 'day',
            subType: day.type,
            title: day.title,
            subtitle: `${meta.label} · ${day.targetDate}${day.note ? ' · ' + day.note.slice(0, 30) : ''}`,
            updatedAt: day.createdAt,
            url: '/days',
          });
        }
      });
    }

    if (filter === 'all' || filter === 'habit') {
      habits.forEach((habit) => {
        if (fuzzyMatch(habit.name, q) || fuzzyMatch(habit.emoji, q)) {
          items.push({
            id: habit.id,
            type: 'habit',
            title: habit.name,
            subtitle: `${habit.emoji} 习惯`,
            updatedAt: habit.createdAt,
            url: '/habits',
          });
        }
      });
    }

    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [query, filter, notes, days, habits]);

  const handleResultClick = (url: string) => {
    navigate(url);
    if (!inline && onClose) onClose();
  };

  useEffect(() => {
    if (!inline && isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose?.();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [inline, isOpen, onClose]);

  const renderIcon = (item: SearchResultItem) => {
    if (item.type === 'note' && item.subType) {
      const { Icon } = getNoteMeta(item.subType as NoteCategory);
      return <Icon size={18} />;
    }
    if (item.type === 'day' && item.subType) {
      const { Icon } = getDayMeta(item.subType as DayType);
      return <Icon size={18} />;
    }
    if (item.type === 'habit') {
      return <Repeat size={18} />;
    }
    return <Search size={18} />;
  };

  const renderColor = (item: SearchResultItem) => {
    if (item.type === 'note' && item.subType) {
      return getNoteMeta(item.subType as NoteCategory).color;
    }
    if (item.type === 'day' && item.subType) {
      return getDayMeta(item.subType as DayType).color;
    }
    return 'from-amber-400 to-orange-400';
  };

  const content = (
    <div className="w-full">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索笔记、备忘录、日子、习惯..."
          className="w-full pl-12 pr-12 py-3.5 font-serif bg-white/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-amber-900 placeholder:text-amber-300 dark:bg-[#1a1a2e]/80 dark:border-white/10 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-amber-400 dark:focus:ring-amber-400/30"
        />
        {!inline && onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 transition-colors dark:hover:bg-white/10 dark:text-gray-400"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {(Object.keys(filterLabels) as SearchFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-serif text-sm whitespace-nowrap transition-all duration-200 ${
              filter === f
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                : 'bg-white/60 text-amber-700 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:text-gray-300 dark:hover:bg-[#0f3460]/60 dark:border-white/10'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {query.trim() && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-amber-700 font-serif dark:text-gray-300">没有找到相关内容</p>
            <p className="text-sm text-amber-500 font-serif mt-1 dark:text-gray-400">换个关键词试试吧</p>
          </div>
        )}

        {results.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => handleResultClick(item.url)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/60 hover:bg-white/80 border border-amber-100/50 hover:border-amber-200 transition-all text-left group dark:bg-[#16213e]/60 dark:hover:bg-[#0f3460]/60 dark:border-white/10 dark:hover:border-white/20"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${renderColor(
                item
              )} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
            >
              {renderIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-semibold text-amber-900 truncate group-hover:text-amber-800 dark:text-gray-100 dark:group-hover:text-gray-200">
                {item.title}
              </h4>
              <p className="text-sm text-amber-600 truncate font-serif dark:text-gray-400">
                {item.subtitle}
              </p>
            </div>
            <span className="text-xs text-amber-400 font-serif flex-shrink-0 hidden sm:block dark:text-gray-500">
              {formatDateTime(item.updatedAt)}
            </span>
          </button>
        ))}

        {!query.trim() && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-amber-700 font-serif dark:text-gray-300">输入关键词开始搜索</p>
            <p className="text-sm text-amber-500 font-serif mt-1 dark:text-gray-400">支持笔记、备忘录、日子、习惯</p>
          </div>
        )}
      </div>

      {!inline && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-amber-400 font-serif dark:text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-sans text-[10px] dark:bg-[#0f3460]/50 dark:text-gray-400">
              <Command size={10} className="inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-sans text-[10px] dark:bg-[#0f3460]/50 dark:text-gray-400">K</kbd>
            <span>打开搜索</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-sans text-[10px] dark:bg-[#0f3460]/50 dark:text-gray-400">ESC</kbd>
            <span>关闭</span>
          </span>
        </div>
      )}
    </div>
  );

  if (inline) {
    return <div className="animate-fade-in">{content}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
      <div
        className="absolute inset-0 bg-amber-900/20 backdrop-blur-sm animate-fade-in dark:bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl animate-bounce-in">
        <div className="backdrop-blur-xl bg-white/85 border border-white/50 rounded-3xl shadow-2xl shadow-amber-200/50 p-5 dark:bg-[#16213e]/90 dark:border-white/10 dark:shadow-black/30">
          {content}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
