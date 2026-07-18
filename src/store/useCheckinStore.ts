import { create } from 'zustand';
import { CheckinStatus, CheckinResult, UserTitle } from '@/types';
import { api } from '@/utils/api';

interface CheckinState {
  status: CheckinStatus | null;
  titles: UserTitle[];
  isLoading: boolean;
  isCheckingIn: boolean;
  loadStatus: () => Promise<void>;
  loadTitles: () => Promise<void>;
  checkin: () => Promise<CheckinResult | null>;
}

export const useCheckinStore = create<CheckinState>()((set, get) => ({
  status: null,
  titles: [],
  isLoading: false,
  isCheckingIn: false,

  loadStatus: async () => {
    set({ isLoading: true });
    try {
      const status = await api.checkin.getStatus();
      set({ status, isLoading: false });
    } catch (error) {
      console.error('加载签到状态失败:', error);
      set({ isLoading: false });
    }
  },

  loadTitles: async () => {
    try {
      const titles = await api.checkin.getTitles();
      set({ titles });
    } catch (error) {
      console.error('加载称号列表失败:', error);
    }
  },

  checkin: async () => {
    set({ isCheckingIn: true });
    try {
      const result = await api.checkin.checkin();
      // 更新状态
      set({
        status: {
          checked_in_today: true,
          streak_days: result.streak_days,
          total_points: result.total_points,
          total_checkin_days: result.total_checkin_days,
          last_checkin_date: new Date().toISOString().split('T')[0],
          days_since_last_checkin: 0,
          break_warning: false,
          break_message: '',
        },
        isCheckingIn: false,
      });
      // 刷新称号列表
      await get().loadTitles();
      return result;
    } catch (error) {
      console.error('签到失败:', error);
      set({ isCheckingIn: false });
      return null;
    }
  },
}));
