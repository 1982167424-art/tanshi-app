import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Smile } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useStatusStore } from '@/store/useStatusStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/utils/date';

const STATUS_EMOJIS = ['😊', '😢', '😴', '🎉', '💪', '🤔', '❤️', '🌈', '🔥', '⭐'];
const STATUS_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  '#ffffff',
];

const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { friendStatuses, loadFriendStatuses, createStatus, deleteStatus } = useStatusStore();
  const currentUser = useAuthStore(s => s.currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedBg, setSelectedBg] = useState(STATUS_BACKGROUNDS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { loadFriendStatuses(); }, []);

  const handlePublish = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setPublishError('');
    try {
      await createStatus(content.trim(), selectedEmoji, selectedBg);
      setContent('');
      setSelectedEmoji('');
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      setPublishError(e instanceof Error ? e.message : '发布失败，请稍后重试');
    }
    setSubmitting(false);
  };

  const myStatuses = friendStatuses.filter(s => s.user_uid === currentUser?.uid);
  const friendStatusesFiltered = friendStatuses.filter(s => s.user_uid !== currentUser?.uid);

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-amber-900 dark:text-gray-100">状态</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <><X size={16} /> 取消</> : <><Plus size={16} /> 发状态</>}
        </Button>
      </div>

      {showCreate && (
        <GlassCard className="p-4 mb-4">
          <div className="rounded-xl p-4 mb-3" style={{ background: selectedBg }}>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="说点什么..." rows={3}
              className="w-full bg-transparent text-white placeholder:text-white/60 font-serif text-lg focus:outline-none resize-none" />
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Smile size={16} className="text-orange-500" />
            {STATUS_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                className={`text-lg p-1 rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-orange-200 scale-110' : 'hover:bg-orange-100'}`}>
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-1 mb-3">
            {STATUS_BACKGROUNDS.map((bg, idx) => (
              <button key={idx} onClick={() => setSelectedBg(bg)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{ background: bg, borderColor: selectedBg === bg ? '#f97316' : 'transparent' }} />
            ))}
          </div>
          <Button size="sm" onClick={handlePublish} disabled={submitting || !content.trim()} className="w-full">
            {submitting ? '发布中...' : '发布状态（24小时后自动消失）'}
          </Button>
          {publishError && (
            <p className="mt-3 text-xs text-red-500 font-serif text-center">{publishError}</p>
          )}
        </GlassCard>
      )}

      {myStatuses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-serif font-semibold text-orange-600 mb-3 dark:text-gray-400">我的状态</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {myStatuses.map(s => (
              <div key={s.id} className="relative flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center text-2xl cursor-pointer shadow-md"
                style={{ background: s.background }}
                onClick={() => setConfirmDelete(s.id)}>
                {s.emoji || s.content[0]}
                <button className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"><X size={10} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {friendStatusesFiltered.length > 0 ? (
        <div>
          <h2 className="text-sm font-serif font-semibold text-orange-600 mb-3 dark:text-gray-400">好友状态</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {friendStatusesFiltered.map(s => (
              <div key={s.id} className="relative flex-shrink-0 w-24 rounded-xl overflow-hidden shadow-md cursor-pointer"
                style={{ background: s.background }}>
                <div className="p-3 text-center">
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <p className="text-xs font-serif text-white line-clamp-2">{s.content}</p>
                  <p className="text-xs text-white/60 mt-1">{s.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !showCreate && (
        <GlassCard className="p-8 text-center">
          <p className="text-orange-500 font-serif dark:text-gray-400">还没有状态，发布一条吧</p>
        </GlassCard>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">删除状态</h4>
            <p className="text-orange-700 font-serif mb-4 dark:text-gray-300">确定要删除这条状态吗？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={async () => { await deleteStatus(confirmDelete); setConfirmDelete(null); }} className="flex-1">删除</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default StatusPage;
