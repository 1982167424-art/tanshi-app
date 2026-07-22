import { create } from 'zustand';
import { api } from '@/utils/api';
import { Status } from '@/types';

interface StatusState {
  friendStatuses: Status[];
  userStatuses: Status[];
  isLoading: boolean;

  loadFriendStatuses: () => Promise<void>;
  loadUserStatuses: (uid: string) => Promise<void>;
  createStatus: (content: string, emoji?: string, background?: string) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
}

export const useStatusStore = create<StatusState>()((set, get) => ({
  friendStatuses: [],
  userStatuses: [],
  isLoading: false,

  loadFriendStatuses: async () => {
    set({ isLoading: true });
    try {
      const statuses = await api.statuses.getFriends();
      set({ friendStatuses: statuses, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  loadUserStatuses: async (uid) => {
    set({ isLoading: true });
    try {
      const statuses = await api.statuses.getUserStatuses(uid);
      set({ userStatuses: statuses, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createStatus: async (content, emoji, background) => {
    await api.statuses.create(content, emoji, background);
    await get().loadFriendStatuses();
  },

  deleteStatus: async (id) => {
    await api.statuses.delete(id);
    set({
      friendStatuses: get().friendStatuses.filter(s => s.id !== id),
      userStatuses: get().userStatuses.filter(s => s.id !== id),
    });
  },
}));
