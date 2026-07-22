import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Shield, Copy, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useFriendStore } from '@/store/useFriendStore';
import { useAuthStore } from '@/store/useAuthStore';
import { UserProfile as UserProfileType } from '@/types';

const UserProfile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { getUserProfile, sendRequest } = useFriendStore();
  const currentUser = useAuthStore(s => s.currentUser);
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestPermission, setRequestPermission] = useState('chat_only');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid).then(result => {
      if (result) { setProfile(result.profile); setIsFriend(result.isFriend); }
      setLoading(false);
    });
  }, [uid]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-orange-500 font-serif">用户不存在</div>;
  if (profile.uid === currentUser?.uid) return <div className="text-center py-20 text-orange-500 font-serif">这是你自己哦</div>;

  const handleSendRequest = async () => {
    await sendRequest(profile.uid, requestReason, requestPermission);
    setSent(true);
    setShowRequestModal(false);
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(profile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 mb-4 font-serif text-sm">
        <ArrowLeft size={16} /> 返回
      </button>
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-2xl font-serif text-white overflow-hidden shadow-lg">
            {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : profile.username[0]}
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-900 dark:text-gray-100">{profile.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-orange-500 dark:text-gray-400">UID: {profile.uid}</p>
              <button onClick={handleCopyUid} className="text-orange-400 hover:text-orange-600">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-white/5 text-center">
            <p className="text-lg font-bold text-amber-900 dark:text-gray-100">{isFriend ? '好友' : '未添加'}</p>
            <p className="text-xs text-orange-500 dark:text-gray-400">关系状态</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-white/5 text-center">
            <p className="text-xs text-orange-500 dark:text-gray-400">注册时间</p>
            <p className="text-sm font-serif text-amber-900 dark:text-gray-100">{new Date(profile.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
        </div>

        {!isFriend && !sent ? (
          <Button onClick={() => setShowRequestModal(true)} className="w-full">
            <UserPlus size={16} /> 添加好友
          </Button>
        ) : sent ? (
          <div className="text-center p-3 rounded-xl bg-green-50 text-green-600 font-serif text-sm dark:bg-green-900/20 dark:text-green-400">
            申请已发送，等待对方确认
          </div>
        ) : (
          <div className="text-center p-3 rounded-xl bg-orange-50 text-orange-600 font-serif text-sm dark:bg-orange-900/20 dark:text-orange-400">
            <Shield size={14} className="inline mr-1" /> 已是好友
          </div>
        )}
      </GlassCard>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-4 dark:text-gray-100">发送好友申请</h4>
            <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)}
              placeholder="填写申请理由（选填）..." maxLength={100000}
              className="w-full h-24 p-3 rounded-xl border border-orange-200 text-sm font-serif resize-none focus:border-orange-400 focus:outline-none mb-4 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300" />
            <p className="text-sm font-serif text-amber-800 mb-2 dark:text-gray-300">朋友权限</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-orange-200 cursor-pointer hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                <input type="radio" name="permission" value="chat_only" checked={requestPermission === 'chat_only'} onChange={e => setRequestPermission(e.target.value)} className="text-orange-500" />
                <span className="text-sm font-serif text-amber-900 dark:text-gray-100">仅聊天</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-orange-200 cursor-pointer hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                <input type="radio" name="permission" value="full" checked={requestPermission === 'full'} onChange={e => setRequestPermission(e.target.value)} className="text-orange-500" />
                <span className="text-sm font-serif text-amber-900 dark:text-gray-100">聊天、运动情况、空间、状态</span>
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowRequestModal(false)} className="flex-1">取消</Button>
              <Button onClick={handleSendRequest} className="flex-1">发送</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
