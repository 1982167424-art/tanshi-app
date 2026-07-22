import { create } from 'zustand';
import { api } from '@/utils/api';
import { Post, PostComment } from '@/types';

interface PostState {
  feed: Post[];
  userPosts: Post[];
  comments: PostComment[];
  isLoading: boolean;
  feedPage: number;

  loadFeed: (reset?: boolean) => Promise<void>;
  loadUserPosts: (uid: string) => Promise<void>;
  createPost: (formData: FormData) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export const usePostStore = create<PostState>()((set, get) => ({
  feed: [],
  userPosts: [],
  comments: [],
  isLoading: false,
  feedPage: 1,

  loadFeed: async (reset = false) => {
    const page = reset ? 1 : get().feedPage;
    set({ isLoading: true });
    try {
      const posts = await api.posts.getFeed(page);
      set({
        feed: reset ? posts : [...get().feed, ...posts],
        feedPage: page + 1,
        isLoading: false,
      });
    } catch { set({ isLoading: false }); }
  },

  loadUserPosts: async (uid) => {
    set({ isLoading: true });
    try {
      const posts = await api.posts.getUserPosts(uid);
      set({ userPosts: posts, isLoading: false });
    } catch { set({ isLoading: false }); }
  },

  createPost: async (formData) => {
    const post = await api.posts.create(formData);
    set({ feed: [post, ...get().feed] });
  },

  deletePost: async (id) => {
    await api.posts.delete(id);
    set({ feed: get().feed.filter(p => p.id !== id), userPosts: get().userPosts.filter(p => p.id !== id) });
  },

  toggleLike: async (id) => {
    const result = await api.posts.like(id);
    const update = (posts: Post[]) => posts.map(p =>
      p.id === id ? { ...p, liked: result.liked, likeCount: p.likeCount + (result.liked ? 1 : -1) } : p
    );
    set({ feed: update(get().feed), userPosts: update(get().userPosts) });
  },

  loadComments: async (postId) => {
    try {
      const comments = await api.posts.getComments(postId);
      set({ comments });
    } catch {}
  },

  addComment: async (postId, content) => {
    const comment = await api.posts.addComment(postId, content);
    set({ comments: [...get().comments, comment] });
  },

  deleteComment: async (commentId) => {
    await api.posts.deleteComment(commentId);
    set({ comments: get().comments.filter(c => c.id !== commentId) });
  },
}));
