import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Send, Heart, MessageCircle, Trash2, MoreHorizontal, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { usePostStore } from '@/store/usePostStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Post } from '@/types';
import { formatDateTime } from '@/utils/date';
import { API_BASE } from '@/utils/api';

const Space: React.FC = () => {
  const navigate = useNavigate();
  const { feed, loadFeed, createPost, deletePost, toggleLike, comments, loadComments, addComment } = usePostStore();
  const currentUser = useAuthStore(s => s.currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFeed(true); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files].slice(0, 9);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleRemoveFile = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handlePublish = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;
    setSubmitting(true);
    setPublishError('');
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('visibility', 'friends');
      selectedFiles.forEach(f => formData.append('images', f));
      await createPost(formData);
      setContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowCreate(false);
    } catch (e) {
      console.error(e);
      setPublishError(e instanceof Error ? e.message : '发布失败，请稍后重试');
    }
    setSubmitting(false);
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    await addComment(postId, commentText.trim());
    setCommentText('');
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      await loadComments(postId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-amber-900 dark:text-gray-100">空间</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <><X size={16} /> 取消</> : <><ImagePlus size={16} /> 发布</>}
        </Button>
      </div>

      {showCreate && (
        <GlassCard className="p-4 mb-4">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="分享你的生活..." rows={4}
            className="w-full p-3 rounded-xl border border-orange-200 text-sm font-serif resize-none focus:border-orange-400 focus:outline-none mb-3 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300" />
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" />
                  <button onClick={() => handleRemoveFile(idx)} className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={() => fileInputRef.current?.click()} className="text-orange-500 hover:text-orange-600 text-sm font-serif">
              <ImagePlus size={18} className="inline mr-1" />添加图片
            </button>
            <Button size="sm" onClick={handlePublish} disabled={submitting || (!content.trim() && selectedFiles.length === 0)}>
              <Send size={14} /> {submitting ? '发布中...' : '发布'}
            </Button>
          </div>
          {publishError && (
            <p className="mt-3 text-xs text-red-500 font-serif text-center">{publishError}</p>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
        </GlassCard>
      )}

      <div className="space-y-4">
        {feed.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-orange-500 font-serif dark:text-gray-400">还没有动态，发布第一条吧</p>
          </GlassCard>
        ) : feed.map(post => (
          <GlassCard key={post.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/user/${post.user_uid}`)}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-sm font-serif text-white overflow-hidden">
                  {post.avatar ? <img src={post.avatar} className="w-full h-full object-cover" /> : post.username[0]}
                </div>
                <div>
                  <p className="font-serif font-semibold text-sm text-amber-900 dark:text-gray-100">{post.username}</p>
                  <p className="text-xs text-orange-400 dark:text-gray-500">{formatDateTime(post.created_at)}</p>
                </div>
              </div>
              {post.user_uid === currentUser?.uid && (
                <button onClick={() => setConfirmDelete(post.id)} className="p-1 text-orange-400 hover:text-red-500"><Trash2 size={14} /></button>
              )}
            </div>

            <p className="text-sm font-serif text-amber-800 mb-3 whitespace-pre-wrap dark:text-gray-200">{post.content}</p>

            {post.images && post.images.length > 0 && (
              <div className={`grid gap-1 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.images.map((img, idx) => (
                  <img key={idx} src={img.startsWith('http') ? img : `${API_BASE.replace('/api', '')}${img}`}
                    className="rounded-lg object-cover max-h-60 w-full" />
                ))}
              </div>
            )}

            {post.video && (
              <video src={post.video.startsWith('http') ? post.video : `${API_BASE.replace('/api', '')}${post.video}`}
                controls className="w-full rounded-lg mb-3 max-h-60" />
            )}

            <div className="flex items-center gap-4 text-sm">
              <button onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-red-500' : 'text-orange-400 hover:text-red-400'}`}>
                <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} /> {post.likeCount}
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 text-orange-400 hover:text-orange-600">
                <MessageCircle size={16} /> {post.commentCount}
              </button>
            </div>

            {activeCommentPost === post.id && (
              <div className="mt-3 pt-3 border-t border-orange-100 dark:border-white/10">
                {comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-xs text-orange-700 overflow-hidden flex-shrink-0">
                      {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : c.username[0]}
                    </div>
                    <div>
                      <p className="text-xs font-serif"><span className="font-semibold text-amber-800 dark:text-gray-200">{c.username}</span> <span className="text-orange-400">{formatDateTime(c.created_at)}</span></p>
                      <p className="text-xs text-amber-700 dark:text-gray-300">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleComment(post.id); }}
                    placeholder="写评论..." className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-orange-200 focus:border-orange-400 focus:outline-none dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300" />
                  <button onClick={() => handleComment(post.id)} className="px-2 text-orange-500 hover:text-orange-600"><Send size={14} /></button>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-orange-900/20 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 animate-bounce-in">
            <h4 className="text-lg font-serif font-semibold text-amber-900 mb-2 dark:text-gray-100">删除动态</h4>
            <p className="text-orange-700 font-serif mb-4 dark:text-gray-300">确定要删除这条动态吗？</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">取消</Button>
              <Button variant="danger" onClick={async () => { await deletePost(confirmDelete); setConfirmDelete(null); }} className="flex-1">删除</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Space;
