import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message } from '@/types';
import { generateId } from '@/utils/date';
import { getAIResponse } from '@/utils/aiResponse';
import { useAuthStore } from './useAuthStore';

interface CompanionState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isTyping: boolean;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  sendMessage: (content: string) => void;
  getUserConversations: () => Conversation[];
  getCurrentConversation: () => Conversation | null;
}

export const useCompanionStore = create<CompanionState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isTyping: false,

      getUserConversations: () => {
        const currentUser = useAuthStore.getState().currentUser;
        if (!currentUser) return [];
        return get().conversations
          .filter(c => c.userUid === currentUser.uid)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getCurrentConversation: () => {
        const { currentConversationId, conversations } = get();
        if (!currentConversationId) return null;
        return conversations.find(c => c.id === currentConversationId) || null;
      },

      createConversation: () => {
        const currentUser = useAuthStore.getState().currentUser;
        if (!currentUser) return '';

        const now = new Date().toISOString();
        const newConv: Conversation = {
          id: generateId(),
          userUid: currentUser.uid,
          title: '新的对话',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set({ 
          conversations: [...get().conversations, newConv],
          currentConversationId: newConv.id,
        });
        return newConv.id;
      },

      deleteConversation: (id) => {
        const { currentConversationId, conversations } = get();
        set({
          conversations: conversations.filter(c => c.id !== id),
          currentConversationId: currentConversationId === id ? null : currentConversationId,
        });
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      sendMessage: async (content) => {
        const { currentConversationId, conversations } = get();
        const currentUser = useAuthStore.getState().currentUser;
        if (!currentUser) return;

        let convId = currentConversationId;
        if (!convId) {
          convId = get().createConversation();
        }

        const userMsg: Message = {
          id: generateId(),
          conversationId: convId,
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        };

        set({
          conversations: get().conversations.map(c => {
            if (c.id !== convId) return c;
            const newTitle = c.messages.length === 0 ? content.slice(0, 15) : c.title;
            return {
              ...c,
              title: newTitle,
              messages: [...c.messages, userMsg],
              updatedAt: new Date().toISOString(),
            };
          }),
          isTyping: true,
        });

        // 异步调用Mimo API
        try {
          const aiContent = await getAIResponse(content);
          const aiMsg: Message = {
            id: generateId(),
            conversationId: convId,
            role: 'ai',
            content: aiContent,
            createdAt: new Date().toISOString(),
          };

          set({
            conversations: get().conversations.map(c => {
              if (c.id !== convId) return c;
              return {
                ...c,
                messages: [...c.messages, aiMsg],
                updatedAt: new Date().toISOString(),
              };
            }),
            isTyping: false,
          });
        } catch (error) {
          console.error('AI响应失败:', error);
          set({ isTyping: false });
        }
      },
    }),
    {
      name: 'tanshi-companion',
    }
  )
);
