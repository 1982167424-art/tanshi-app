import React, { useState } from 'react';
import { User, RefreshCw, LogOut, ChevronRight, Download, Upload, Bell, Trash2, Sun, Moon, Monitor, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';
import { useReminderStore } from '@/store/useReminderStore';
import { useThemeStore, Theme } from '@/store/useThemeStore';
import { exportAllData, downloadJsonFile } from '@/utils/exportData';
import { importAllData, validateImportFile, ImportResult } from '@/utils/importData';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, deleteAccount } = useAuthStore();
  const { days } = useDaysStore();
  const { notes } = useNotesStore();
  const { habits } = useHabitsStore();
  const { moods } = useMoodStore();
  const { conversations } = useCompanionStore();
  const { getUserReminders, toggleReminder, deleteReminder } = useReminderStore();
  const userReminders = getUserReminders();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showImportResult, setShowImportResult] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useThemeStore();

  const handleResetData = () => {
    const uid = currentUser?.uid;
    if (!uid) return;

    useDaysStore.setState({ days: days.filter(d => d.userUid !== uid) });
    useNotesStore.setState({ notes: notes.filter(n => n.userUid !== uid) });
    useHabitsStore.setState({ habits: habits.filter(h => h.userUid !== uid) });
    useMoodStore.setState({ moods: moods.filter(m => m.userUid !== uid) });
    useCompanionStore.setState({ 
      conversations: conversations.filter(c => c.userUid !== uid),
      currentConversationId: null,
    });

    setShowResetConfirm(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError('');
    const result = await deleteAccount();
    if (result.success) {
      // 清除本地各 store 中当前用户的数据
      const uid = currentUser?.uid;
      if (uid) {
        useDaysStore.setState({ days: [] });
        useNotesStore.setState({ notes: [] });
        useHabitsStore.setState({ habits: [] });
        useMoodStore.setState({ moods: [] });
        useCompanionStore.setState({ conversations: [], currentConversationId: null });
      }
      setShowDeleteAccountConfirm(false);
      setDeleteConfirmText('');
      navigate('/login');
    } else {
      setDeleteAccountError(result.message);
    }
    setIsDeletingAccount(false);
  };

  const handleExport = () => {
    const data = exportAllData();
    downloadJsonFile(data);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImportFile(file);
    if (!validation.success) {
      setImportResult(validation);
      setShowImportResult(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setShowImportConfirm(true);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importAllData(selectedFile);
    setImportResult(result);
    setShowImportConfirm(false);
    setShowImportResult(true);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '暖色', icon: <Sun size={18} /> },
    { value: 'dark', label: '深色', icon: <Moon size={18} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={18} /> },
  ];

  const settingGroups: {
    title: string;
    items: {
      icon: any;
      label: string;
      desc: string;
      onClick: () => void;
      hasArrow?: boolean;
      hasToggle?: boolean;
      toggleValue?: boolean;
      danger?: boolean;
    }[];
  }[] = [
    {
      title: '账号',
      items: [
        {
          icon: User,
          label: '个人信息',
          desc: '查看和编辑个人资料',
          onClick: () => navigate('/profile'),
          hasArrow: true,
        },
      ],
    },
    {
      title: '外观',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: '主题',
          desc: themeOptions.find(t => t.value === theme)?.label || '暖色',
          onClick: () => {},
          hasArrow: true,
        },
      ],
    },
    {
      title: '数据管理',
      items: [
        {
          icon: Download,
          label: '导出数据',
          desc: '将所有数据备份为JSON文件',
          onClick: () => handleExport(),
          hasArrow: true,
        },
        {
          icon: Upload,
          label: '导入数据',
          desc: '从JSON备份文件恢复数据',
          onClick: () => handleImportClick(),
          hasArrow: true,
        },
        {
          icon: RefreshCw,
          label: '重置所有数据',
          desc: '清除所有日子、笔记、习惯、心情等数据',
          onClick: () => setShowResetConfirm(true),
          danger: true,
          hasArrow: true,
        },
        {
          icon: LogOut,
          label: '退出登录',
          desc: '退出当前账号',
          onClick: () => setShowLogoutConfirm(true),
          danger: true,
          hasArrow: true,
        },
        {
          icon: UserX,
          label: '注销账号',
          desc: '永久删除账号及所有数据，不可恢复',
          onClick: () => {
            setShowDeleteAccountConfirm(true);
            setDeleteConfirmText('');
            setDeleteAccountError('');
          },
          danger: true,
          hasArrow: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />
      {settingGroups.map((group) => (
        <GlassCard key={group.title} className="overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 dark:border-white/10 dark:bg-[#0f3460]/20">
            <h3 className="font-serif font-semibold text-amber-900 dark:text-gray-100">{group.title}</h3>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-white/10">
            {group.items.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`
                  w-full flex items-center gap-4 px-5 py-4
                  transition-colors hover:bg-amber-50/70
                  dark:hover:bg-white/5
                  ${item.danger ? 'text-red-600' : 'text-amber-900 dark:text-gray-100'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  ${item.danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-[#0f3460]/30'}
                `}>
                  <item.icon size={20} className={item.danger ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-serif font-medium">{item.label}</p>
                  <p className="text-sm text-amber-500 font-serif dark:text-gray-400">{item.desc}</p>
                </div>
                {item.hasToggle && (
                  <div className={`
                    w-12 h-7 rounded-full p-1 transition-colors
                    ${item.toggleValue ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-amber-200 dark:bg-white/10'}
                  `}>
                    <div className={`
                      w-5 h-5 rounded-full bg-white shadow transition-transform
                      ${item.toggleValue ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                  </div>
                )}
                {item.hasArrow && (
                  <ChevronRight size={20} className="text-amber-400 dark:text-gray-500" />
                )}
              </button>
            ))}
          </div>
        </GlassCard>
      ))}

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 dark:border-white/10 dark:bg-[#0f3460]/20">
          <h3 className="font-serif font-semibold text-amber-900 dark:text-gray-100">主题切换</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl font-serif
                  transition-all duration-200
                  ${theme === option.value
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-[#0f3460]/30 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                  }
                `}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 dark:border-white/10 dark:bg-[#0f3460]/20">
          <h3 className="font-serif font-semibold text-amber-900 flex items-center gap-2 dark:text-gray-100">
            <Bell size={18} className="text-amber-600 dark:text-amber-400" />
            提醒设置
          </h3>
        </div>
        <div className="divide-y divide-amber-100 dark:divide-white/10">
          {userReminders.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-amber-500 font-serif dark:text-gray-400">还没有设置任何提醒</p>
              <p className="text-xs text-amber-400 font-serif mt-1 dark:text-gray-500">在习惯页面可以为每个习惯添加打卡提醒～</p>
            </div>
          ) : (
            userReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-amber-50/70 dark:hover:bg-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl dark:bg-[#0f3460]/30">
                  {reminder.habitEmoji}
                </div>
                <div className="flex-1">
                  <p className="font-serif font-medium text-amber-900 dark:text-gray-100">{reminder.habitName}</p>
                  <p className="text-sm text-amber-500 font-serif dark:text-gray-400">
                    {reminder.time} · {reminder.frequency === 'daily' ? '每天' : reminder.frequency === 'weekdays' ? '工作日' : '周末'}
                  </p>
                </div>
                <button
                  onClick={() => toggleReminder(reminder.id)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    reminder.enabled ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-amber-200 dark:bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-amber-400 hover:text-red-500 transition-all dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="重置所有数据"
      >
        <div className="text-center py-2">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-amber-800 font-serif mb-2 font-semibold dark:text-gray-200">
            此操作不可撤销！
          </p>
          <p className="text-amber-700 font-serif mb-6 text-sm leading-relaxed dark:text-gray-400">
            将清除所有日子、笔记、习惯、心情记录和对话历史，
            但账号信息会保留。确定要继续吗？
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowResetConfirm(false)} className="flex-1">
              取消
            </Button>
            <Button variant="danger" onClick={handleResetData} className="flex-1">
              确认重置
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="退出登录"
      >
        <div className="text-center py-2">
          <div className="text-5xl mb-3">👋</div>
          <p className="text-amber-800 font-serif mb-6 dark:text-gray-200">
            确定要退出登录吗？数据会保留在本地，下次登录还能看到～
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)} className="flex-1">
              取消
            </Button>
            <Button variant="danger" onClick={handleLogout} className="flex-1">
              退出
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteAccountConfirm}
        onClose={() => {
          if (!isDeletingAccount) {
            setShowDeleteAccountConfirm(false);
            setDeleteConfirmText('');
            setDeleteAccountError('');
          }
        }}
        title="注销账号"
      >
        <div className="py-2">
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">⚠️</div>
            <p className="text-red-600 font-serif mb-2 font-bold text-lg">
              此操作不可撤销！
            </p>
            <p className="text-amber-700 font-serif text-sm leading-relaxed dark:text-gray-400">
              将永久删除你的账号以及所有日子、笔记、习惯、心情记录等数据，
              删除后无法恢复。如确认注销，请在下方输入
              <span className="text-red-600 font-semibold mx-1">确认注销</span>
              后点击按钮。
            </p>
          </div>

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder='请输入"确认注销"'
            disabled={isDeletingAccount}
            className={`
              w-full px-4 py-3 rounded-xl font-serif text-center
              bg-amber-50/70 border border-amber-200
              text-amber-900 placeholder:text-amber-400
              focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent
              dark:bg-[#0f3460]/30 dark:border-white/10 dark:text-gray-100 dark:placeholder:text-gray-500
              ${deleteAccountError ? 'border-red-300' : ''}
            `}
          />

          {deleteAccountError && (
            <p className="text-red-500 font-serif text-sm mt-2 text-center">
              {deleteAccountError}
            </p>
          )}

          <div className="flex gap-3 mt-5">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteAccountConfirm(false);
                setDeleteConfirmText('');
                setDeleteAccountError('');
              }}
              className="flex-1"
              disabled={isDeletingAccount}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              className="flex-1"
              disabled={deleteConfirmText !== '确认注销' || isDeletingAccount}
            >
              {isDeletingAccount ? '注销中...' : '永久注销账号'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        title="确认导入数据"
      >
        <div className="text-center py-2">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-amber-800 font-serif mb-2 font-semibold dark:text-gray-200">
            即将导入备份数据
          </p>
          <p className="text-amber-700 font-serif mb-6 text-sm leading-relaxed dark:text-gray-400">
            导入的数据将与现有数据合并，相同的数据不会被重复添加。
            确定要继续吗？
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportConfirm(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="flex-1"
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleImport} className="flex-1">
              确认导入
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportResult}
        onClose={() => setShowImportResult(false)}
        title={importResult?.success ? '导入成功' : '导入失败'}
      >
        <div className="text-center py-2">
          <div className="text-5xl mb-3">{importResult?.success ? '✅' : '❌'}</div>
          <p className="text-amber-800 font-serif mb-4 dark:text-gray-200">
            {importResult?.message}
          </p>
          {importResult?.success && importResult.details && (
            <div className="bg-amber-50/70 rounded-xl p-4 mb-6 text-left dark:bg-[#0f3460]/30">
              <p className="text-sm text-amber-700 font-serif mb-2 dark:text-gray-300">本次导入统计：</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-amber-600 font-serif dark:text-gray-400">
                <span>新日子：{importResult.details.days}</span>
                <span>新笔记：{importResult.details.notes}</span>
                <span>新习惯：{importResult.details.habits}</span>
                <span>新心情：{importResult.details.moods}</span>
                <span>新对话：{importResult.details.conversations}</span>
              </div>
            </div>
          )}
          <Button variant="primary" onClick={() => setShowImportResult(false)} className="w-full">
            知道了
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
