import React, { useState, useRef } from 'react';
import { Heart, BarChart3, Calendar, Camera, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useMoodStore } from '@/store/useMoodStore';
import { MoodType } from '@/types';
import { formatDate } from '@/utils/date';

const moods: { type: MoodType; emoji: string; label: string; color: string; bgColor: string }[] = [
  { type: 'good', emoji: '😊', label: '很好', color: 'text-green-600', bgColor: 'from-green-200 to-emerald-200' },
  { type: 'normal', emoji: '😐', label: '一般', color: 'text-amber-600', bgColor: 'from-amber-200 to-yellow-200' },
  { type: 'bad', emoji: '😢', label: '不好', color: 'text-blue-600', bgColor: 'from-blue-200 to-cyan-200' },
];

const Mood: React.FC = () => {
  const { getTodayMood, updateTodayMood, getMoodStats, getMoodHeatmap } = useMoodStore();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const todayMood = getTodayMood();
  const stats = getMoodStats();
  const heatmap = getMoodHeatmap(30);

  const handleMoodClick = (type: MoodType) => {
    setSelectedMood(type);
    setMoodNote(todayMood?.note || '');
    setShowDetailModal(true);
  };

  const handleSaveMood = () => {
    if (selectedMood) {
      updateTodayMood(selectedMood, moodNote);
      setShowDetailModal(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `探时-心情卡片-${formatDate(new Date())}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('生成图片失败', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const total = stats.total || 1;
  const goodPercent = Math.round((stats.good / total) * 100);
  const normalPercent = Math.round((stats.normal / total) * 100);
  const badPercent = Math.round((stats.bad / total) * 100);

  const getHeatmapDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const mood = heatmap.find(m => m.date === dateStr);
      days.push({ date: dateStr, mood: mood?.moodType });
    }
    return days;
  };

  const heatmapDays = getHeatmapDays();

  const getMoodScore = (moodType?: MoodType) => {
    switch (moodType) {
      case 'good': return 3;
      case 'normal': return 2;
      case 'bad': return 1;
      default: return 0;
    }
  };

  const getWeeklyMoodData = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const mood = heatmap.find(m => m.date === dateStr);
      days.push({ date: dateStr, score: getMoodScore(mood?.moodType), mood: mood?.moodType });
    }
    return days;
  };

  const weeklyMoodData = getWeeklyMoodData();

  const getMoodColor = (moodType?: MoodType) => {
    switch (moodType) {
      case 'good': return 'bg-gradient-to-br from-green-300 to-emerald-400';
      case 'normal': return 'bg-gradient-to-br from-amber-300 to-yellow-400';
      case 'bad': return 'bg-gradient-to-br from-blue-300 to-cyan-400';
      default: return 'bg-amber-100';
    }
  };

  const currentMoodInfo = moods.find(m => m.type === todayMood?.moodType);
  const todayFormatted = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
            <Heart size={20} className="text-pink-500" />
            今天的心情怎么样？
          </h3>
          {todayMood && (
            <Button size="sm" variant="secondary" onClick={() => setShowShareModal(true)}>
              <Camera size={16} className="mr-1.5" />
              生成分享卡片
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {moods.map((mood) => {
            const isSelected = todayMood?.moodType === mood.type;
            return (
              <button
                key={mood.type}
                onClick={() => handleMoodClick(mood.type)}
                className={`
                  p-6 rounded-2xl transition-all duration-300 transform hover:scale-105
                  ${isSelected
                    ? `bg-gradient-to-br ${mood.bgColor} shadow-lg scale-105`
                    : 'bg-white/60 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:border-white/10 dark:hover:bg-[#0f3460]/60'
                  }
                `}
              >
                <div className="text-5xl mb-3">{mood.emoji}</div>
                <p className={`font-serif font-medium ${mood.color}`}>{mood.label}</p>
              </button>
            );
          })}
        </div>

        {todayMood?.note && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-[#0f3460]/30 dark:border-white/10">
            <p className="text-sm text-amber-600 font-serif mb-1 dark:text-gray-400">今日心情笔记：</p>
            <p className="text-amber-800 font-serif dark:text-gray-200">{todayMood.note}</p>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 mb-6 dark:text-gray-100">
          <BarChart3 size={20} className="text-amber-500 dark:text-amber-400" />
          心情统计
        </h3>

        {stats.total === 0 ? (
          <div className="text-center py-8">
            <p className="text-amber-600 font-serif dark:text-gray-400">还没有心情记录，快来记录第一条吧～</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-amber-900 dark:text-gray-100">{stats.total}</p>
                <p className="text-sm text-amber-600 font-serif dark:text-gray-400">总记录</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-green-600">{stats.good}</p>
                <p className="text-sm text-amber-600 font-serif dark:text-gray-400">好心情</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-amber-600">{stats.normal}</p>
                <p className="text-sm text-amber-600 font-serif dark:text-gray-400">一般</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-blue-600">{stats.bad}</p>
                <p className="text-sm text-amber-600 font-serif dark:text-gray-400">不好</p>
              </div>
            </div>

            <div className="h-6 rounded-full overflow-hidden bg-amber-100 flex dark:bg-[#0f3460]/30">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${goodPercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
                style={{ width: `${normalPercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${badPercent}%` }}
              />
            </div>

            <div className="flex justify-center gap-6 text-sm font-serif">
              <span className="flex items-center gap-1.5 text-green-600">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400" />
                好 {goodPercent}%
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
                一般 {normalPercent}%
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                差 {badPercent}%
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-amber-100 dark:border-white/10">
              <h4 className="text-sm font-serif font-medium text-amber-700 mb-4 dark:text-gray-300">📈 本周心情趋势</h4>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyMoodData.map((day, index) => {
                  const dayName = ['日', '一', '二', '三', '四', '五', '六'][new Date(day.date).getDay()];
                  const height = day.score > 0 ? (day.score / 3) * 100 : 0;
                  const mood = moods.find(m => m.type === day.mood);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        <div
                          className={`w-8 rounded-t-xl transition-all duration-500 hover:scale-110 ${day.mood ? `bg-gradient-to-t ${mood?.bgColor}` : 'bg-amber-200/50 dark:bg-white/10'}`}
                          style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                        />
                      </div>
                      <span className="text-xs font-serif text-amber-600 dark:text-gray-400">{dayName}</span>
                      {day.mood && (
                        <span className="text-lg">{mood?.emoji}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 mb-6 dark:text-gray-100">
          <Calendar size={20} className="text-amber-500 dark:text-amber-400" />
          近30天心情热力图
        </h3>

        <div className="grid grid-cols-10 gap-1.5">
          {heatmapDays.map((day, index) => (
            <div
              key={day.date}
              className={`aspect-square rounded-lg ${getMoodColor(day.mood)} transition-all hover:scale-110 cursor-pointer`}
              title={`${day.date}${day.mood ? ` - ${moods.find(m => m.type === day.mood)?.label}` : ''}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-amber-600 font-serif dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-amber-100 dark:bg-[#0f3460]/30" />
            无记录
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-green-300 to-emerald-400" />
            好
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-amber-300 to-yellow-400" />
            一般
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-blue-300 to-cyan-400" />
            不好
          </span>
        </div>
      </GlassCard>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="记录今日心情"
      >
        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            {moods.map((mood) => (
              <button
                key={mood.type}
                onClick={() => setSelectedMood(mood.type)}
                className={`
                  p-4 rounded-2xl transition-all duration-200 transform
                  ${selectedMood === mood.type
                    ? `bg-gradient-to-br ${mood.bgColor} scale-110 shadow-lg`
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-[#0f3460]/30 dark:hover:bg-[#0f3460]/50'
                  }
                `}
              >
                <div className="text-4xl">{mood.emoji}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
              想说点什么？（可选）
            </label>
            <textarea
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="记录一下今天的心情吧..."
              className="w-full px-4 py-3 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none h-28 text-gray-400 placeholder:text-gray-300 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDetailModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSaveMood} className="flex-1" disabled={!selectedMood}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="心情分享卡片"
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className="relative w-[320px] h-[320px] rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fed7aa 60%, #fbcfe8 100%)',
              }}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-300/30 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-pink-300/30 blur-2xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-yellow-300/20 blur-3xl" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-between h-full p-8">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">⏰</span>
                  <span className="font-serif font-bold text-amber-900/80 text-lg tracking-wide">探时</span>
                </div>

                {/* Mood */}
                <div className="flex flex-col items-center">
                  <div className="text-7xl mb-3 drop-shadow-sm">
                    {currentMoodInfo?.emoji}
                  </div>
                  <p className="text-2xl font-serif font-bold text-amber-900 mb-1">
                    今天心情{currentMoodInfo?.label}
                  </p>
                  {todayMood?.note && (
                    <p className="text-sm text-amber-800/70 font-serif text-center line-clamp-2 max-w-[240px] px-2">
                      "{todayMood.note}"
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-amber-800/50 font-serif tracking-widest uppercase">
                    Mood Diary
                  </p>
                  <p className="text-sm text-amber-900/70 font-serif">
                    {todayFormatted}
                  </p>
                </div>
              </div>

              {/* Glassmorphism border */}
              <div className="absolute inset-0 rounded-3xl border border-white/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowShareModal(false)} className="flex-1">
              关闭
            </Button>
            <Button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="flex-1"
            >
              <Download size={16} className="mr-1.5" />
              {isGenerating ? '生成中...' : '下载卡片'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Mood;
