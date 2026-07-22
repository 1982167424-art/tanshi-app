export interface User {
  uid: string;
  username: string;
  password?: string;
  birthday: string;
  isTeenMode: boolean;
  avatar: string;
  createdAt: string;
}

export type DayType = 'anniversary' | 'countdown' | 'past' | 'timer' | 'minicountdown';

export interface Day {
  id: string;
  userUid: string;
  type: DayType;
  title: string;
  targetDate: string;
  note: string;
  countdownSeconds: number;
  initialSeconds: number;
  isRunning: boolean;
  createdAt: string;
}

export type NoteCategory = 'note' | 'todo' | 'inspiration' | 'life';

export interface Note {
  id: string;
  userUid: string;
  category: NoteCategory;
  title: string;
  content: string;
  updatedAt: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  userUid: string;
  emoji: string;
  name: string;
  checkDates: string[];
  createdAt: string;
}

export type MoodType = 'good' | 'normal' | 'bad';

export interface Mood {
  id: string;
  userUid: string;
  moodType: MoodType;
  date: string;
  note: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userUid: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type ReminderFrequency = 'daily' | 'weekdays' | 'weekends';

export interface Reminder {
  id: string;
  userUid: string;
  habitId: string;
  habitName: string;
  habitEmoji: string;
  time: string;
  frequency: ReminderFrequency;
  enabled: boolean;
}

export interface AIMoodAnalysis {
  summary: string;
  suggestion: string;
  encouragement: string;
}

export type DeletedItemType = 'day' | 'note' | 'habit';

export interface DeletedItem {
  id: string;
  userUid: string;
  type: DeletedItemType;
  data: Day | Note | Habit;
  deletedAt: string;
}

// 签到与成长体系
export interface CheckinStatus {
  checked_in_today: boolean;
  streak_days: number;
  total_points: number;
  total_checkin_days: number;
  last_checkin_date: string | null;
  days_since_last_checkin: number;
  break_warning: boolean;
  break_message: string;
}

export interface CheckinResult {
  points_earned: number;
  total_points: number;
  streak_days: number;
  total_checkin_days: number;
  new_titles: NewTitle[];
  points_deducted: number;
  auto_renewed: boolean;
  previous_streak?: number;
}

export interface NewTitle {
  code: string;
  name: string;
  type: string;
}

export interface UserTitle {
  id: string;
  code: string;
  name: string;
  type: string;
  is_permanent: boolean;
  unlocked_at: string;
}

// ============ 社交功能 ============

export interface FriendRequest {
  id: string;
  from_uid: string;
  to_uid: string;
  reason: string;
  reply: string;
  permission: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  username?: string;
  avatar?: string;
}

export interface Friend {
  friend_uid: string;
  permission: string;
  created_at: string;
  username: string;
  avatar: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  avatar: string;
  createdAt: string;
}

// ============ 空间（朋友圈） ============

export interface Post {
  id: string;
  user_uid: string;
  content: string;
  images: string[];
  video: string;
  visibility: 'all' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
  username: string;
  avatar: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_uid: string;
  content: string;
  created_at: string;
  username: string;
  avatar: string;
}

// ============ 状态 ============

export interface Status {
  id: string;
  user_uid: string;
  content: string;
  emoji: string;
  background: string;
  expires_at: string;
  created_at: string;
  username: string;
  avatar: string;
  isExpired: boolean;
}

// ============ 好友聊天 ============

export interface FriendMessage {
  id: string;
  from_uid: string;
  to_uid: string;
  content: string;
  msg_type: 'text' | 'image' | 'video' | 'file' | 'location' | 'redpacket' | 'transfer' | 'music' | 'favorite';
  extra: Record<string, unknown>;
  created_at: string;
  username: string;
  avatar: string;
}

export interface FriendProfile {
  uid: string;
  username: string;
  avatar: string;
  createdAt: string;
  isFriend: boolean;
}

export interface Favorite {
  id: string;
  fav_type: string;
  fav_id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: string;
  created_at: string;
}
