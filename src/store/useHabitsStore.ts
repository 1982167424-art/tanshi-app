import { create } from 'zustand';
import { Habit, DeletedItem } from '@/types';
import { formatDate } from '@/utils/date';
import { useAuthStore } from './useAuthStore';
import { api } from '@/utils/api';

interface HabitsState {
  habits: Habit[];
  deletedItems: DeletedItem[];
  isLoading: boolean;
  error: string | null;
  loadHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'checkDates' | 'userUid'>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  restoreHabit: (deletedItemId: string) => Promise<void>;
  permanentlyDeleteHabit: (deletedItemId: string) => Promise<void>;
  toggleCheck: (id: string, date?: string) => Promise<void>;
  isChecked: (id: string, date?: string) => boolean;
  getUserHabits: () => Habit[];
  getStreak: (id: string) => number;
  getTotalChecks: (id: string) => number;
  getUserDeletedHabits: () => DeletedItem[];
  clearError: () => void;
}

export const useHabitsStore = create<HabitsState>()((set, get) => ({
  habits: [],
  deletedItems: [],
  isLoading: false,
  error: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const [habits, trashItems] = await Promise.all([
        api.habits.getAll(),
        api.trash.getAll(),
      ]);
      set({
        habits,
        deletedItems: trashItems.filter(item => item.type === 'habit'),
        isLoading: false,
      });
    } catch (error) {
      console.error('加载习惯数据失败:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  getUserHabits: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().habits.filter(h => h.userUid === currentUser.uid);
  },

  getUserDeletedHabits: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().deletedItems.filter(
      item => item.userUid === currentUser.uid && item.type === 'habit'
    );
  },

  addHabit: async (habit) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const newHabit: Omit<Habit, 'id' | 'createdAt'> = {
      ...habit,
      userUid: currentUser.uid,
      checkDates: [],
    };

    try {
      const created = await api.habits.create({ ...newHabit, createdAt: new Date().toISOString() });
      set({ habits: [...get().habits, created] });
    } catch (error) {
      console.error('添加习惯失败:', error);
      set({ error: error instanceof Error ? error.message : '添加失败' });
    }
  },

  deleteHabit: async (id) => {
    try {
      await api.habits.remove(id);
      set({ habits: get().habits.filter(h => h.id !== id) });
      await get().loadHabits();
    } catch (error) {
      console.error('删除习惯失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  restoreHabit: async (deletedItemId) => {
    try {
      await api.trash.restore(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
      await get().loadHabits();
    } catch (error) {
      console.error('恢复习惯失败:', error);
      set({ error: error instanceof Error ? error.message : '恢复失败' });
    }
  },

  permanentlyDeleteHabit: async (deletedItemId) => {
    try {
      await api.trash.delete(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
    } catch (error) {
      console.error('永久删除习惯失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  toggleCheck: async (id, date) => {
    const targetDate = date || formatDate(new Date());
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    const hasDate = habit.checkDates.includes(targetDate);
    const newCheckDates = hasDate
      ? habit.checkDates.filter(d => d !== targetDate)
      : [...habit.checkDates, targetDate];

    try {
      const updated = await api.habits.update(id, { checkDates: newCheckDates });
      set({
        habits: get().habits.map(h => h.id === id ? updated : h),
      });
    } catch (error) {
      console.error('打卡失败:', error);
      set({ error: error instanceof Error ? error.message : '打卡失败' });
    }
  },

  isChecked: (id, date) => {
    const targetDate = date || formatDate(new Date());
    const habit = get().habits.find(h => h.id === id);
    return habit?.checkDates.includes(targetDate) || false;
  },

  getStreak: (id) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit || habit.checkDates.length === 0) return 0;

    const sorted = [...habit.checkDates].sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i]);
      const next = new Date(sorted[i + 1]);
      const diff = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  getTotalChecks: (id) => {
    const habit = get().habits.find(h => h.id === id);
    return habit?.checkDates.length || 0;
  },

  clearError: () => set({ error: null }),
}));
