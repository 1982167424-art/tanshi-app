import React, { useState, useMemo } from 'react';
import { AlarmClock, Plus, Bell, BellOff, Trash2, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useReminderStore } from '@/store/useReminderStore';
import { ReminderFrequency } from '@/types';

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

const Alarm: React.FC = () => {
  const { reminders, addReminder, deleteReminder, toggleReminder } = useReminderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // 闹钟 = habitId 为空的 reminder
  const alarms = useMemo(
    () => reminders.filter(r => !r.habitId).sort((a, b) => a.time.localeCompare(b.time)),
    [reminders]
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermissionStatus(result);
  };

  const handleAdd = async () => {
    if (!title.trim() || !time) return;
    await addReminder({
      habitId: '',
      habitName: title.trim(),
      habitEmoji: '⏰',
      time,
      frequency,
      enabled: true,
    });
    setTitle('');
    setTime('08:00');
    setFrequency('daily');
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    setShowDeleteConfirm(null);
  };

  // 计算距离下次响铃的时间
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

    // 从今天开始往后找最近一个匹配的日期
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 通知权限提示 */}
      {permissionStatus !== 'granted' && (
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

      {/* 标题栏 */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
            <AlarmClock size={20} className="text-amber-500 dark:text-amber-400" />
            闹钟
          </h3>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-1.5" />
            添加闹钟
          </Button>
        </div>
        <p className="text-sm text-amber-600 font-serif dark:text-gray-400">
          到时间自动弹出系统通知，需保持页面打开
        </p>
      </GlassCard>

      {/* 闹钟列表 */}
      {alarms.length === 0 ? (
        <GlassCard className="p-12">
          <div className="text-center">
            <div className="text-5xl mb-4">⏰</div>
            <p className="text-amber-700 font-serif text-lg mb-2 dark:text-gray-300">还没有闹钟</p>
            <p className="text-sm text-amber-500 font-serif mb-6 dark:text-gray-400">
              添加一个闹钟，到点准时提醒你
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-1.5" />
              创建第一个闹钟
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {alarms.map((alarm) => {
            const nextRing = getNextRing(alarm);
            return (
              <GlassCard key={alarm.id} className="p-5">
                <div className="flex items-center gap-4">
                  {/* 开关 */}
                  <button
                    onClick={() => toggleReminder(alarm.id)}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      alarm.enabled
                        ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md'
                        : 'bg-amber-100 text-amber-300 dark:bg-[#0f3460]/40 dark:text-gray-600'
                    }`}
                  >
                    {alarm.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                  </button>

                  {/* 时间和标题 */}
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

                  {/* 删除 */}
                  <button
                    onClick={() => setShowDeleteConfirm(alarm.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-amber-400 hover:text-red-500 hover:bg-red-50 transition-all dark:text-gray-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* 添加闹钟 Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加闹钟"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
              闹钟标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
                  onClick={() => setFrequency(opt.value)}
                  className={`py-3 rounded-xl font-serif font-medium transition-all duration-200 ${
                    frequency === opt.value
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
            <Button onClick={handleAdd} className="flex-1" disabled={!title.trim() || !time}>
              <Check size={16} className="mr-1.5" />
              确定
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认 Modal */}
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
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
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

export default Alarm;
