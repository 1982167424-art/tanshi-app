import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, Calendar, Clock, Hourglass, Timer, Zap } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useDaysStore } from '@/store/useDaysStore';
import { DayType, Day } from '@/types';
import { formatSeconds, getDaysDiff, getNextAnniversary } from '@/utils/date';

const dayTypes: { type: DayType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'anniversary', label: '纪念日', icon: <Calendar size={18} />, color: 'from-pink-400 to-rose-400' },
  { type: 'countdown', label: '倒计日', icon: <Hourglass size={18} />, color: 'from-amber-400 to-orange-400' },
  { type: 'past', label: '过去日', icon: <Clock size={18} />, color: 'from-blue-400 to-cyan-400' },
  { type: 'timer', label: '倒计时', icon: <Timer size={18} />, color: 'from-green-400 to-emerald-400' },
  { type: 'minicountdown', label: '小倒数', icon: <Zap size={18} />, color: 'from-purple-400 to-violet-400' },
];

const Days: React.FC = () => {
  const [activeType, setActiveType] = useState<DayType>('anniversary');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSeconds, setNewSeconds] = useState(300);
  const [newNote, setNewNote] = useState('');
  
  const { getUserDays, addDay, deleteDay, startTimer, pauseTimer, resetTimer, tickTimer } = useDaysStore();
  
  const days = getUserDays().filter(d => d.type === activeType);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      const runningDays = getUserDays().filter(d => d.type === 'timer' && d.isRunning);
      runningDays.forEach(day => {
        const finished = tickTimer(day.id);
        if (finished) {
          playAlarm();
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [getUserDays, tickTimer]);

  const playAlarm = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Alarm not supported');
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;

    addDay({
      type: activeType,
      title: newTitle.trim(),
      targetDate: newDate || new Date().toISOString().split('T')[0],
      note: newNote,
      countdownSeconds: newSeconds,
      initialSeconds: newSeconds,
      isRunning: false,
    });

    setNewTitle('');
    setNewDate('');
    setNewSeconds(300);
    setNewNote('');
    setShowAddModal(false);
  };

  const renderDayCard = (day: Day) => {
    const typeInfo = dayTypes.find(t => t.type === day.type)!;
    const daysDiff = getDaysDiff(day.targetDate);

    return (
      <GlassCard key={day.id} className="p-5 hover:shadow-xl transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center text-white shadow-md`}>
              {typeInfo.icon}
            </div>
            <div>
              <h4 className="font-serif font-semibold text-amber-900 dark:text-gray-100">{day.title}</h4>
              <p className="text-xs text-amber-600 dark:text-gray-400">{typeInfo.label}</p>
            </div>
          </div>
          <button
            onClick={() => deleteDay(day.id)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-amber-400 hover:text-red-500 transition-colors dark:hover:bg-red-900/30"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {day.type === 'timer' || day.type === 'minicountdown' ? (
          <div className="mt-4">
            <div className={`text-4xl font-serif font-bold text-center py-4 bg-gradient-to-r ${typeInfo.color} bg-clip-text text-transparent`}>
              {formatSeconds(day.countdownSeconds)}
            </div>
            <div className="flex justify-center gap-3 mt-3">
              {day.isRunning ? (
                <Button size="sm" variant="secondary" onClick={() => pauseTimer(day.id)}>
                  <Pause size={16} /> 暂停
                </Button>
              ) : (
                <Button size="sm" onClick={() => startTimer(day.id)}>
                  <Play size={16} /> 开始
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => resetTimer(day.id)}>
                <RotateCcw size={16} /> 重置
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-serif font-bold ${
                daysDiff === 0 ? 'text-orange-500' : 'text-amber-800 dark:text-gray-300'
              }`}>
                {daysDiff === 0 ? '今天' : Math.abs(daysDiff) + '天'}
              </span>
              <span className="text-sm text-amber-600 dark:text-gray-400">
                {day.type === 'past' ? '已经过去了' : daysDiff > 0 ? '还有' : '已过去'}
              </span>
            </div>
            <p className="text-sm text-amber-600 mt-1 dark:text-gray-400">
              日期：{day.targetDate}
              {day.type === 'anniversary' && ` （下次：${getNextAnniversary(day.targetDate)}）`}
            </p>
          </div>
        )}

        {day.note && (
          <p className="mt-3 text-sm text-amber-700 font-serif bg-amber-50/50 p-3 rounded-xl dark:text-gray-300 dark:bg-[#0f3460]/30">
            💭 {day.note}
          </p>
        )}
      </GlassCard>
    );
  };

  const showDateInput = activeType !== 'timer' && activeType !== 'minicountdown';
  const showTimeInput = activeType === 'timer' || activeType === 'minicountdown';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dayTypes.map((type) => (
          <button
            key={type.type}
            onClick={() => setActiveType(type.type)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-serif whitespace-nowrap
              transition-all duration-200
              ${activeType === type.type
                ? `bg-gradient-to-r ${type.color} text-white shadow-md`
                : 'bg-white/60 text-amber-700 hover:bg-white/80 border border-amber-200/50 dark:bg-[#16213e]/60 dark:text-gray-300 dark:hover:bg-[#0f3460]/60 dark:border-white/10'
              }
            `}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {days.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">
            还没有{dayTypes.find(t => t.type === activeType)?.label}
          </h3>
          <p className="text-amber-600 font-serif mb-6 dark:text-gray-400">
            点击右下角按钮添加你的第一个记录吧～
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> 添加
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map(renderDayCard)}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`添加${dayTypes.find(t => t.type === activeType)?.label}`}
      >
        <div className="space-y-4">
          <Input
            label="标题"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="给它取个名字吧"
          />

          {showDateInput && (
            <Input
              label="日期"
              type="date"
              value={newDate}
              onChange={setNewDate}
            />
          )}

          {showTimeInput && (
            <div>
              <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
                倒计时（秒）
              </label>
              <div className="flex gap-2 mb-2">
                {[60, 300, 600, 1800].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setNewSeconds(sec)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-serif transition-colors ${
                      newSeconds === sec
                        ? 'bg-amber-400 text-white'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                    }`}
                  >
                    {sec < 60 ? `${sec}秒` : `${sec / 60}分钟`}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={String(newSeconds)}
                onChange={(v) => setNewSeconds(Math.max(0, parseInt(v) || 0))}
                placeholder="自定义秒数"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
              备注（可选）
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="想说点什么..."
              className="w-full px-4 py-2.5 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none h-24 text-gray-400 placeholder:text-gray-300 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleAdd} className="flex-1" disabled={!newTitle.trim()}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Days;
