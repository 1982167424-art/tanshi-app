import { Day, Note, Habit, Mood, Reminder, DeletedItem, User, CheckinStatus, CheckinResult, UserTitle, UserProfile, FriendRequest, Friend, Post, PostComment, Status, FriendMessage, Favorite } from '@/types';

// API 基址：
// - 本地开发：走 Vite proxy（空串 + /api → localhost:3001）
// - 生产环境：直连 https://api.textime.top（浏览器可通过 Cloudflare 质询；
//   避免 Vercel 服务器端 rewrite 被 Cloudflare 判定为机器人而返回 JS Challenge）
// - 可用 VITE_API_BASE 环境变量覆盖
export const API_BASE = (import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://api.textime.top' : '')) + '/api';

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
async function request<T = unknown>(url: string, options?: RequestInit, timeoutMs = 15000): Promise<T> {
  const token = getToken();
  // FormData 不能手动设置 Content-Type，浏览器会自动带 multipart/form-data + boundary
  const isFormData = options?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}${url}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    }, timeoutMs);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    console.error(`API请求失败 [${url}]:`, error);
    throw new Error('网络连接失败，请检查网络后重试');
  }

  const contentType = res.headers.get('content-type') || '';
  const cloudflareMitigation = res.headers.get('cf-mitigated');
  if (!contentType.includes('application/json')) {
    if (cloudflareMitigation === 'challenge') {
      throw new Error('API 被 Cloudflare 安全验证拦截，请检查 API 域名的 WAF/机器人规则');
    }
    throw new Error('服务器响应异常，请稍后重试');
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
    register: (username: string, password: string, birthday: string, turnstileToken?: string, turnstileRandstr?: string, phone?: string, smsCode?: string) =>
      request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, birthday, turnstileToken, turnstileRandstr, phone, smsCode }),
      }),
    login: (username: string, password: string, accessCode?: string, turnstileToken?: string, turnstileRandstr?: string) =>
      request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, accessCode, turnstileToken, turnstileRandstr }),
      }),
  },

  // 验证码
  verify: {
    sendSms: (phone: string) =>
      request('/verify/sms/send', { method: 'POST', body: JSON.stringify({ phone }) }),
    verifySms: (phone: string, code: string) =>
      request('/verify/sms/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
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
      }, 60000).then(d => d.response),
    analysis: (moodData: unknown[]) =>
      request<{ analysis: unknown }>('/ai/analysis', {
        method: 'POST',
        body: JSON.stringify({ moodData }),
      }, 60000).then(d => d.analysis),
  },

  // 签到
  checkin: {
    getStatus: () => request<CheckinStatus>('/checkin/status'),
    checkin: () => request<CheckinResult>('/checkin', { method: 'POST' }),
    getTitles: () => request<{ titles: UserTitle[] }>('/checkin/titles').then(d => d.titles),
  },

  // 好友系统
  friends: {
    search: (q: string, by: string = 'uid') =>
      request<{ users: UserProfile[] }>(`/friends/search?q=${encodeURIComponent(q)}&by=${by}`).then(d => d.users),
    getProfile: (uid: string) =>
      request<{ profile: UserProfile; isFriend: boolean }>(`/friends/profile/${uid}`),
    sendRequest: (toUid: string, reason?: string, permission?: string) =>
      request<{ autoAccepted?: boolean; requestId?: string }>('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ toUid, reason: reason || '', permission: permission || 'chat_only' }),
      }),
    getReceivedRequests: () =>
      request<{ requests: FriendRequest[] }>('/friends/requests/received').then(d => d.requests),
    getSentRequests: () =>
      request<{ requests: FriendRequest[] }>('/friends/requests/sent').then(d => d.requests),
    replyRequest: (id: string, reply: string) =>
      request(`/friends/requests/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
    acceptRequest: (id: string, permission?: string) =>
      request(`/friends/requests/${id}/accept`, { method: 'POST', body: JSON.stringify({ permission: permission || 'chat_only' }) }),
    rejectRequest: (id: string) =>
      request(`/friends/requests/${id}/reject`, { method: 'POST' }),
    getAll: () =>
      request<{ friends: Friend[] }>('/friends').then(d => d.friends),
    remove: (uid: string) =>
      request(`/friends/${uid}`, { method: 'DELETE' }),
    updatePermission: (uid: string, permission: string) =>
      request(`/friends/${uid}/permission`, { method: 'PUT', body: JSON.stringify({ permission }) }),
    getUnread: () =>
      request<{ count: number }>('/friends/unread').then(d => d.count),
    block: (uid: string) =>
      request(`/friends/block/${uid}`, { method: 'POST' }),
    unblock: (uid: string) =>
      request(`/friends/block/${uid}`, { method: 'DELETE' }),
    getBlocklist: () =>
      request<{ list: Array<{ blocked_uid: string; username: string; avatar: string; created_at: string }> }>('/friends/blocklist').then(d => d.list),
  },

  // 空间（朋友圈）
  posts: {
    create: (formData: FormData) =>
      request<{ post: Post }>('/posts', {
        method: 'POST',
        body: formData,
        headers: {}, // 让浏览器自动设置 Content-Type（含 boundary）
      }).then(d => d.post),
    getFeed: (page = 1) =>
      request<{ posts: Post[] }>(`/posts/feed?page=${page}`).then(d => d.posts),
    getUserPosts: (uid: string, page = 1) =>
      request<{ posts: Post[] }>(`/posts/user/${uid}?page=${page}`).then(d => d.posts),
    delete: (id: string) =>
      request(`/posts/${id}`, { method: 'DELETE' }),
    like: (id: string) =>
      request<{ liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),
    getComments: (id: string, page = 1) =>
      request<{ comments: PostComment[] }>(`/posts/${id}/comments?page=${page}`).then(d => d.comments),
    addComment: (id: string, content: string) =>
      request<{ comment: PostComment }>(`/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }).then(d => d.comment),
    deleteComment: (id: string) =>
      request(`/posts/comments/${id}`, { method: 'DELETE' }),
  },

  // 状态
  statuses: {
    create: (content: string, emoji?: string, background?: string) =>
      request<{ status: Status }>('/statuses', {
        method: 'POST',
        body: JSON.stringify({ content, emoji, background }),
      }).then(d => d.status),
    getFriends: () =>
      request<{ statuses: Status[] }>('/statuses/friends').then(d => d.statuses),
    getUserStatuses: (uid: string) =>
      request<{ statuses: Status[] }>(`/statuses/user/${uid}`).then(d => d.statuses),
    delete: (id: string) =>
      request(`/statuses/${id}`, { method: 'DELETE' }),
  },

  // 好友私聊
  messages: {
    getChatList: () =>
      request<{ list: Array<{ friend_uid: string; username: string; avatar: string; lastMessage: string; lastMsgType: string; lastMessageAt: string }> }>('/messages').then(d => d.list),
    getMessages: (friendUid: string, page = 1) =>
      request<{ messages: FriendMessage[] }>(`/messages/${friendUid}?page=${page}`).then(d => d.messages),
    send: (toUid: string, content: string, msgType?: string, extra?: string, file?: File) => {
      if (file) {
        const formData = new FormData();
        formData.append('toUid', toUid);
        formData.append('content', content);
        if (msgType) formData.append('msgType', msgType);
        if (extra) formData.append('extra', extra);
        formData.append('file', file);
        return request<{ message: FriendMessage }>('/messages', {
          method: 'POST',
          body: formData,
          headers: {},
        });
      }
      return request<{ message: FriendMessage }>('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUid, content, msgType: msgType || 'text', extra: extra || '{}' }),
      });
    },
  },

  // 收藏
  favorites: {
    add: (favType: string, favId: string, title?: string, subtitle?: string, url?: string, icon?: string) =>
      request<{ favorite: Favorite }>('/favorites', {
        method: 'POST',
        body: JSON.stringify({ favType, favId, title, subtitle, url, icon }),
      }),
    remove: (favType: string, favId: string) =>
      request(`/favorites/${favType}/${favId}`, { method: 'DELETE' }),
    getAll: (type?: string) =>
      request<{ favorites: Favorite[] }>(`/favorites${type ? `?type=${type}` : ''}`).then(d => d.favorites),
  },
};
