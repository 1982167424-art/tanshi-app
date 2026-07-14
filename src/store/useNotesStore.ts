import { create } from 'zustand';
import { Note, NoteCategory, DeletedItem } from '@/types';
import { useAuthStore } from './useAuthStore';
import { api } from '@/utils/api';

interface NotesState {
  notes: Note[];
  deletedItems: DeletedItem[];
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userUid'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (deletedItemId: string) => Promise<void>;
  permanentlyDeleteNote: (deletedItemId: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  getUserNotes: () => Note[];
  getNotesByCategory: (category: NoteCategory) => Note[];
  searchNotes: (keyword: string) => Note[];
  getUserDeletedNotes: () => DeletedItem[];
  clearError: () => void;
}

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  deletedItems: [],
  isLoading: false,
  error: null,

  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const [notes, trashItems] = await Promise.all([
        api.notes.getAll(),
        api.trash.getAll(),
      ]);
      set({
        notes,
        deletedItems: trashItems.filter(item => item.type === 'note'),
        isLoading: false,
      });
    } catch (error) {
      console.error('加载笔记数据失败:', error);
      set({ isLoading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },

  getUserNotes: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().notes
      .filter(n => n.userUid === currentUser.uid)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getUserDeletedNotes: () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return [];
    return get().deletedItems.filter(
      item => item.userUid === currentUser.uid && item.type === 'note'
    );
  },

  getNotesByCategory: (category) => {
    return get().getUserNotes().filter(n => n.category === category);
  },

  searchNotes: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().getUserNotes().filter(n =>
      n.title.toLowerCase().includes(kw) ||
      n.content.toLowerCase().includes(kw)
    );
  },

  addNote: async (note) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    const now = new Date().toISOString();
    const newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
      ...note,
      userUid: currentUser.uid,
    };

    try {
      const created = await api.notes.create({ ...newNote, createdAt: now, updatedAt: now });
      set({ notes: [...get().notes, created] });
    } catch (error) {
      console.error('添加笔记失败:', error);
      set({ error: error instanceof Error ? error.message : '添加失败' });
    }
  },

  deleteNote: async (id) => {
    try {
      await api.notes.remove(id);
      set({ notes: get().notes.filter(n => n.id !== id) });
      await get().loadNotes();
    } catch (error) {
      console.error('删除笔记失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  restoreNote: async (deletedItemId) => {
    try {
      await api.trash.restore(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
      await get().loadNotes();
    } catch (error) {
      console.error('恢复笔记失败:', error);
      set({ error: error instanceof Error ? error.message : '恢复失败' });
    }
  },

  permanentlyDeleteNote: async (deletedItemId) => {
    try {
      await api.trash.delete(deletedItemId);
      set({ deletedItems: get().deletedItems.filter(d => d.id !== deletedItemId) });
    } catch (error) {
      console.error('永久删除笔记失败:', error);
      set({ error: error instanceof Error ? error.message : '删除失败' });
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updated = await api.notes.update(id, updates);
      set({
        notes: get().notes.map(n => n.id === id ? updated : n)
      });
    } catch (error) {
      console.error('更新笔记失败:', error);
      set({ error: error instanceof Error ? error.message : '更新失败' });
    }
  },

  clearError: () => set({ error: null }),
}));
