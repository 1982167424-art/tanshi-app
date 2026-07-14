import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { isFourteenBirthdayPassed } from '@/utils/date';
import { api } from '@/utils/api';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, accessCode?: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string, birthday: string) => Promise<{ success: boolean; message: string; uid?: string; accessCode?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  syncUser: () => Promise<void>;
  toggleTeenMode: () => Promise<void>;
  checkTeenModeAge: () => void;
  clearError: () => void;
}

const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8位' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password);
  if (!hasLetter || !hasNumber || !hasSymbol) {
    return { valid: false, message: '密码需要包含字母、数字和符号' };
  }
  return { valid: true, message: '' };
};

// 旧版localStorage数据迁移：snake_case → camelCase
const migrateUser = (user: any): User | null => {
  if (!user) return null;
  return {
    uid: user.uid || '',
    username: user.username || user.name || user.accountName || '',
    birthday: user.birthday || '',
    isTeenMode: (user as any).isTeenMode !== undefined ? (user as any).isTeenMode : !!(user as any).is_teen_mode || false,
    avatar: user.avatar || '',
    createdAt: user.createdAt || user.created_at || '',
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string, accessCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.auth.login(username, password, accessCode);
          api.setToken(data.token);
          set({ currentUser: data.user as User, isLoading: false });
          // 登录后立即检查：青少年模式用户已满14岁则自动切换至标准模式
          get().checkTeenModeAge();
          return { success: true, message: '登录成功' };
        } catch (error) {
          const message = error instanceof Error ? error.message : '登录失败，请检查网络或后端服务';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      register: async (username: string, password: string, birthday: string) => {
        if (!username.trim()) {
          return { success: false, message: '用户名不能为空' };
        }
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
          return { success: false, message: passwordCheck.message };
        }
        if (!birthday) {
          return { success: false, message: '请选择出生日期' };
        }

        set({ isLoading: true, error: null });
        try {
          const data = await api.auth.register(username, password, birthday);
          api.setToken(data.token);
          // 注册成功不自动登录，由前端展示口令后跳转登录页
          api.removeToken();
          set({ currentUser: null, isLoading: false });
          const u = data.user as any;
          return { success: true, message: '注册成功', uid: u.uid, accessCode: u.accessCode };
        } catch (error) {
          const message = error instanceof Error ? error.message : '注册失败，请检查网络或后端服务';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      logout: () => {
        api.removeToken();
        set({ currentUser: null, error: null });
      },

      // 从后端同步最新用户信息，确保前后端一致
      syncUser: async () => {
        const { currentUser } = get();
        if (!currentUser) return;
        try {
          const freshUser = await api.users.get(currentUser.uid);
          set({ currentUser: freshUser as User });
        } catch (error) {
          console.error('同步用户信息失败:', error);
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const { user: updatedUser, token } = await api.users.update(currentUser.uid, updates);
          // 如果后端返回了新token（用户名变更），更新token
          if (token) {
            api.setToken(token);
          }
          set({ currentUser: { ...currentUser, ...updatedUser } as User });
        } catch (error) {
          console.error('更新用户信息失败:', error);
          set({ error: error instanceof Error ? error.message : '更新失败' });
        }
      },

      toggleTeenMode: async () => {
        const { currentUser } = get();
        if (!currentUser) return;
        await get().updateUser({ isTeenMode: !currentUser.isTeenMode });
      },

      checkTeenModeAge: () => {
        const { currentUser } = get();
        if (!currentUser || !currentUser.isTeenMode) return;

        if (isFourteenBirthdayPassed(currentUser.birthday)) {
          get().updateUser({ isTeenMode: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tanshi-auth',
      // 迁移旧版localStorage数据格式
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        const state = persistedState as any;
        if (state.currentUser) {
          state.currentUser = migrateUser(state.currentUser);
        }
        return state;
      },
      version: 1,
    }
  )
);
