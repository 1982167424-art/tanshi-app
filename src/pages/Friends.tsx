import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Inbox, Send, MessageSquare, Shield, X, Check, QrCode, Search as SearchIcon, MessageCircle, Ban } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useFriendStore } from '@/store/useFriendStore';
import { formatDateTime } from '@/utils/date';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const { friends, receivedRequests, sentRequests, loadFriends, loadRequests, acceptRequest, rejectRequest, replyRequest, removeFriend, unreadCount, loadUnread } = useFriendStore();
  const [activeTab, setActiveTab] = useState<'list' | 'received' | 'sent'>('list');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReply, setShowReply] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<{ uid: string; name: string } | null>(null);

  useEffect(() => { loadFriends(); loadRequests(); loadUnread(); }, []);

  const handleAccept = async (id: string, permission: string) => {
    await acceptRequest(id, permission);
    setShowPermissionModal(null);
  };

  const handleReply = async (id: string) => {
    const text = replyText[id];
    if (!text?.trim()) return;
    await replyRequest(id, text.trim());
    setReplyText({ ...replyText, [id]: '' });
    setShowReply(null);
  };

  const handleDeleteFriend = async (uid: string) => {
    await removeFriend(uid);
    setConfirmDelete(null);
  };

  const handleBlockFriend = async (uid: string) => {
    try {
      await useFriendStore.getState().blockUser(uid);
    } catch {}
  };

  const tabs = [
    { key: 'list' as const, label: '好友', icon: <Users size={16} />, count: friends.length },
    { key: 'received' as const, label: '收到的申请', icon: <Inbox size={16} />, count: unreadCount },
    { key: 'sent' as const, label: '发出的申请', icon: <Send size={16} />, count: sentRequests.length },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-amber-900 dark:text-gray-100">好友</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/friends/scan')}><QrCode size={16} /> 扫码</Button>
          <Button size="sm" onClick={() => navigate('/search')}><SearchIcon size={16} /> 搜索</Button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-white/50 dark:bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-serif transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md' : 'text-orange-700 hover:bg-orange-100 dark:text-gray-300 dark:hover:bg-white/10'}`}>
            {tab.icon} {tab.label}
            {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/30 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <GlassCard className="p-8 text-center"><p className="text-orange-500 font-serif dark:text-gray-400">还没有好友，去搜索页面添加吧</p></GlassCard>
          ) : friends.map(f => (
            <GlassCard key={f.friend_uid} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/user/${f.friend_uid}`)}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-sm font-serif text-white overflow-hidden">
                  {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : f.username[0]}
                </div>
                <div>
                  <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">{f.username}</p>
                  <p className="text-xs text-orange-500 dark:text-gray-400">UID: {f.friend_uid}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/chat/${f.friend_uid}`); }} className="p-1 text-orange-400 hover:text-orange-600" title="发消息"><MessageCircle size={16} /></button>
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-white/10 dark:text-gray-400">{f.permission === 'full' ? '全部权限' : '仅聊天'}</span>
                <button onClick={(e) => { e.stopPropagation(); setConfirmBlock({ uid: f.friend_uid, name: f.username }); }} className="p-1 text-gray-400 hover:text-red-500" title="拉黑"><Ban size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(f.friend_uid); }} className="p-1 text-red-400 hover:text-red-600" title="删除好友"><X size={16} /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'received' && (
        <div className="space-y-2">
          {receivedRequests.length === 0 ? (
            <GlassCard className="p-8 text-center"><p className="text-orange-500 font-serif dark:text-gray-400">暂无新的好友申请</p></GlassCard>
          ) : receivedRequests.map(r => (
            <GlassCard key={r.id} className="p-4">
              <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => navigate(`/user/${r.from_uid}`)}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-sm font-serif text-white overflow-hidden">
                  {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover" /> : (r.username || '?')[0]}
                </div>
                <div>
                  <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">{r.username || r.from_uid}</p>
                  <p className="text-xs text-orange-500 dark:text-gray-400">{formatDateTime(r.created_at)}</p>
                </div>
              </div>
              {r.reason && <p className="text-sm text-amber-700 mb-2 dark:text-gray-300">申请理由：{r.reason}</p>}
              {r.reply && <p className="text-sm text-green-600 mb-2 dark:text-green-400">我的回复：{r.reply}</p>}
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setShowPermissionModal(r.id)}><Check size={14} /> 接受</Button>
                <button onClick={() => rejectRequest(r.id)} className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20">拒绝</button>
                <button onClick={() => setShowReply(showReply === r.id ? null : r.id)} className="px-3 py-1 text-sm text-orange-500 hover:bg-orange-50 rounded-lg dark:hover:bg-orange-900/20">
                  <MessageSquare size={14} className="inline mr-1" />回复
                </button>
              </div>
              {showReply === r.id && (
                <div className="mt-2 flex gap-2">
                  <input value={replyText[r.id] || ''} onChange={e => setReplyText({ ...replyText, [r.id]: e.target.value })} placeholder="输入回复..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-orange-200 focus:border-orange-400 focus:outline-none dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300" />
                  <Button size="sm" onClick={() => handleReply(r.id)}>发送</Button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-2">
          {sentRequests.length === 0 ? (
            <GlassCard className="p-8 text-center"><p className="text-orange-500 font-serif dark:text-gray-400">暂无发出的申请</p></GlassCard>
          ) : sentRequests.map(r => (
            <GlassCard key={r.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-sm font-serif text-white overflow-hidden">
                  {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover" /> : (r.username || '?')[0]}
                </div>
                <div>
                  <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">{r.username || r.to_uid}</p>
                  <p className="text-xs text-orange-500 dark:text-gray-400">申请理由：{r.reason || '无'} · {formatDateTime(r.created_at)}</p>
                </div>
              </div>
              {r.reply && <p className="text-xs text-green-600 dark:text-green-400">对方回复：{r.reply}</p>}
            </GlassCard>
          ))}
        </div>
      )}

      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setShowPermissionModal(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-4 dark:text-gray-100">选择朋友权限</h4>
            <div className="space-y-3">
              <button onClick={() => handleAccept(showPermissionModal, 'chat_only')}
                className="w-full p-3 rounded-xl border border-orange-200 text-left hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">仅聊天</p>
                <p className="text-xs text-orange-500 dark:text-gray-400">只能互相聊天</p>
              </button>
              <button onClick={() => handleAccept(showPermissionModal, 'full')}
                className="w-full p-3 rounded-xl border border-orange-200 text-left hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5">
                <p className="font-serif font-semibold text-amber-900 dark:text-gray-100">全部权限</p>
                <p className="text-xs text-orange-500 dark:text-gray-400">聊天、运动情况、空间、状态</p>
              </button>
            </div>
            <button onClick={() => setShowPermissionModal(null)} className="mt-4 w-full text-center text-sm text-orange-500 hover:text-orange-600">取消</button>
          </GlassCard>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">删除好友</h4>
            <p className="text-orange-700 font-serif mb-4 dark:text-gray-300">确定要删除该好友吗？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={() => handleDeleteFriend(confirmDelete)} className="flex-1">删除</Button>
            </div>
          </GlassCard>
        </div>
      )}

      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setConfirmBlock(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">拉黑 {confirmBlock.name}</h4>
            <p className="text-orange-700 font-serif mb-4 dark:text-gray-300">拉黑后将解除好友关系，对方无法再给你发消息或看到你的动态。</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmBlock(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={async () => { await handleBlockFriend(confirmBlock.uid); setConfirmBlock(null); }} className="flex-1">拉黑</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Friends;
