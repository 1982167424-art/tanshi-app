import { create } from 'zustand';
import { api } from '@/utils/api';
import { Friend, FriendRequest, UserProfile } from '@/types';

interface BlocklistItem {
  blocked_uid: string;
  username: string;
  avatar: string;
  created_at: string;
}

interface FriendState {
  friends: Friend[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  unreadCount: number;
  isLoading: boolean;
  blocklist: BlocklistItem[];

  searchUsers: (q: string, by?: string) => Promise<UserProfile[]>;
  getUserProfile: (uid: string) => Promise<{ profile: UserProfile; isFriend: boolean } | null>;
  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;
  sendRequest: (toUid: string, reason?: string, permission?: string) => Promise<void>;
  replyRequest: (id: string, reply: string) => Promise<void>;
  acceptRequest: (id: string, permission?: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  removeFriend: (uid: string) => Promise<void>;
  updatePermission: (uid: string, permission: string) => Promise<void>;
  loadUnread: () => Promise<void>;
  blockUser: (uid: string) => Promise<void>;
  unblockUser: (uid: string) => Promise<void>;
  loadBlocklist: () => Promise<void>;
}

export const useFriendStore = create<FriendState>()((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  unreadCount: 0,
  isLoading: false,
  blocklist: [],

  searchUsers: async (q, by) => {
    set({ isLoading: true });
    try {
      const users = await api.friends.search(q, by);
      set({ isLoading: false });
      return users;
    } catch { set({ isLoading: false }); return []; }
  },

  getUserProfile: async (uid) => {
    try { return await api.friends.getProfile(uid); } catch { return null; }
  },

  loadFriends: async () => {
    try { const friends = await api.friends.getAll(); set({ friends }); } catch {}
  },

  loadRequests: async () => {
    try {
      const [received, sent] = await Promise.all([api.friends.getReceivedRequests(), api.friends.getSentRequests()]);
      set({ receivedRequests: received, sentRequests: sent });
    } catch {}
  },

  sendRequest: async (toUid, reason, permission) => {
    await api.friends.sendRequest(toUid, reason, permission);
  },

  replyRequest: async (id, reply) => {
    await api.friends.replyRequest(id, reply);
    await get().loadRequests();
  },

  acceptRequest: async (id, permission) => {
    await api.friends.acceptRequest(id, permission);
    await Promise.all([get().loadFriends(), get().loadRequests(), get().loadUnread()]);
  },

  rejectRequest: async (id) => {
    await api.friends.rejectRequest(id);
    await Promise.all([get().loadRequests(), get().loadUnread()]);
  },

  removeFriend: async (uid) => {
    await api.friends.remove(uid);
    await get().loadFriends();
  },

  updatePermission: async (uid, permission) => {
    await api.friends.updatePermission(uid, permission);
    await get().loadFriends();
  },

  loadUnread: async () => {
    try { const count = await api.friends.getUnread(); set({ unreadCount: count }); } catch {}
  },

  blockUser: async (uid) => {
    await api.friends.block(uid);
    await Promise.all([get().loadFriends(), get().loadBlocklist()]);
  },

  unblockUser: async (uid) => {
    await api.friends.unblock(uid);
    await get().loadBlocklist();
  },

  loadBlocklist: async () => {
    try { const list = await api.friends.getBlocklist(); set({ blocklist: list }); } catch {}
  },
}));
