import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useReminderStore } from '@/store/useReminderStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import Layout from '@/components/Layout/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Days from '@/pages/Days';
import Notes from '@/pages/Notes';
import Habits from '@/pages/Habits';
import Mood from '@/pages/Mood';
import Companion from '@/pages/Companion';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Search from '@/pages/Search';
import Trash from '@/pages/Trash';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
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

  // 启动时验证token有效性，并从后端同步最新用户信息
  useEffect(() => {
    if (tokenCheckedRef.current) return;
    tokenCheckedRef.current = true;

    const token = localStorage.getItem('tanshi_token');
    if (token && currentUser) {
      // 验证token是否仍然有效，并同步最新用户信息
      fetch('http://localhost:3001/api/days', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).then(res => {
        if (res.status === 401) {
          // Token无效，清除本地数据
          console.log('Token已失效，自动退出登录');
          logout();
        } else {
          // Token有效，从后端同步最新用户信息
          syncUser();
        }
      }).catch(() => {
        // 后端不可达，保持本地登录状态
        console.log('后端不可达，保持本地登录');
      });
    } else if (currentUser && !token) {
      // 有用户但无token（旧localStorage数据），自动退出
      logout();
    }
  }, [currentUser, logout, syncUser]);

  useEffect(() => {
    // 必须同时有currentUser和有效的token才能加载数据
    const token = localStorage.getItem('tanshi_token');
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
          new Notification('探时 - 习惯打卡提醒', {
            body: `该打卡【${reminder.habitName}】啦～`,
            icon: '/favicon.ico',
          });
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
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={currentUser ? <Navigate to="/" replace /> : <Register />} 
        />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Home />} />
          <Route path="days" element={<Days />} />
          <Route path="notes" element={<Notes />} />
          <Route path="habits" element={<Habits />} />
          <Route path="mood" element={<Mood />} />
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
