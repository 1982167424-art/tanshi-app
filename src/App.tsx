import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useReminderStore } from '@/store/useReminderStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { API_BASE } from '@/utils/api';
import Layout from '@/components/Layout/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Verify from '@/pages/Verify';
import Home from '@/pages/Home';
import Days from '@/pages/Days';
import Notes from '@/pages/Notes';
import Habits from '@/pages/Habits';
import Mood from '@/pages/Mood';
import Alarm from '@/pages/Alarm';
import Companion from '@/pages/Companion';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Search from '@/pages/Search';
import Trash from '@/pages/Trash';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  if (!currentUser) {
    return <Navigate to="/verify" replace state={{ from: { pathname: '/login' } }} />;
  }
  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  const location = useLocation();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const verified = sessionStorage.getItem('turnstile_verified');
  if (!verified) {
    return <Navigate to="/verify" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { currentUser, checkTeenModeAge, logout, syncUser } = useAuthStore();
  const { reminders } = useReminderStore();
  const { loadDays } = useDaysStore();
  const { loadNotes } = useNotesStore();
  const { loadHabits } = useHabitsStore();
  const { loadMoods } = useMoodStore();
  const { loadReminders } = useReminderStore();
  const notifiedTodayRef = useRef<Set<string>>(new Set());
  const loadedUserRef = useRef<string | null>(null);
  const tokenCheckedRef = useRef(false);

  // 启动时验证token有效性
  useEffect(() => {
    if (tokenCheckedRef.current) return;
    tokenCheckedRef.current = true;

    const token = sessionStorage.getItem('tanshi_token');
    if (token && currentUser) {
      fetch(`${API_BASE}/days`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }).then(res => {
        if (res.status === 401) { logout(); } else { syncUser(); }
      }).catch(() => {});
    } else if (currentUser && !token) {
      logout();
    }
  }, [currentUser, logout, syncUser]);

  useEffect(() => {
    // 必须同时有currentUser和有效的token才能加载数据
    const token = sessionStorage.getItem('tanshi_token');
    if (currentUser && token) {
      checkTeenModeAge();
      if (loadedUserRef.current !== currentUser.uid) {
        loadedUserRef.current = currentUser.uid;
        Promise.all([
          loadDays(),
          loadNotes(),
          loadHabits(),
          loadMoods(),
          loadReminders(),
        ]).catch(error => {
          console.error('加载数据失败:', error);
        });
      }
    } else {
      loadedUserRef.current = null;
    }
  }, [currentUser, checkTeenModeAge, loadDays, loadNotes, loadHabits, loadMoods, loadReminders]);

  useEffect(() => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayOfWeek = now.getDay();
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      // 清理过期的已通知记录（新的一天）
      if (notifiedTodayRef.current.size > 0) {
        const firstKey = Array.from(notifiedTodayRef.current)[0];
        if (firstKey && !firstKey.startsWith(todayKey)) {
          notifiedTodayRef.current = new Set();
        }
      }

      const userReminders = reminders.filter(r => r.userUid === currentUser?.uid && r.enabled);

      userReminders.forEach((reminder) => {
        const notifyKey = `${todayKey}-${reminder.id}`;
        if (notifiedTodayRef.current.has(notifyKey)) return;
        if (reminder.time !== currentTime) return;

        let shouldNotify = false;
        if (reminder.frequency === 'daily') {
          shouldNotify = true;
        } else if (reminder.frequency === 'weekdays') {
          shouldNotify = dayOfWeek >= 1 && dayOfWeek <= 5;
        } else if (reminder.frequency === 'weekends') {
          shouldNotify = dayOfWeek === 0 || dayOfWeek === 6;
        }

        if (shouldNotify) {
          // 区分习惯提醒(有habitId)和独立闹钟(无habitId)
          if (reminder.habitId) {
            new Notification('探时 - 习惯打卡提醒', {
              body: `该打卡【${reminder.habitName}】啦～`,
              icon: '/favicon.ico',
            });
          } else {
            new Notification('⏰ 探时 - 闹钟提醒', {
              body: reminder.habitName || '闹钟时间到了',
              icon: '/favicon.ico',
            });
          }
          notifiedTodayRef.current.add(notifyKey);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [reminders, currentUser]);

  return (
    <Router>
      <Routes>
        <Route path="/verify" element={<Verify />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Home />} />
          <Route path="days" element={<Days />} />
          <Route path="notes" element={<Notes />} />
          <Route path="habits" element={<Habits />} />
          <Route path="mood" element={<Mood />} />
          <Route path="alarm" element={<Alarm />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="search" element={<Search />} />
          <Route path="trash" element={<Trash />} />
          <Route path="companion" element={<Companion />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
