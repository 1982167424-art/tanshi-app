import { Day, Note, Habit, Mood, Reminder, DeletedItem, User, CheckinStatus, CheckinResult, UserTitle } from '@/types';

// 使用相对路径，通过 Vercel 代理转发到后端，隐藏原站域名
const API_BASE = (import.meta.env.VITE_API_BASE || '') + '/api';

// Token管理：sessionStorage（Vercel rewrites 不支持 httpOnly Cookie）
const TOKEN_KEY = 'tanshi_token';
const getToken = () => sessionStorage.getItem(TOKEN_KEY);
const setToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
const removeToken = () => sessionStorage.removeItem(TOKEN_KEY);

// 请求超时控制
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

// 请求封装：自动注入JWT，统一解包 data 字段
async function request<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    console.error(`API请求失败 [${url}]:`, error);
    throw new Error('网络连接失败，请检查网络后重试');
  }

  let body: { success: boolean; message: string; data: T };
  try {
    body = await res.json();
  } catch (error) {
    console.error(`API响应解析失败 [${url}]:`, error);
    throw new Error('服务器响应异常，请稍后重试');
  }

  if (!res.ok || !body.success) {
    throw new Error(body.message || '请求失败');
  }
  return body.data;
}

export const api = {
  // Token管理
  setToken,
  removeToken,
  getToken,

  // 认证：返回 { user, token }
  auth: {
    register: (username: string, password: string, birthday: string, turnstileToken?: string) =>
      request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, birthday, turnstileToken }),
      }),
    login: (username: string, password: string, accessCode?: string, turnstileToken?: string) =>
      request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, accessCode, turnstileToken }),
      }),
  },

  // 用户
  users: {
    get: (uid: string) =>
      request<{ user: User }>(`/users/${uid}`).then(d => d.user),
    update: (uid: string, updates: Partial<User>) =>
      request<{ user: User; token?: string }>(`/users/${uid}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => ({ user: d.user, token: d.token })),
    delete: (uid: string) => request(`/users/${uid}`, { method: 'DELETE' }),
  },

  // 日子 - userUid由JWT推断
  days: {
    getAll: () => request<{ days: Day[] }>('/days').then(d => d.days || []),
    create: (item: Partial<Day>) =>
      request<{ day: Day }>('/days', {
        method: 'POST',
        body: JSON.stringify(item),
      }).then(d => d.day),
    update: (id: string, updates: Partial<Day>) =>
      request<{ day: Day }>(`/days/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => d.day),
    remove: (id: string) => request(`/days/${id}`, { method: 'DELETE' }),
  },

  // 笔记
  notes: {
    getAll: () => request<{ notes: Note[] }>('/notes').then(d => d.notes || []),
    create: (item: Partial<Note>) =>
      request<{ note: Note }>('/notes', {
        method: 'POST',
        body: JSON.stringify(item),
      }).then(d => d.note),
    update: (id: string, updates: Partial<Note>) =>
      request<{ note: Note }>(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => d.note),
    remove: (id: string) => request(`/notes/${id}`, { method: 'DELETE' }),
  },

  // 习惯
  habits: {
    getAll: () => request<{ habits: Habit[] }>('/habits').then(d => d.habits || []),
    create: (item: Partial<Habit>) =>
      request<{ habit: Habit }>('/habits', {
        method: 'POST',
        body: JSON.stringify(item),
      }).then(d => d.habit),
    update: (id: string, updates: Partial<Habit>) =>
      request<{ habit: Habit }>(`/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => d.habit),
    remove: (id: string) => request(`/habits/${id}`, { method: 'DELETE' }),
  },

  // 心情
  moods: {
    getAll: () => request<{ moods: Mood[] }>('/moods').then(d => d.moods || []),
    create: (item: Partial<Mood>) =>
      request<{ mood: Mood }>('/moods', {
        method: 'POST',
        body: JSON.stringify(item),
      }).then(d => d.mood),
    update: (id: string, updates: Partial<Mood>) =>
      request<{ mood: Mood }>(`/moods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => d.mood),
    remove: (id: string) => request(`/moods/${id}`, { method: 'DELETE' }),
  },

  // 提醒
  reminders: {
    getAll: () =>
      request<{ reminders: Reminder[] }>('/reminders').then(d => d.reminders || []),
    create: (item: Partial<Reminder>) =>
      request<{ reminder: Reminder }>('/reminders', {
        method: 'POST',
        body: JSON.stringify(item),
      }).then(d => d.reminder),
    update: (id: string, updates: Partial<Reminder>) =>
      request<{ reminder: Reminder }>(`/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }).then(d => d.reminder),
    remove: (id: string) => request(`/reminders/${id}`, { method: 'DELETE' }),
  },

  // 回收站
  trash: {
    getAll: () =>
      request<{ trash: DeletedItem[] }>('/trash').then(d => d.trash || []),
    restore: (id: string) => request(`/trash/${id}/restore`, { method: 'POST' }),
    delete: (id: string) => request(`/trash/${id}`, { method: 'DELETE' }),
  },

  // AI
  ai: {
    chat: (message: string) =>
      request<{ response: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }).then(d => d.response),
    analysis: (moodData: unknown[]) =>
      request<{ analysis: unknown }>('/ai/analysis', {
        method: 'POST',
        body: JSON.stringify({ moodData }),
      }).then(d => d.analysis),
  },

  // 签到
  checkin: {
    getStatus: () => request<CheckinStatus>('/checkin/status'),
    checkin: () => request<CheckinResult>('/checkin', { method: 'POST' }),
    getTitles: () => request<{ titles: UserTitle[] }>('/checkin/titles').then(d => d.titles),
  },
};
