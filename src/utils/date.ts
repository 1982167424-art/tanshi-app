export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const generateUid = (): string => {
  return 'TS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 6).toUpperCase();
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const calculateAge = (birthday: string): number => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const isFourteenBirthdayPassed = (birthday: string): boolean => {
  const birthDate = new Date(birthday);
  const fourteenthBirthday = new Date(birthDate);
  fourteenthBirthday.setFullYear(birthDate.getFullYear() + 14);
  return new Date() >= fourteenthBirthday;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return '凌晨好';
  if (hour >= 6 && hour < 9) return '早上好';
  if (hour >= 9 && hour < 12) return '上午好';
  if (hour >= 12 && hour < 14) return '中午好';
  if (hour >= 14 && hour < 18) return '下午好';
  if (hour >= 18 && hour < 22) return '晚上好';
  return '夜深了';
};

export const getDaysDiff = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getNextAnniversary = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const thisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (thisYear >= today) {
    return formatDate(thisYear);
  }
  const nextYear = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
  return formatDate(nextYear);
};

export const formatSeconds = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map(v => String(v).padStart(2, '0')).join(':');
};

export const getStreakDays = (checkDates: string[]): number => {
  if (checkDates.length === 0) return 0;
  const sorted = [...checkDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
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
};

export const getDaysSince = (dateStr: string): number => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};
