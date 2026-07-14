import { create } from 'zustand';
import { Mood, MoodType } from '@/types';
import { formatDate } from '@/utils/date';
import { useAuthStore } from './useAuthStore';
import { api } from '@/utils/api';

interface MoodState {
  moods: Mood[];
  isLoading: boolean;
  error: string | null;
  loadMoods: () => Promise<void>;
  addMood: (mood: Omit<Mood, 'id' | 'userUid'>) => Promise<void>;
  getUserMoods: () => Mood[];
  getMoodStats: () => { good: number; normal: number; bad: number; total: number };
  getTodayMood: () => Mood | null;
  getMoodHeatmap: (days: number) => Mood[];
  updateTodayMood: (moodType: MoodType, note?: string) => Promise<void>;
  deleteMood: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMoodStore = create<MoodState>()((set, get) => ({
  moods: [],
  isLoading: false,
  error: null,

  loadMoods: async () => {
    set({ isLoading: true, error: null });
    try {
      const moods = await api.moods.getAll();
      set({ moods, isLoading: false });
    } catch (error) {
      console.error('加载心情数据失败:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  getUserMoods: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().moods.filter(m => m.userUid === currentUser.uid);
  },

  addMood: async (mood) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const newMood: Omit<Mood, 'id'> = {
      ...mood,
      userUid: currentUser.uid,
    };

    try {
      const created = await api.moods.create(newMood);
      set({ moods: [...get().moods, created] });
    } catch (error) {
      console.error('记录心情失败:', error);
      set({ error: error instanceof Error ? error.message : '记录失败' });
    }
  },

  updateTodayMood: async (moodType, note = '') => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const today = formatDate(new Date());
    const existing = get().moods.find(
      m => m.userUid === currentUser.uid && m.date === today
    );

    if (existing) {
      try {
        const updated = await api.moods.update(existing.id, { moodType, note });
        set({
          moods: get().moods.map(m =>
            m.id === existing.id ? updated : m
          )
        });
      } catch (error) {
        console.error('更新心情失败:', error);
        set({ error: error instanceof Error ? error.message : '更新失败' });
      }
    } else {
      await get().addMood({ moodType, date: today, note });
    }
  },

  deleteMood: async (id) => {
    try {
      await api.moods.remove(id);
      set({ moods: get().moods.filter(m => m.id !== id) });
    } catch (error) {
      console.error('删除心情失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  getTodayMood: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return null;
    const today = formatDate(new Date());
    return get().moods.find(
      m => m.userUid === currentUser.uid && m.date === today
    ) || null;
  },

  getMoodStats: () => {
    const userMoods = get().getUserMoods();
    const stats = { good: 0, normal: 0, bad: 0, total: userMoods.length };
    userMoods.forEach(m => {
      stats[m.moodType]++;
    });
    return stats;
  },

  getMoodHeatmap: (days) => {
    const userMoods = get().getUserMoods();
    const result: Mood[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const mood = userMoods.find(m => m.date === dateStr);
      if (mood) {
        result.push(mood);
      }
    }
    return result;
  },

  clearError: () => set({ error: null }),
}));
