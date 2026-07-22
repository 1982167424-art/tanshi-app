import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Send, MessageCircleHeart, Menu, X, Smile, Frown, Meh } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useCompanionStore } from '@/store/useCompanionStore';
import { quickTopics, getAISuggestions } from '@/utils/aiResponse';
import { formatDateTime } from '@/utils/date';
import { Conversation } from '@/types';

const emotionIcons: Record<string, React.ReactNode> = {
  sad: <Frown size={12} />,
  happy: <Smile size={12} />,
  angry: <Frown size={12} />,
  tired: <Meh size={12} />,
  default: <Smile size={12} />,
};

const getEmotionFromText = (text: string): string => {
  if (/难过|伤心|哭|不开心|低落|郁闷|沮丧/.test(text)) return 'sad';
  if (/开心|高兴|快乐|兴奋|好棒|太好了|哈哈/.test(text)) return 'happy';
  if (/生气|愤怒|气死|讨厌|烦|恼火|不爽/.test(text)) return 'angry';
  if (/累|疲惫|困|没力气|辛苦|好累/.test(text)) return 'tired';
  return 'default';
};

const Companion: React.FC = () => {
  const { 
    getUserConversations, 
    currentConversationId, 
    setCurrentConversation,
    createConversation, 
    deleteConversation, 
    sendMessage,
    isTyping,
    getCurrentConversation,
  } = useCompanionStore();

  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = getUserConversations();
  const currentConversation = getCurrentConversation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickTopic = (text: string) => {
    sendMessage(text);
  };

  const handleNewChat = () => {
    createConversation();
    setShowSidebar(false);
  };

  const ConversationItem = ({ conv }: { conv: Conversation }) => (
    <div
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all mb-2
        ${currentConversationId === conv.id
          ? 'bg-gradient-to-r from-orange-200/70 to-amber-200/70 text-orange-900 dark:from-[#0f3460]/70 dark:to-[#16213e]/70 dark:text-gray-100'
          : 'bg-white/40 hover:bg-white/60 text-amber-800 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300'
        }
      `}
      onClick={() => {
        setCurrentConversation(conv.id);
        setShowSidebar(false);
      }}
    >
      <div className="flex items-center gap-2">
        <MessageCircleHeart size={18} className="flex-shrink-0" />
        <span className="font-serif text-sm truncate flex-1">
          {conv.title || '新的对话'}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteConfirm(conv.id);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-amber-400 hover:text-red-500 transition-all dark:hover:bg-red-900/30"
      >
        <Trash2 size={14} />
      </button>
      <p className="text-xs text-amber-500 mt-1 pl-6 dark:text-gray-500">
        {formatDateTime(conv.updatedAt)}
      </p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] animate-fade-in">
      <GlassCard className="h-full flex flex-col p-0 overflow-hidden bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-[#1a1a2e]/30 dark:to-[#16213e]/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-100/50 to-amber-100/50 dark:border-white/10 dark:from-[#16213e]/40 dark:to-[#1a1a2e]/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/60 text-orange-700 dark:hover:bg-white/10 dark:text-gray-300"
            >
              <Menu size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-xl shadow-md">
              🌈
            </div>
            <div>
              <h3 className="font-serif font-semibold text-orange-900 dark:text-gray-100">暖心小助手</h3>
              <p className="text-xs text-orange-600 dark:text-gray-400">
                {isTyping ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0s' }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
                    正在输入...
                  </span>
                ) : '我会一直陪着你 💛'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleNewChat} className="hidden sm:flex">
            <Plus size={16} /> 新对话
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className={`
            w-64 flex-shrink-0 border-r border-orange-200/50 p-3 overflow-y-auto
            bg-gradient-to-b from-orange-50/50 to-amber-50/50
            dark:border-white/10 dark:from-[#1a1a2e]/30 dark:to-[#16213e]/30
            fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
            transform transition-transform duration-300
            ${showSidebar ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-semibold text-orange-800 text-sm dark:text-gray-200">历史对话</h4>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-orange-100 text-orange-600 dark:hover:bg-white/10 dark:text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 text-white font-serif font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} /> 新建对话
            </button>

            {conversations.length === 0 ? (
              <p className="text-center text-sm text-orange-500 font-serif py-8 dark:text-gray-500">
                还没有对话记录
              </p>
            ) : (
              <div>
                {conversations.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))}
              </div>
            )}
          </div>

          {showSidebar && (
            <div
              className="fixed inset-0 bg-orange-900/20 z-30 lg:hidden dark:bg-black/40"
              onClick={() => setShowSidebar(false)}
            />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!currentConversation || currentConversation.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-5xl mb-4 shadow-lg animate-float">
                    🌈
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-orange-900 mb-2 dark:text-gray-100">
                    你好呀～ 我是小暖
                  </h3>
                  <p className="text-orange-600 font-serif max-w-sm mb-8 dark:text-gray-400">
                    不管是开心的事还是难过的事，都可以和我说哦。
                    我会一直在这里陪着你的 💛
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
                    {quickTopics.slice(0, 6).map((topic) => (
                      <button
                        key={topic.label}
                        onClick={() => handleQuickTopic(topic.text)}
                        className="px-3 py-2.5 rounded-xl bg-white/70 border border-orange-200 text-orange-700 font-serif text-sm hover:bg-orange-50 hover:border-orange-300 transition-all dark:bg-[#16213e]/60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-[#0f3460]/60"
                      >
                        {topic.emoji} {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const msgs = currentConversation.messages;
                  const suggestions = getAISuggestions(msgs);
                  const lastAiIdx = msgs.length - 1;

                  return msgs.map((msg, idx) => {
                    const emotion = msg.role === 'user' ? getEmotionFromText(msg.content) : 'default';
                    const isLastAi = msg.role === 'ai' && idx === lastAiIdx && suggestions.length > 0;
                    return (
                      <div key={msg.id} className="mb-4">
                        <div
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                            max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl
                            transition-all duration-300
                            ${msg.role === 'user'
                              ? 'bg-gradient-to-br from-orange-400 to-pink-400 text-white rounded-br-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                              : 'bg-white/90 text-orange-900 border border-orange-100 rounded-bl-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 dark:bg-[#16213e]/80 dark:text-gray-100 dark:border-white/10'
                            }
                          `}>
                            <p className="font-serif leading-relaxed whitespace-pre-wrap text-base">
                              {msg.content}
                            </p>
                            <div className={`flex items-center justify-end gap-2 mt-2 ${msg.role === 'user' ? 'text-orange-100' : 'text-orange-400 dark:text-gray-500'}`}>
                              <span className="text-xs">{formatDateTime(msg.createdAt)}</span>
                              {msg.role === 'user' && (
                                <span className={`p-1 rounded-full ${emotion === 'sad' ? 'bg-blue-200/30' : emotion === 'happy' ? 'bg-yellow-200/30' : emotion === 'angry' ? 'bg-red-200/30' : 'bg-gray-200/30'}`}>
                                  {emotionIcons[emotion]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isLastAi && !isTyping && (
                          <div className="flex flex-wrap gap-2 mt-2 ml-2 animate-fade-in">
                            {suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => handleQuickTopic(s)}
                                className="px-3 py-1.5 rounded-full bg-white/80 border border-orange-200 text-orange-600 text-xs font-serif hover:bg-orange-50 hover:border-orange-300 transition-all dark:bg-[#16213e]/60 dark:border-white/10 dark:text-gray-400 dark:hover:bg-[#0f3460]/60"
                              >
                                💡 {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/80 border border-orange-100 px-4 py-3 rounded-2xl rounded-bl-sm dark:bg-[#16213e]/80 dark:border-white/10">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0s' }} />
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pb-3 pt-2 border-t border-orange-200/50 bg-orange-50/30 dark:border-white/10 dark:bg-[#16213e]/20">
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {quickTopics.map((topic) => (
                  <button
                    key={topic.label}
                    onClick={() => handleQuickTopic(topic.text)}
                    className="flex-shrink-0 px-3 py-1 rounded-full bg-white/70 border border-orange-200 text-orange-600 text-xs font-serif hover:bg-orange-50 transition-colors dark:bg-[#16213e]/60 dark:border-white/10 dark:text-gray-400 dark:hover:bg-[#0f3460]/60"
                  >
                    {topic.emoji} {topic.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="想说点什么..."
                  className="flex-1 px-4 py-3 font-serif bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-2xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-400 placeholder:text-gray-300 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-center text-xs text-orange-400/60 font-serif mt-1 dark:text-gray-600">AI生成可能有误，请注意核实</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm dark:bg-black/40"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <div className="text-center">
              <div className="text-5xl mb-3">🗑️</div>
              <h4 className="text-lg font-serif font-semibold text-orange-900 mb-2 dark:text-gray-100">
                删除对话
              </h4>
              <p className="text-orange-700 font-serif mb-6 dark:text-gray-300">
                确定要删除这段对话吗？删除后无法恢复哦。
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                  取消
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    deleteConversation(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1"
                >
                  删除
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Companion;
