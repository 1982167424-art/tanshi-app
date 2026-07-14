import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, NotebookPen, Repeat, Heart, TrendingUp, Clock, Sun, Sparkles, MessageCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';
import { getGreeting, formatDate, getDaysDiff, getDaysSince } from '@/utils/date';
import { getDailyQuote } from '@/utils/quotes';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getUserDays } = useDaysStore();
  const { getUserNotes } = useNotesStore();
  const { getUserHabits, isChecked: isHabitChecked, getStreak } = useHabitsStore();
  const { getTodayMood, getUserMoods } = useMoodStore();
  const { getUserConversations } = useCompanionStore();

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
  const normalMoodCount = moods.filter(m => m.moodType === 'normal').length;
  const badMoodCount = moods.filter(m => m.moodType === 'bad').length;

  const upcomingDays = days
    .filter(d => d.type === 'anniversary' || d.type === 'countdown')
    .map(d => ({
      ...d,
      daysDiff: getDaysDiff(d.targetDate)
    }))
    .sort((a, b) => a.daysDiff - b.daysDiff)
    .slice(0, 3);

  const quickEntries = [
    { icon: CalendarDays, label: '日子', path: '/days', color: 'from-amber-400 to-orange-400' },
    { icon: NotebookPen, label: '笔记', path: '/notes', color: 'from-blue-400 to-cyan-400' },
    { icon: Repeat, label: '习惯', path: '/habits', color: 'from-green-400 to-emerald-400' },
    { icon: Heart, label: '心情', path: '/mood', color: 'from-pink-400 to-rose-400' },
  ];

  const moodEmoji = {
    good: '😊',
    normal: '😐',
    bad: '😢',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className={`p-6 lg:p-8 bg-gradient-to-r ${isTeen ? 'from-orange-100/80 to-amber-100/80 dark:from-[#0f3460]/40 dark:to-[#16213e]/40' : 'from-amber-100/80 to-yellow-100/80 dark:from-[#0f3460]/40 dark:to-[#16213e]/40'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-serif font-bold text-amber-900 mb-2 dark:text-gray-100">
              {greeting}，{currentUser?.username}！☀️
            </h2>
            <p className="text-amber-700 font-serif dark:text-gray-300">
              今天是 {formatDate(new Date())}，愿你今天也有好心情～
            </p>
            <p className="text-sm text-amber-600 font-serif mt-2 dark:text-gray-400">
              已陪伴你度过 <span className="font-bold">{daysSinceJoin}</span> 天
            </p>
          </div>
          <div className="text-6xl animate-float">
            <Sun className={isTeen ? 'text-orange-400' : 'text-amber-400'} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-[#0f3460]/30 dark:to-[#16213e]/30">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-amber-500 mt-1 flex-shrink-0 dark:text-amber-400" />
          <div>
            <p className="text-amber-800 font-serif italic text-lg leading-relaxed dark:text-gray-200">
              "{quote.text}"
            </p>
            {quote.author && (
              <p className="text-sm text-amber-600 font-serif mt-2 dark:text-gray-400">
                —— {quote.author}
              </p>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickEntries.map((entry, index) => (
          <GlassCard
            key={entry.path}
            hover
            onClick={() => navigate(entry.path)}
            className="p-5 text-center"
          >
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-lg`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <entry.icon size={28} className="text-white" />
            </div>
            <p className="font-serif font-medium text-amber-900 dark:text-gray-100">{entry.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center dark:bg-[#0f3460]/30">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-serif dark:text-gray-400">最长连续打卡</p>
              <p className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">{totalStreak}天</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center dark:bg-[#0f3460]/30">
              <span className="text-xl">😊</span>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-serif dark:text-gray-400">开心天数</p>
              <p className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">{goodMoodCount}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center dark:bg-[#0f3460]/30">
              <span className="text-xl">📝</span>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-serif dark:text-gray-400">笔记总数</p>
              <p className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">{notes.length}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center dark:bg-[#0f3460]/30">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-serif dark:text-gray-400">暖心对话</p>
              <p className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">{conversations.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
              <TrendingUp size={20} className="text-amber-500 dark:text-amber-400" />
              今日概览
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 font-serif dark:text-gray-300">📝 笔记数量</span>
              <span className="text-lg font-serif font-bold text-amber-900 dark:text-gray-100">{notes.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 font-serif dark:text-gray-300">✅ 今日习惯</span>
              <span className="text-lg font-serif font-bold text-amber-900 dark:text-gray-100">
                {todayCheckedCount} / {habits.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 font-serif dark:text-gray-300">😊 今日心情</span>
              <span className="text-2xl">
                {todayMood ? moodEmoji[todayMood.moodType] : '还没记录'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-[#0f3460]/30">
              <span className="text-amber-800 font-serif dark:text-gray-300">⏰ 日子数</span>
              <span className="text-lg font-serif font-bold text-amber-900 dark:text-gray-100">{days.length}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
              <Clock size={20} className="text-amber-500 dark:text-amber-400" />
              即将到来
            </h3>
            <button
              onClick={() => navigate('/days')}
              className="text-sm text-amber-600 hover:text-amber-800 font-serif transition-colors dark:text-gray-400 dark:hover:text-gray-200"
            >
              查看全部 →
            </button>
          </div>

          {upcomingDays.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-amber-600 font-serif dark:text-gray-400">还没有日子记录</p>
              <button
                onClick={() => navigate('/days')}
                className="mt-3 text-amber-600 hover:text-amber-800 font-serif text-sm underline dark:text-gray-400 dark:hover:text-gray-200"
              >
                添加第一个日子
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all cursor-pointer dark:from-[#0f3460]/30 dark:to-[#16213e]/30 dark:hover:from-[#0f3460]/50 dark:hover:to-[#16213e]/50"
                  onClick={() => navigate('/days')}
                >
                  <div>
                    <p className="font-serif font-medium text-amber-900 dark:text-gray-100">{day.title}</p>
                    <p className="text-xs text-amber-600 dark:text-gray-400">{day.targetDate}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-serif font-bold ${
                      day.daysDiff === 0 ? 'text-orange-500' : 'text-amber-700 dark:text-gray-300'
                    }`}>
                      {day.daysDiff === 0 ? '今天' : `${day.daysDiff}天`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {isTeen && (
        <GlassCard
          className="p-6 bg-gradient-to-r from-orange-100/70 to-pink-100/70 cursor-pointer hover:shadow-xl transition-all duration-300 dark:from-[#0f3460]/40 dark:to-[#16213e]/40"
          hover
          onClick={() => navigate('/companion')}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-3xl shadow-lg animate-float">
              🌈
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-serif font-semibold text-orange-900 mb-1 dark:text-gray-100">
                暖心小助手在等你
              </h3>
              <p className="text-sm text-orange-700 font-serif dark:text-gray-300">
                不管开心还是难过，都可以来和我说说呀～ 我会一直陪着你的 💛
              </p>
            </div>
            <div className="text-orange-400 text-2xl dark:text-amber-400">→</div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Home;
