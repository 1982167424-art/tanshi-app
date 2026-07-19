import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, CalendarDays, NotebookPen, Repeat, Heart, AlarmClock,
  MessageCircleHeart, User, Settings, Menu, X, Sparkles, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import EntertainmentSheet from '@/pages/Entertainment';
import LearningSheet from '@/pages/Learning';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showEntertainment, setShowEntertainment] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

  const isTeen = currentUser?.isTeenMode;

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/days', icon: CalendarDays, label: '日子' },
    { path: '/notes', icon: NotebookPen, label: '笔记' },
    { path: '/habits', icon: Repeat, label: '习惯' },
    { path: '/mood', icon: Heart, label: '心情' },
    { path: '/alarm', icon: AlarmClock, label: '闹钟' },
    { path: '/companion', icon: MessageCircleHeart, label: '暖心陪伴', highlight: true },
    { label: '娱乐', onClick: () => { setShowEntertainment(true); setMobileOpen(false); } },
    { label: '学习', onClick: () => { setShowLearning(true); setMobileOpen(false); } },
  ];

  const bottomItems = [
    { path: '/profile', icon: User, label: '个人信息' },
    { path: '/settings', icon: Settings, label: '设置' },
    { path: '/trash', icon: Trash2, label: '回收站' },
  ];

  const NavList = () => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          if (item.onClick) {
            return (
              <button
                key={i}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-serif transition-all duration-200 text-amber-700 hover:bg-white/50 hover:text-amber-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <span className="text-lg">{item.label === '娱乐' ? '🎮' : '📚'}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-serif
                transition-all duration-200
                ${isActive
                  ? isTeen
                    ? 'bg-gradient-to-r from-orange-200/80 to-amber-200/80 text-orange-900 shadow-md dark:from-[#0f3460]/80 dark:to-[#16213e]/80 dark:text-gray-100'
                    : 'bg-gradient-to-r from-amber-200/80 to-yellow-200/80 text-amber-900 shadow-md dark:from-[#0f3460]/80 dark:to-[#16213e]/80 dark:text-gray-100'
                  : 'text-amber-700 hover:bg-white/50 hover:text-amber-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200'
                }
                ${item.highlight ? 'relative' : ''}
              `}
            >
              {item.highlight && (
                <span className="absolute -top-1 -right-1">
                  <Sparkles size={16} className="text-orange-500 animate-pulse" />
                </span>
              )}
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-amber-200/50 space-y-1 dark:border-white/10">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-serif
              transition-all duration-200
              ${isActive
                ? 'bg-amber-200/70 text-amber-900 dark:bg-[#0f3460]/70 dark:text-gray-100'
                : 'text-amber-700 hover:bg-white/50 hover:text-amber-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200'
              }
            `}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 lg:hidden rounded-xl bg-white/70 backdrop-blur-md border border-amber-200 text-amber-700 shadow-md dark:bg-[#16213e]/70 dark:border-white/10 dark:text-gray-300"
      >
        <Menu size={24} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-amber-900/30 backdrop-blur-sm lg:hidden animate-fade-in dark:bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0
        bg-gradient-to-b ${isTeen
          ? 'from-orange-50/90 to-amber-50/90 dark:from-[#1a1a2e]/90 dark:to-[#16213e]/90'
          : 'from-amber-50/90 to-yellow-50/90 dark:from-[#1a1a2e]/90 dark:to-[#16213e]/90'
        }
        backdrop-blur-xl border-r border-amber-200/50 dark:border-white/10
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-5 border-b border-amber-200/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            <h1 className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">探时</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-amber-200/50 text-amber-600 dark:hover:bg-white/10 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div onClick={() => { navigate('/profile'); setMobileOpen(false); }} className="mx-3 mt-4 p-4 rounded-2xl bg-white/50 border border-amber-200/50 cursor-pointer hover:bg-white/70 transition-all dark:bg-[#0f3460]/30 dark:border-white/10 dark:hover:bg-[#0f3460]/50">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${isTeen ? 'bg-gradient-to-br from-orange-300 to-amber-400' : 'bg-gradient-to-br from-amber-300 to-yellow-400'} text-white shadow-md`}>
              {currentUser?.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <span>{currentUser?.username?.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif font-semibold text-amber-900 truncate dark:text-gray-100">{currentUser?.username}</p>
              <p className="text-xs text-amber-600 truncate dark:text-gray-400">UID: {currentUser?.uid}</p>
            </div>
          </div>
        </div>

        <NavList />
      </aside>

      <EntertainmentSheet visible={showEntertainment} onClose={() => setShowEntertainment(false)} />
      <LearningSheet visible={showLearning} onClose={() => setShowLearning(false)} />
    </>
  );
};

export default Sidebar;
