import { create } from 'zustand';
import { Reminder } from '@/types';
import { useAuthStore } from './useAuthStore';
import { api } from '@/utils/api';

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  loadReminders: () => Promise<void>;
  getUserReminders: () => Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'userUid'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Omit<Reminder, 'id' | 'userUid'>>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  getReminderByHabitId: (habitId: string) => Reminder | undefined;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>()((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,

  loadReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      const reminders = await api.reminders.getAll();
      set({ reminders, isLoading: false });
    } catch (error) {
      console.error('加载提醒数据失败:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  getUserReminders: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().reminders.filter(r => r.userUid === currentUser.uid);
  },

  addReminder: async (reminder) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const newReminder: Omit<Reminder, 'id'> = {
      ...reminder,
      userUid: currentUser.uid,
    };

    try {
      const created = await api.reminders.create(newReminder);
      set({ reminders: [...get().reminders, created] });
    } catch (error) {
      console.error('添加提醒失败:', error);
      set({ error: error instanceof Error ? error.message : '添加失败' });
    }
  },

  updateReminder: async (id, updates) => {
    try {
      const updated = await api.reminders.update(id, updates);
      set({
        reminders: get().reminders.map(r =>
          r.id === id ? updated : r
        )
      });
    } catch (error) {
      console.error('更新提醒失败:', error);
      set({ error: error instanceof Error ? error.message : '更新失败' });
    }
  },

  deleteReminder: async (id) => {
    try {
      await api.reminders.remove(id);
      set({ reminders: get().reminders.filter(r => r.id !== id) });
    } catch (error) {
      console.error('删除提醒失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  toggleReminder: async (id) => {
    const reminder = get().reminders.find(r => r.id === id);
    if (!reminder) return;
    await get().updateReminder(id, { enabled: !reminder.enabled });
  },

  getReminderByHabitId: (habitId) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return undefined;
    return get().reminders.find(
      r => r.userUid === currentUser.uid && r.habitId === habitId
    );
  },

  clearError: () => set({ error: null }),
}));
