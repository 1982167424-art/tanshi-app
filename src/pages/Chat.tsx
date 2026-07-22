import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/utils/api';
import { formatDateTime } from '@/utils/date';
import { FriendMessage, FriendProfile } from '@/types';

const Chat: React.FC = () => {
  const { friendUid } = useParams<{ friendUid: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendUid) return;
    Promise.all([
      api.friends.getProfile(friendUid),
      api.messages.getMessages(friendUid),
    ]).then(([profile, msgs]) => {
      if (profile) setFriendProfile({ ...profile.profile, isFriend: profile.isFriend });
      setMessages(msgs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [friendUid]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !friendUid || sending) return;
    setSending(true);
    try {
      const result = await api.messages.send(friendUid, text);
      setMessages(prev => [...prev, result.message]);
      setInputText('');
    } catch (e) { console.error(e); }
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-180px)] min-h-[500px] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-200/50 bg-white/50 dark:bg-[#16213e]/40 dark:border-white/10 rounded-t-xl">
        <button onClick={() => navigate(-1)} className="text-orange-600 hover:text-orange-700"><ArrowLeft size={20} /></button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-sm font-serif text-white overflow-hidden">
          {friendProfile?.avatar ? <img src={friendProfile.avatar} className="w-full h-full object-cover" /> : (friendProfile?.username || '?')[0]}
        </div>
        <span className="font-serif font-semibold text-amber-900 dark:text-gray-100">{friendProfile?.username || '好友'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <User size={48} className="text-orange-200 mb-3" />
            <p className="text-orange-400 font-serif text-sm dark:text-gray-500">开始和 TA 聊天吧</p>
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from_uid === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.from_uid === currentUser?.uid
              ? 'bg-gradient-to-br from-orange-400 to-pink-400 text-white rounded-br-sm'
              : 'bg-white/90 text-amber-900 border border-orange-100 rounded-bl-sm dark:bg-[#16213e]/80 dark:text-gray-100 dark:border-white/10'
            }`}>
              <p className="font-serif leading-relaxed whitespace-pre-wrap text-base">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.from_uid === currentUser?.uid ? 'text-orange-100' : 'text-orange-400 dark:text-gray-500'}`}>
                {formatDateTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-orange-200/50 bg-orange-50/30 dark:border-white/10 dark:bg-[#16213e]/20 rounded-b-xl">
        <div className="flex gap-2">
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="发送消息..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-2xl focus:border-orange-400 focus:outline-none text-sm font-serif dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
