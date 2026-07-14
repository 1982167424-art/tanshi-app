import React, { useRef } from 'react';
import { Camera, Calendar, Hash, Clock, FileText, Repeat, Heart, MessageCircleHeart } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';
import { formatDateTime, calculateAge } from '@/utils/date';

const Profile: React.FC = () => {
  const { currentUser, updateUser } = useAuthStore();
  const { getUserDays } = useDaysStore();
  const { getUserNotes } = useNotesStore();
  const { getUserHabits } = useHabitsStore();
  const { getUserMoods } = useMoodStore();
  const { getUserConversations } = useCompanionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTeen = currentUser?.isTeenMode;
  const daysCount = getUserDays().length;
  const notesCount = getUserNotes().length;
  const habitsCount = getUserHabits().length;
  const moodsCount = getUserMoods().length;
  const conversationsCount = getUserConversations().length;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const avatar = event.target?.result as string;
      updateUser({ avatar });
    };
    reader.readAsDataURL(file);
  };

  const stats = [
    { icon: Calendar, label: '日子', value: daysCount, color: 'from-amber-400 to-orange-400' },
    { icon: FileText, label: '笔记', value: notesCount, color: 'from-blue-400 to-cyan-400' },
    { icon: Repeat, label: '习惯', value: habitsCount, color: 'from-green-400 to-emerald-400' },
    { icon: Heart, label: '心情', value: moodsCount, color: 'from-pink-400 to-rose-400' },
  ];

  if (isTeen) {
    stats.push({ icon: MessageCircleHeart, label: '对话', value: conversationsCount, color: 'from-orange-400 to-pink-400' });
  }

  const age = currentUser?.birthday ? calculateAge(currentUser.birthday) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <GlassCard className="p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div 
              onClick={handleAvatarClick}
              className={`
                w-28 h-28 rounded-full flex items-center justify-center text-4xl
                ${isTeen 
                  ? 'bg-gradient-to-br from-orange-300 to-pink-400' 
                  : 'bg-gradient-to-br from-amber-300 to-orange-400'
                }
                text-white shadow-xl cursor-pointer
                transition-transform hover:scale-105
              `}
            >
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{currentUser?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer group-hover:scale-110 transition-transform">
              <Camera size={18} className="text-amber-500" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-serif font-bold text-amber-900 mb-2 dark:text-gray-100">
              {currentUser?.username}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-sm text-amber-600 font-serif bg-amber-50 px-3 py-1 rounded-full dark:bg-[#0f3460]/30 dark:text-gray-400">
                <Hash size={14} /> UID: {currentUser?.uid}
              </span>
              {isTeen && (
                <span className="flex items-center gap-1.5 text-sm text-orange-600 font-serif bg-orange-50 px-3 py-1 rounded-full">
                  🌈 青少年模式
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-amber-600 font-serif dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                注册于 {currentUser?.createdAt ? formatDateTime(currentUser.createdAt) : '-'}
              </span>
              {age !== null && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {age} 岁
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-serif font-semibold text-amber-900 mb-5 dark:text-gray-100">
          数据统计
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`
                w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${stat.color}
                flex items-center justify-center shadow-md
              `}>
                <stat.icon size={24} className="text-white" />
              </div>
              <p className="text-2xl font-serif font-bold text-amber-900 dark:text-gray-100">{stat.value}</p>
              <p className="text-sm text-amber-600 font-serif dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-lg font-serif font-semibold text-amber-900 mb-5 dark:text-gray-100">
          账号信息
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-amber-100 dark:border-white/10">
            <span className="text-amber-700 font-serif dark:text-gray-300">用户名</span>
            <span className="text-amber-900 font-serif font-medium dark:text-gray-100">{currentUser?.username}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-amber-100 dark:border-white/10">
            <span className="text-amber-700 font-serif dark:text-gray-300">UID</span>
            <span className="text-amber-900 font-serif font-medium dark:text-gray-100">{currentUser?.uid}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-amber-100 dark:border-white/10">
            <span className="text-amber-700 font-serif dark:text-gray-300">出生日期</span>
            <span className="text-amber-900 font-serif font-medium dark:text-gray-100">{currentUser?.birthday || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-amber-100 dark:border-white/10">
            <span className="text-amber-700 font-serif dark:text-gray-300">当前模式</span>
            <span className={`font-serif font-medium ${isTeen ? 'text-orange-600' : 'text-amber-900 dark:text-gray-100'}`}>
              {isTeen ? '🌈 青少年模式' : '标准模式'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-amber-700 font-serif dark:text-gray-300">注册时间</span>
            <span className="text-amber-900 font-serif font-medium dark:text-gray-100">
              {currentUser?.createdAt ? formatDateTime(currentUser.createdAt) : '-'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Profile;
