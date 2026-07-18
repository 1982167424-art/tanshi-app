import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, NotebookPen, Repeat, Heart, TrendingUp, Clock, Sun, Sparkles, MessageCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';
import { useCheckinStore } from '@/store/useCheckinStore';
import { getGreeting, formatDate, getDaysDiff, getDaysSince } from '@/utils/date';
import { getDailyQuote } from '@/utils/quotes';
import EntertainmentSheet from '@/pages/Entertainment';
import LearningSheet from '@/pages/Learning';
import CheckinModal from '@/components/CheckinModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getUserDays } = useDaysStore();
  const { getUserNotes } = useNotesStore();
  const { getUserHabits, isChecked: isHabitChecked, getStreak } = useHabitsStore();
  const { getTodayMood, getUserMoods } = useMoodStore();
  const { getUserConversations } = useCompanionStore();
  const { status, loadStatus, checkin, isCheckingIn } = useCheckinStore();

  const [showEntertainment, setShowEntertainment] = useState(false);
  const [showLearning, setShowLearning] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const days = getUserDays();
  const notes = getUserNotes();
  const habits = getUserHabits();
  const todayMood = getTodayMood();
  const moods = getUserMoods();
  const conversations = getUserConversations();

  const isTeen = currentUser?.isTeenMode;
  const greeting = getGreeting();
  const quote = getDailyQuote();

  const todayCheckedCount = habits.filter(h => isHabitChecked(h.id)).length;
  const totalStreak = habits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);
  const daysSinceJoin = currentUser ? getDaysSince(currentUser.createdAt) : 0;

  const goodMoodCount = moods.filter(m => m.moodType === 'good').length;

  const upcomingDays = days
    .filter(d => d.type === 'anniversary' || d.type === 'countdown')
    .map(d => ({ ...d, daysDiff: getDaysDiff(d.targetDate) }))
    .sort((a, b) => a.daysDiff - b.daysDiff)
    .slice(0, 3);

  const quickEntries: { emoji: string; label: string; color: string; path?: string; onClick?: () => void }[] = [
    { emoji: '📅', label: '日子', path: '/days', color: 'from-amber-400 to-orange-400' },
    { emoji: '📝', label: '笔记', path: '/notes', color: 'from-blue-400 to-cyan-400' },
    { emoji: '✅', label: '习惯', path: '/habits', color: 'from-green-400 to-emerald-400' },
    { emoji: '😊', label: '心情', path: '/mood', color: 'from-pink-400 to-rose-400' },
    { emoji: '🎮', label: '娱乐', onClick: () => setShowEntertainment(true), color: 'from-purple-400 to-fuchsia-400' },
    { emoji: '📚', label: '学习', onClick: () => setShowLearning(true), color: 'from-indigo-400 to-blue-400' },
  ];

  const handleCheckin = async () => {
    const result = await checkin();
    if (result) setCheckinResult(result);
  };

  const moodEmoji: Record<string, string> = { good: '😊', normal: '😐', bad: '😢' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 问候 */}
      <GlassCard className={`p-6 bg-gradient-to-r ${isTeen ? 'from-orange-100/80 to-amber-100/80' : 'from-amber-100/80 to-yellow-100/80'} dark:from-[#0f3460]/40 dark:to-[#16213e]/40`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-1 dark:text-gray-100">{greeting}，{currentUser?.username}！☀️</h2>
            <p className="text-amber-700 font-serif text-sm dark:text-gray-300">今天是 {formatDate(new Date())}，已陪伴你 {daysSinceJoin} 天</p>
          </div>
          <Sun size={48} className={isTeen ? 'text-orange-400' : 'text-amber-400'} />
        </div>
      </GlassCard>

      {/* 每日一言 */}
      <GlassCard className="p-5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-[#0f3460]/30 dark:to-[#16213e]/30">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-amber-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-serif italic leading-relaxed dark:text-gray-200">"{quote.text}"</p>
            {quote.author && <p className="text-xs text-amber-600 mt-1 font-serif dark:text-gray-400">—— {quote.author}</p>}
          </div>
        </div>
      </GlassCard>

      {/* 签到卡片 */}
      <GlassCard className="p-5 bg-gradient-to-r from-amber-400 to-orange-400 text-white cursor-pointer" hover onClick={handleCheckin}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-serif font-bold">{status?.checked_in_today ? '今日已签到 ✓' : '每日签到'}</p>
            <p className="text-sm opacity-80 font-serif">
              {status?.checked_in_today ? `连续 ${status.streak_days} 天 · ${status.total_points} 积分` : '签到获取积分，解锁称号'}
            </p>
          </div>
          <div className="text-3xl">{status?.checked_in_today ? '✅' : '🎯'}</div>
        </div>
      </GlassCard>

      {/* 快捷入口 */}
      <div className="grid grid-cols-3 gap-3">
        {quickEntries.map((entry, i) => (
          <GlassCard key={i} hover className="p-4 text-center" onClick={entry.onClick || (() => navigate(entry.path!))}>
            <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-md`}>
              <span className="text-2xl">{entry.emoji}</span>
            </div>
            <p className="text-sm font-serif font-medium text-amber-900 dark:text-gray-100">{entry.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-3">
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-amber-900 dark:text-gray-100">{totalStreak}</p>
          <p className="text-xs text-amber-600 font-serif dark:text-gray-400">🔥 连续打卡</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-amber-900 dark:text-gray-100">{goodMoodCount}</p>
          <p className="text-xs text-amber-600 font-serif dark:text-gray-400">😊 开心天数</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-amber-900 dark:text-gray-100">{notes.length}</p>
          <p className="text-xs text-amber-600 font-serif dark:text-gray-400">📝 笔记</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-amber-900 dark:text-gray-100">{status?.total_points || 0}</p>
          <p className="text-xs text-amber-600 font-serif dark:text-gray-400">⭐ 积分</p>
        </GlassCard>
      </div>

      {/* 今日概览 + 即将到来 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-base font-serif font-semibold text-amber-900 mb-3 flex items-center gap-2 dark:text-gray-100">
            <TrendingUp size={18} className="text-amber-500" /> 今日概览
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 text-sm font-serif dark:text-gray-300">📝 笔记</span>
              <span className="font-bold text-amber-900 dark:text-gray-100">{notes.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 text-sm font-serif dark:text-gray-300">✅ 习惯</span>
              <span className="font-bold text-amber-900 dark:text-gray-100">{todayCheckedCount}/{habits.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 text-sm font-serif dark:text-gray-300">😊 心情</span>
              <span className="text-xl">{todayMood ? moodEmoji[todayMood.moodType] : '—'}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
              <Clock size={18} className="text-amber-500" /> 即将到来
            </h3>
            <button onClick={() => navigate('/days')} className="text-xs text-amber-600 dark:text-gray-400">全部 →</button>
          </div>
          {upcomingDays.length === 0 ? (
            <p className="text-center text-amber-500 text-sm py-6 font-serif dark:text-gray-400">还没有日子记录</p>
          ) : (
            <div className="space-y-2">
              {upcomingDays.map(d => (
                <div key={d.id} className="flex justify-between items-center p-2 rounded-lg bg-amber-50/70 dark:bg-[#0f3460]/30 cursor-pointer" onClick={() => navigate('/days')}>
                  <span className="text-sm font-serif text-amber-900 dark:text-gray-100">{d.title}</span>
                  <span className={`text-sm font-bold ${d.daysDiff === 0 ? 'text-orange-500' : 'text-amber-700 dark:text-gray-300'}`}>
                    {d.daysDiff === 0 ? '今天' : `${d.daysDiff}天`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* 青少年陪伴 */}
      {isTeen && (
        <GlassCard className="p-5 bg-gradient-to-r from-orange-100/70 to-pink-100/70 cursor-pointer dark:from-[#0f3460]/40 dark:to-[#16213e]/40" hover onClick={() => navigate('/companion')}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-2xl shadow-lg">🌈</div>
            <div className="flex-1">
              <h3 className="font-serif font-semibold text-orange-900 dark:text-gray-100">暖心小助手在等你</h3>
              <p className="text-xs text-orange-700 font-serif dark:text-gray-300">不管开心还是难过，都可以来和我说说～</p>
            </div>
            <span className="text-orange-400">→</span>
          </div>
        </GlassCard>
      )}

      {/* 底部面板 */}
      <EntertainmentSheet visible={showEntertainment} onClose={() => setShowEntertainment(false)} />
      <LearningSheet visible={showLearning} onClose={() => setShowLearning(false)} />
      <CheckinModal result={checkinResult} visible={!!checkinResult} onClose={() => setCheckinResult(null)} />
    </div>
  );
};

export default Home;
