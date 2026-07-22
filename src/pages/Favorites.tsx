import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Trash2, ExternalLink, Calendar, NotebookPen, Repeat, Heart, Gamepad2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { api } from '@/utils/api';
import { Favorite } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  note: <NotebookPen size={18} className="text-blue-500" />,
  day: <Calendar size={18} className="text-orange-500" />,
  habit: <Repeat size={18} className="text-green-500" />,
  mood: <Heart size={18} className="text-pink-500" />,
  entertainment: <Gamepad2 size={18} className="text-purple-500" />,
  learning: <BookOpen size={18} className="text-indigo-500" />,
  link: <ExternalLink size={18} className="text-gray-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  note: '笔记', day: '日子', habit: '习惯', mood: '心情', entertainment: '娱乐', learning: '学习', link: '链接', platform: '第三方平台',
};

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { loadFavorites(); }, [filterType]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favs = await api.favorites.getAll(filterType || undefined);
      setFavorites(favs);
    } catch {}
    setLoading(false);
  };

  const handleRemove = async (favType: string, favId: string) => {
    await api.favorites.remove(favType, favId);
    setFavorites(favorites.filter(f => !(f.fav_type === favType && f.fav_id === favId)));
    setConfirmDelete(null);
  };

  const types = [
    { key: '', label: '全部' },
    { key: 'note', label: '笔记' },
    { key: 'day', label: '日子' },
    { key: 'habit', label: '习惯' },
    { key: 'mood', label: '心情' },
    { key: 'entertainment', label: '娱乐' },
    { key: 'learning', label: '学习' },
    { key: 'link', label: '链接' },
    { key: 'platform', label: '第三方' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 mb-4 font-serif text-sm">
        <ArrowLeft size={16} /> 返回
      </button>
      <h1 className="text-2xl font-serif font-bold text-amber-900 mb-4 dark:text-gray-100">我的收藏</h1>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {types.map(t => (
          <button key={t.key} onClick={() => setFilterType(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-serif transition-all ${filterType === t.key ? 'bg-orange-500 text-white' : 'bg-white/50 text-orange-600 hover:bg-orange-100 dark:bg-white/10 dark:text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : favorites.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-orange-500 font-serif dark:text-gray-400">暂无收藏</p></GlassCard>
      ) : (
        <div className="space-y-2">
          {favorites.map(fav => (
            <GlassCard key={`${fav.fav_type}-${fav.fav_id}`} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {TYPE_ICONS[fav.fav_type] || <Star size={18} className="text-yellow-500" />}
                <div>
                  <p className="font-serif font-semibold text-sm text-amber-900 dark:text-gray-100">{fav.title || fav.fav_id}</p>
                  {fav.subtitle && <p className="text-xs text-amber-500 dark:text-gray-400">{fav.subtitle}</p>}
                  <p className="text-xs text-amber-400 dark:text-gray-500">{TYPE_LABELS[fav.fav_type] || fav.fav_type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {fav.url && <a href={fav.url} target="_blank" rel="noopener" className="p-1 text-orange-400 hover:text-orange-600"><ExternalLink size={14} /></a>}
                <button onClick={() => setConfirmDelete(`${fav.fav_type}::${fav.fav_id}`)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">取消收藏</h4>
            <p className="text-orange-700 font-serif mb-4 dark:text-gray-300">确定要取消收藏吗？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={() => { const idx = confirmDelete.indexOf('::'); const t = confirmDelete.slice(0, idx); const id = confirmDelete.slice(idx + 2); handleRemove(t, id); }} className="flex-1">确定</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Favorites;
