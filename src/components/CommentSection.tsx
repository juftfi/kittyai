'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
    walletAddress: string;
  };
}

interface CommentSectionProps {
  postId: string;
  initialCount: number;
  lang?: 'zh' | 'en';
}

// 格式化时间
function formatTime(dateStr: string, lang: 'zh' | 'en'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (lang === 'en') {
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US');
  } else {
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  }
}

export default function CommentSection({ postId, initialCount, lang = 'zh' }: CommentSectionProps) {
  const { user, token, connect } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCount);

  // 加载评论
  const loadComments = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}&limit=10`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // 展开时加载评论
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      loadComments();
    }
  }, [isExpanded]);

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!token) {
      alert(lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();
      if (data.comment) {
        // 添加默认 user 信息
        const newCommentData = {
          ...data.comment,
          id: data.comment.ID || data.comment.id || Date.now(),
          createdAt: data.comment.CreatedAt || data.comment.createdAt || new Date().toISOString(),
          user: {
            id: 0,
            nickname: user?.nickname || '匿名用户',
            avatar: user?.avatar || '👤',
            walletAddress: user?.walletAddress || '',
          }
        };
        setComments([newCommentData, ...comments]);
        setCommentCount(prev => prev + 1);
        setNewComment('');
      } else {
        alert(data.error || '评论失败');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3">
      {/* 评论按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#00d9ff] transition-colors group"
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-sm">{commentCount}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 评论区 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#2d3748]">
          {/* 评论输入框 */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center text-sm overflow-hidden">
                {user?.avatar ? (
                  user.avatar.startsWith('http') ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.avatar}</span>
                  )
                ) : (
                  <span>{user?.nickname?.charAt(0) || '👤'}</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={lang === 'en' ? 'Write a comment...' : '写下你的评论...'}
                  className="w-full px-3 py-2 bg-[#111827] border border-[#2d3748] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#00d9ff] transition-colors text-sm resize-none"
                  rows={2}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#64748b] text-xs">{newComment.length}/500</span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {submitting 
                      ? (lang === 'en' ? 'Posting...' : '发送中...') 
                      : (lang === 'en' ? 'Post' : '发表')}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* 评论列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                    {comment.user?.avatar ? (
                      comment.user.avatar.startsWith('http') ? (
                        <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{comment.user.avatar}</span>
                      )
                    ) : (
                      <span>{comment.user?.nickname?.charAt(0) || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#f1f5f9] text-sm font-medium">{comment.user?.nickname || '匿名用户'}</span>
                      {comment.user?.walletAddress && (
                        <span className="text-[#64748b] text-xs">{comment.user.walletAddress.slice(0, 6)}...{comment.user.walletAddress.slice(-4)}</span>
                      )}
                      <span className="text-[#4a5568] text-xs">·</span>
                      <span className="text-[#64748b] text-xs">{formatTime(comment.createdAt, lang)}</span>
                    </div>
                    <p className="text-[#94a3b8] text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#64748b] text-sm py-4">
              {lang === 'en' ? 'No comments yet, be the first!' : '还没有评论，来抢沙发吧！'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
