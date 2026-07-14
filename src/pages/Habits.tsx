import React, { useState } from 'react';
import { Plus, Trash2, Check, Flame, Calendar, ChevronLeft, ChevronRight, Bell, BellOff, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useReminderStore } from '@/store/useReminderStore';
import { Habit, Reminder, ReminderFrequency } from '@/types';
import { formatDate } from '@/utils/date';

const emojiOptions = ['📚', '🏃', '💧', '🧘', '✍️', '🎨', '🎵', '💤', '🥗', '💪', '🌱', '😊'];

const Habits: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📚');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderHabit, setReminderHabit] = useState<Habit | null>(null);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('daily');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const { getUserHabits, addHabit, deleteHabit, toggleCheck, isChecked, getStreak, getTotalChecks } = useHabitsStore();
  const { getReminderByHabitId, addReminder, updateReminder, deleteReminder } = useReminderStore();
  const habits = getUserHabits();

  const getWeeklyData = () => {
    const days: { date: string; checkedCount: number; total: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const checkedCount = habits.filter(h => isChecked(h.id, dateStr)).length;
      days.push({ date: dateStr, checkedCount, total: habits.length });
    }
    return days;
  };

  const weeklyData = getWeeklyData();

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit({
      emoji: newEmoji,
      name: newName.trim(),
    });
    setNewName('');
    setNewEmoji('📚');
    setShowAddModal(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const openCalendar = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowCalendar(true);
  };

  const openReminder = (habit: Habit) => {
    const existing = getReminderByHabitId(habit.id);
    if (existing) {
      setReminderTime(existing.time);
      setReminderFrequency(existing.frequency);
      setReminderEnabled(existing.enabled);
    } else {
      setReminderTime('09:00');
      setReminderFrequency('daily');
      setReminderEnabled(true);
    }
    setReminderHabit(habit);
    setShowReminderModal(true);
  };

  const saveReminder = () => {
    if (!reminderHabit) return;
    const existing = getReminderByHabitId(reminderHabit.id);
    if (existing) {
      updateReminder(existing.id, {
        time: reminderTime,
        frequency: reminderFrequency,
        enabled: reminderEnabled,
      });
    } else {
      addReminder({
        habitId: reminderHabit.id,
        habitName: reminderHabit.name,
        habitEmoji: reminderHabit.emoji,
        time: reminderTime,
        frequency: reminderFrequency,
        enabled: reminderEnabled,
      });
    }
    setShowReminderModal(false);
    setReminderHabit(null);
  };

  const removeReminder = () => {
    if (!reminderHabit) return;
    const existing = getReminderByHabitId(reminderHabit.id);
    if (existing) {
      deleteReminder(existing.id);
    }
    setShowReminderModal(false);
    setReminderHabit(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
            <Flame size={20} className="text-orange-500" />
            我的习惯
          </h3>
          <span className="text-sm text-amber-600 font-serif dark:text-gray-400">
            共 {habits.length} 个习惯
          </span>
        </div>

        {habits.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-serif font-medium text-amber-700 mb-4 dark:text-gray-300">📊 本周打卡趋势</h4>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyData.map((day, index) => {
                const dayName = ['日', '一', '二', '三', '四', '五', '六'][new Date(day.date).getDay()];
                const height = day.total > 0 ? (day.checkedCount / day.total) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-24">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-amber-400 to-orange-300 transition-all duration-500 hover:from-amber-500 hover:to-orange-400"
                        style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                      />
                    </div>
                    <span className="text-xs font-serif text-amber-600 dark:text-gray-400">{dayName}</span>
                    <span className="text-xs font-serif font-medium text-amber-700 dark:text-gray-300">
                      {day.checkedCount}/{day.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">🎯</div>
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">
              还没有习惯
            </h4>
            <p className="text-amber-600 font-serif mb-6 dark:text-gray-400">
              培养一个好习惯，遇见更好的自己～
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> 添加习惯
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const todayChecked = isChecked(habit.id);
              const streak = getStreak(habit.id);
              const total = getTotalChecks(habit.id);
              const reminder = getReminderByHabitId(habit.id);
              const hasReminder = reminder && reminder.enabled;

              return (
                <GlassCard
                  key={habit.id}
                  className="p-5 hover:shadow-xl transition-all duration-300 group"
                  hover
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl dark:from-[#0f3460]/30 dark:to-[#16213e]/30">
                        {habit.emoji}
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-amber-900 dark:text-gray-100">{habit.name}</h4>
                        <p className="text-xs text-amber-600 dark:text-gray-400">已坚持 {streak} 天</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(habit.id);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-amber-400 hover:text-red-500 transition-all dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 text-center p-2 rounded-xl bg-amber-50 dark:bg-[#0f3460]/30">
                      <p className="text-lg font-serif font-bold text-orange-500">{streak}</p>
                      <p className="text-xs text-amber-600 dark:text-gray-400">连续天数</p>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-xl bg-amber-50 dark:bg-[#0f3460]/30">
                      <p className="text-lg font-serif font-bold text-amber-600 dark:text-gray-400">{total}</p>
                      <p className="text-xs text-amber-600 dark:text-gray-400">累计次数</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCheck(habit.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-serif font-medium transition-all duration-200 ${
                        todayChecked
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-md'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                      }`}
                    >
                      <Check size={18} />
                      {todayChecked ? '已打卡' : '打卡'}
                    </button>
                    <button
                      onClick={() => openCalendar(habit)}
                      className="px-3 py-2.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => openReminder(habit)}
                      className={`px-3 py-2.5 rounded-xl transition-colors ${
                        hasReminder
                          ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                      }`}
                      title={hasReminder ? `提醒时间: ${reminder.time}` : '设置提醒'}
                    >
                      {hasReminder ? <Bell size={18} /> : <BellOff size={18} />}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </GlassCard>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </button>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加新习惯"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-serif text-amber-800 mb-2 dark:text-gray-300">
              选择图标
            </label>
            <div className="grid grid-cols-6 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setNewEmoji(emoji)}
                  className={`p-2 text-2xl rounded-xl transition-all ${
                    newEmoji === emoji
                      ? 'bg-amber-200 scale-110 shadow-md dark:bg-[#0f3460]/60 dark:shadow-black/20'
                      : 'bg-amber-50 hover:bg-amber-100 dark:bg-[#0f3460]/20 dark:hover:bg-[#0f3460]/40'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="习惯名称"
            value={newName}
            onChange={setNewName}
            placeholder="例如：每天读书30分钟"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleAdd} className="flex-1" disabled={!newName.trim()}>
              添加
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-3">🗑️</div>
          <p className="text-amber-800 font-serif mb-6 dark:text-gray-200">
            确定要删除这个习惯吗？所有打卡记录都会消失哦。
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (showDeleteConfirm) deleteHabit(showDeleteConfirm);
                setShowDeleteConfirm(null);
              }}
              className="flex-1"
            >
              删除
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCalendar && !!selectedHabit}
        onClose={() => setShowCalendar(false)}
        title={`${selectedHabit?.emoji} ${selectedHabit?.name} - 打卡日历`}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors dark:hover:bg-white/10 dark:text-gray-400"
            >
              <ChevronLeft size={20} />
            </button>
            <h4 className="font-serif font-semibold text-amber-900 dark:text-gray-100">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h4>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors dark:hover:bg-white/10 dark:text-gray-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div key={day} className="text-xs font-serif text-amber-600 py-2 dark:text-gray-400">
                {day}
              </div>
            ))}
            {monthDays.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;

              const dateStr = formatDate(date);
              const checked = selectedHabit && isChecked(selectedHabit.id, dateStr);
              const isToday = dateStr === formatDate(new Date());
              const isFuture = date > new Date();

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (selectedHabit && !isFuture) {
                      toggleCheck(selectedHabit.id, dateStr);
                    }
                  }}
                  disabled={isFuture}
                  className={`
                    aspect-square rounded-lg text-sm font-serif transition-all
                    ${checked
                      ? 'bg-gradient-to-br from-green-400 to-emerald-400 text-white shadow-md'
                      : isFuture
                        ? 'text-amber-300 dark:text-gray-600'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                    }
                    ${isToday && !checked ? 'ring-2 ring-amber-400 dark:ring-amber-400/50' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 text-sm text-amber-600 font-serif dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-gradient-to-br from-green-400 to-emerald-400" />
              已打卡
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-amber-50 border border-amber-200 dark:bg-[#0f3460]/30 dark:border-white/10" />
              未打卡
            </span>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReminderModal && !!reminderHabit}
        onClose={() => { setShowReminderModal(false); setReminderHabit(null); }}
        title={`${reminderHabit?.emoji} ${reminderHabit?.name} - 提醒设置`}
        className="max-w-sm"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-serif text-amber-800 dark:text-gray-300">开启提醒</span>
            <button
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                reminderEnabled ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-amber-200 dark:bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-serif text-amber-800 mb-2 flex items-center gap-1.5 dark:text-gray-300">
              <Clock size={14} />
              提醒时间
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-2.5 font-serif bg-white/60 backdrop-blur-sm border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-amber-900 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-serif text-amber-800 mb-2 dark:text-gray-300">
              提醒频率
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'daily', label: '每天' },
                { value: 'weekdays', label: '工作日' },
                { value: 'weekends', label: '周末' },
              ] as { value: ReminderFrequency; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setReminderFrequency(opt.value)}
                  className={`py-2 rounded-xl text-sm font-serif font-medium transition-all ${
                    reminderFrequency === opt.value
                      ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={removeReminder} className="flex-1">
              删除提醒
            </Button>
            <Button onClick={saveReminder} className="flex-1">
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Habits;
