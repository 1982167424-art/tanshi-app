import { create } from 'zustand';
import { Day, DayType, DeletedItem } from '@/types';
import { getNextAnniversary } from '@/utils/date';
import { useAuthStore } from './useAuthStore';
import { api } from '@/utils/api';

interface DaysState {
  days: Day[];
  deletedItems: DeletedItem[];
  isLoading: boolean;
  error: string | null;
  loadDays: () => Promise<void>;
  addDay: (day: Omit<Day, 'id' | 'createdAt' | 'userUid'>) => Promise<void>;
  deleteDay: (id: string) => Promise<void>;
  restoreDay: (deletedItemId: string) => Promise<void>;
  permanentlyDeleteDay: (deletedItemId: string) => Promise<void>;
  updateDay: (id: string, updates: Partial<Day>) => Promise<void>;
  getUserDays: () => Day[];
  getDaysByType: (type: DayType) => Day[];
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  tickTimer: (id: string) => boolean;
  getUserDeletedDays: () => DeletedItem[];
  clearError: () => void;
}

export const useDaysStore = create<DaysState>()((set, get) => ({
  days: [],
  deletedItems: [],
  isLoading: false,
  error: null,

  loadDays: async () => {
    set({ isLoading: true, error: null });
    try {
      const [days, trashItems] = await Promise.all([
        api.days.getAll(),
        api.trash.getAll(),
      ]);
      set({
        days,
        deletedItems: trashItems.filter(item => item.type === 'day'),
        isLoading: false,
      });
    } catch (error) {
      console.error('加载日子数据失败:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  getUserDays: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().days.filter(d => d.userUid === currentUser.uid);
  },

  getUserDeletedDays: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().deletedItems.filter(
      item => item.userUid === currentUser.uid && item.type === 'day'
    );
  },

  getDaysByType: (type: DayType) => {
    return get().getUserDays().filter(d => d.type === type);
  },

  addDay: async (day) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    let targetDate = day.targetDate;
    if (day.type === 'anniversary') {
      targetDate = getNextAnniversary(day.targetDate);
    }

    const newDay: Omit<Day, 'id' | 'createdAt'> = {
      ...day,
      userUid: currentUser.uid,
      targetDate,
      initialSeconds: day.countdownSeconds,
    };

    try {
      const created = await api.days.create(newDay);
      set({ days: [...get().days, created] });
    } catch (error) {
      console.error('添加日子失败:', error);
      set({ error: error instanceof Error ? error.message : '添加失败' });
    }
  },

  deleteDay: async (id) => {
    try {
      await api.days.remove(id);
      set({ days: get().days.filter(d => d.id !== id) });
      await get().loadDays();
    } catch (error) {
      console.error('删除日子失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  restoreDay: async (deletedItemId) => {
    try {
      await api.trash.restore(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
      await get().loadDays();
    } catch (error) {
      console.error('恢复日子失败:', error);
      set({ error: error instanceof Error ? error.message : '恢复失败' });
    }
  },

  permanentlyDeleteDay: async (deletedItemId) => {
    try {
      await api.trash.delete(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
    } catch (error) {
      console.error('永久删除日子失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  updateDay: async (id, updates) => {
    try {
      const updated = await api.days.update(id, updates);
      set({
        days: get().days.map(d => d.id === id ? updated : d)
      });
    } catch (error) {
      console.error('更新日子失败:', error);
      set({ error: error instanceof Error ? error.message : '更新失败' });
    }
  },

  startTimer: (id) => {
    void get().updateDay(id, { isRunning: true });
  },

  pauseTimer: (id) => {
    void get().updateDay(id, { isRunning: false });
  },

  resetTimer: (id) => {
    const day = get().days.find(d => d.id === id);
    if (day) {
      void get().updateDay(id, {
        countdownSeconds: day.initialSeconds,
        isRunning: false
      });
    }
  },

  tickTimer: (id) => {
    const day = get().days.find(d => d.id === id);
    if (!day || !day.isRunning || day.countdownSeconds <= 0) return false;

    const newSeconds = day.countdownSeconds - 1;
    set({
      days: get().days.map(d =>
        d.id === id ? { ...d, countdownSeconds: newSeconds } : d
      ),
    });

    if (newSeconds <= 0) {
      set({
        days: get().days.map(d =>
          d.id === id ? { ...d, isRunning: false } : d
        ),
      });
      void api.days.update(id, { isRunning: false, countdownSeconds: 0 });
      return true;
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
