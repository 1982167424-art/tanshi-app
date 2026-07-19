import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, Calendar, Clock, Hourglass, Timer, Zap, AlarmClock, Bell, BellOff, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useDaysStore } from '@/store/useDaysStore';
import { useReminderStore } from '@/store/useReminderStore';
import { DayType, Day, ReminderFrequency } from '@/types';
import { formatSeconds, getDaysDiff, getNextAnniversary } from '@/utils/date';

type TabType = DayType | 'alarm';

const dayTypes: { type: TabType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'anniversary', label: '纪念日', icon: <Calendar size={18} />, color: 'from-pink-400 to-rose-400' },
  { type: 'countdown', label: '倒计日', icon: <Hourglass size={18} />, color: 'from-amber-400 to-orange-400' },
  { type: 'past', label: '过去日', icon: <Clock size={18} />, color: 'from-blue-400 to-cyan-400' },
  { type: 'timer', label: '倒计时', icon: <Timer size={18} />, color: 'from-green-400 to-emerald-400' },
  { type: 'minicountdown', label: '小倒数', icon: <Zap size={18} />, color: 'from-purple-400 to-violet-400' },
  { type: 'alarm', label: '闹钟', icon: <AlarmClock size={18} />, color: 'from-red-400 to-pink-400' },
];

const frequencyLabels: Record<ReminderFrequency, string> = {
  daily: '每天',
  weekdays: '工作日',
  weekends: '周末',
};

const frequencyOptions: { value: ReminderFrequency; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekdays', label: '工作日' },
  { value: 'weekends', label: '周末' },
];

const Days: React.FC = () => {
  const [activeType, setActiveType] = useState<TabType>('anniversary');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 日子相关 state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSeconds, setNewSeconds] = useState(300);
  const [newNote, setNewNote] = useState('');

  // 闹钟相关 state
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('08:00');
  const [alarmFrequency, setAlarmFrequency] = useState<ReminderFrequency>('daily');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const { getUserDays, addDay, deleteDay, startTimer, pauseTimer, resetTimer, tickTimer } = useDaysStore();
  const { reminders, addReminder, deleteReminder, toggleReminder } = useReminderStore();

  const days = getUserDays().filter(d => d.type === activeType);
  const timerRef = useRef<number | null>(null);

  // 闹钟 = habitId 为空的 reminder
  const alarms = useMemo(
    () => reminders.filter(r => !r.habitId).sort((a, b) => a.time.localeCompare(b.time)),
    [reminders]
  );

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

  // === 闹钟相关方法 ===
  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
  };

  const handleAddAlarm = async () => {
    if (!alarmTitle.trim() || !alarmTime) return;
    await addReminder({
      habitId: '',
      habitName: alarmTitle.trim(),
      habitEmoji: '⏰',
      time: alarmTime,
      frequency: alarmFrequency,
      enabled: true,
    });
    setAlarmTitle('');
    setAlarmTime('08:00');
    setAlarmFrequency('daily');
    setShowAddModal(false);
  };

  const handleDeleteAlarm = async (id: string) => {
    await deleteReminder(id);
    setShowDeleteConfirm(null);
  };

  const getNextRing = (alarm: { time: string; frequency: ReminderFrequency; enabled: boolean }) => {
    if (!alarm.enabled) return null;
    const now = new Date();
    const [h, m] = alarm.time.split(':').map(Number);
    const dayOfWeek = now.getDay();

    const matchesFrequency = (dow: number) => {
      if (alarm.frequency === 'daily') return true;
      if (alarm.frequency === 'weekdays') return dow >= 1 && dow <= 5;
      return dow === 0 || dow === 6;
    };

    for (let i = 0; i < 8; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(h, m, 0, 0);
      if (checkDate <= now) continue;
      if (!matchesFrequency(checkDate.getDay())) continue;
      const diffMs = checkDate.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 60) return `${diffMin} 分钟后`;
      if (diffMin < 1440) return `${Math.floor(diffMin / 60)} 小时后`;
      return `${Math.floor(diffMin / 1440)} 天后`;
    }
    return null;
  };

  // === 日子相关方法 ===
  const handleAddDay = () => {
    if (!newTitle.trim()) return;

    addDay({
      type: activeType as DayType,
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

  const handleAdd = () => {
    if (activeType === 'alarm') {
      handleAddAlarm();
    } else {
      handleAddDay();
    }
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

  const renderAlarmCard = (alarm: typeof alarms[0]) => {
    const nextRing = getNextRing(alarm);
    return (
      <GlassCard key={alarm.id} className="p-5 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleReminder(alarm.id)}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              alarm.enabled
                ? 'bg-gradient-to-br from-red-400 to-pink-400 text-white shadow-md'
                : 'bg-amber-100 text-amber-300 dark:bg-[#0f3460]/40 dark:text-gray-600'
            }`}
          >
            {alarm.enabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-serif font-bold tabular-nums ${
                alarm.enabled ? 'text-amber-900 dark:text-gray-100' : 'text-amber-300 dark:text-gray-600'
              }`}>
                {alarm.time}
              </span>
              <span className={`text-sm font-serif px-2 py-0.5 rounded-full ${
                alarm.enabled
                  ? 'bg-amber-100 text-amber-700 dark:bg-[#0f3460]/40 dark:text-amber-300'
                  : 'bg-amber-50 text-amber-300 dark:bg-transparent dark:text-gray-600'
              }`}>
                {frequencyLabels[alarm.frequency]}
              </span>
            </div>
            <p className={`font-serif mt-1 truncate ${
              alarm.enabled ? 'text-amber-700 dark:text-gray-300' : 'text-amber-400 dark:text-gray-600'
            }`}>
              {alarm.habitName || '闹钟'}
            </p>
            {alarm.enabled && nextRing && (
              <p className="text-xs text-amber-500 font-serif mt-0.5 dark:text-gray-500">
                下次响铃：{nextRing}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowDeleteConfirm(alarm.id)}
            className="flex-shrink-0 p-2 rounded-lg text-amber-400 hover:text-red-500 hover:bg-red-50 transition-all dark:text-gray-500 dark:hover:bg-red-900/20"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </GlassCard>
    );
  };

  const showDateInput = activeType !== 'timer' && activeType !== 'minicountdown' && activeType !== 'alarm';
  const showTimeInput = activeType === 'timer' || activeType === 'minicountdown';
  const isAlarmTab = activeType === 'alarm';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 闹钟通知权限提示 */}
      {isAlarmTab && permissionStatus !== 'granted' && (
        <GlassCard className="p-5 border-amber-300/60">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔔</div>
            <div className="flex-1">
              <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">
                {permissionStatus === 'denied'
                  ? '通知权限已被拒绝'
                  : '开启通知才能收到闹钟提醒'}
              </p>
              <p className="text-sm text-amber-600 font-serif dark:text-gray-400">
                {permissionStatus === 'denied'
                  ? '请在浏览器设置中允许 textime.top 发送通知，然后刷新页面'
                  : '闹钟到时间后会通过系统通知提醒你'}
              </p>
            </div>
            {permissionStatus === 'default' && (
              <Button size="sm" onClick={requestPermission}>
                <Bell size={16} className="mr-1.5" />
                开启通知
              </Button>
            )}
          </div>
        </GlassCard>
      )}

      {/* 标签栏 */}
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

      {/* 内容区 */}
      {isAlarmTab ? (
        alarms.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-xl font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">
              还没有闹钟
            </h3>
            <p className="text-amber-600 font-serif mb-6 dark:text-gray-400">
              添加一个闹钟，到点准时提醒你
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> 添加闹钟
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alarms.map(renderAlarmCard)}
          </div>
        )
      ) : days.length === 0 ? (
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

      {/* 浮动添加按钮 */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      {/* 添加 Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={isAlarmTab ? '添加闹钟' : `添加${dayTypes.find(t => t.type === activeType)?.label}`}
      >
        {isAlarmTab ? (
          /* 闹钟表单 */
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
                闹钟标题
              </label>
              <input
                type="text"
                value={alarmTitle}
                onChange={(e) => setAlarmTitle(e.target.value)}
                placeholder="比如：起床、看书、喝水..."
                maxLength={20}
                className="w-full px-4 py-3 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-700 placeholder:text-gray-300 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div>
              <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
                响铃时间
              </label>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full px-4 py-3 font-serif text-2xl tabular-nums bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-gray-700 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
                重复频率
              </label>
              <div className="grid grid-cols-3 gap-3">
                {frequencyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAlarmFrequency(opt.value)}
                    className={`py-3 rounded-xl font-serif font-medium transition-all duration-200 ${
                      alarmFrequency === opt.value
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md scale-105'
                        : 'bg-white/60 text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-[#0f3460]/40 dark:text-gray-300 dark:border-white/10 dark:hover:bg-[#0f3460]/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleAdd} className="flex-1" disabled={!alarmTitle.trim() || !alarmTime}>
                <Check size={16} className="mr-1.5" />
                确定
              </Button>
            </div>
          </div>
        ) : (
          /* 日子表单 */
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
        )}
      </Modal>

      {/* 删除确认 Modal（闹钟用） */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="删除闹钟"
      >
        <div className="text-center py-2">
          <div className="text-5xl mb-3">🗑️</div>
          <p className="text-amber-800 font-serif mb-6 dark:text-gray-200">
            确定要删除这个闹钟吗？
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteConfirm && handleDeleteAlarm(showDeleteConfirm)}
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

export default Days;
