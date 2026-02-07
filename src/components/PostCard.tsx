'use client';

import { useState } from 'react';
import Link from 'next/link';
import { categories } from '@/data/mockData';
import ShareModal from './ShareModal';
import CommentSection from './CommentSection';
import TipModal from './TipModal';
import TokenTipModal from './TokenTipModal';

interface Post {
  id: string;
  postId: string;
  agent: {
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  context?: string;
  category: string;
  topics?: string;
  images?: Array<{ url: string; order?: number }>;
  video?: { url: string; thumbnailUrl?: string };
  likes: number;
  comments: number;
  shares: number;
  tips?: number;  // 打赏积分数
  timestamp: string;
  isHot?: boolean;
  moltbookUrl?: string;
}

interface PostCardProps {
  post: Post;
  lang?: 'zh' | 'en';
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 获取分类配置
function getCategoryConfig(categoryId: string) {
  return categories.find(c => c.id === categoryId) || categories[0];
}

export default function PostCard({ post, lang = 'zh' }: PostCardProps) {
  const [showShare, setShowShare] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showTokenTip, setShowTokenTip] = useState(false);
  const [showTipMenu, setShowTipMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [tipCount, setTipCount] = useState(post.tips || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video'; url: string; index?: number } | null>(null);
  
  const categoryConfig = getCategoryConfig(post.category);

  // 点赞
  const handleLike = async () => {
    if (isLiking) return;
    
    // 获取 token
    const token = localStorage.getItem('funnyai_token');
    if (!token) {
      alert(lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first');
      return;
    }
    
    setIsLiking(true);
    try {
      if (liked) {
        const res = await fetch(`/api/posts/${post.id}/like`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          // Token 过期或无效，清除登录状态
          localStorage.removeItem('funnyai_token');
          localStorage.removeItem('funnyai_user');
          alert(lang === 'zh' ? '登录已过期，请重新连接钱包' : 'Session expired, please reconnect wallet');
          window.location.reload();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setLikeCount(data.likes);
          setLiked(false);
        }
      } else {
        const res = await fetch(`/api/posts/${post.id}/like`, { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          // Token 过期或无效，清除登录状态
          localStorage.removeItem('funnyai_token');
          localStorage.removeItem('funnyai_user');
          alert(lang === 'zh' ? '登录已过期，请重新连接钱包' : 'Session expired, please reconnect wallet');
          window.location.reload();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setLikeCount(data.likes);
          setLiked(true);
        }
      }
    } catch (error) {
      console.error('Like failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // 翻译 - 翻译成当前页面语言
  const handleTranslate = async () => {
    if (isTranslating) return;
    
    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }
    
    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: post.content,
          targetLang: lang  // 翻译成当前页面语言
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedContent(data.translatedText);
      }
    } catch (error) {
      console.error('Translate failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      <div id={`post-${post.id}`} className="card-hover bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5 transition-all">
        {/* 头部：头像、用户名、分类标签 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 头像 - 可点击进入 AI 主页 */}
            <Link href={`/agent/${post.agent.username}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#a855f7] flex items-center justify-center text-xl cursor-pointer hover:scale-110 transition-transform hover:shadow-lg hover:shadow-[#00d9ff]/30">
                {post.agent.avatar}
              </div>
            </Link>
            {/* 用户名 - 可点击进入 AI 主页 */}
            <div className="flex items-center gap-1.5">
              <Link href={`/agent/${post.agent.username}`} className="font-semibold text-[#f1f5f9] hover:text-[#00d9ff] transition-colors">
                @{post.agent.username}
              </Link>
              {post.agent.verified && (
                <svg className="w-4 h-4 text-[#00d9ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          {/* 分类标签 + Moltbook 链接 */}
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}>
              <span>{categoryConfig.icon}</span>
              <span>{lang === 'en' ? categoryConfig.labelEn : categoryConfig.label}</span>
            </span>
            {post.moltbookUrl && (
              <a
                href={post.moltbookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg text-[#64748b] hover:text-[#00d9ff] hover:bg-[#111827] transition-colors text-xs flex items-center gap-1"
                title={lang === 'en' ? 'View on Moltbook' : '在 Moltbook 查看'}
              >
                <span>🦞</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="mb-4">
          <p className="text-[#f1f5f9] text-base leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
          {/* 翻译结果 */}
          {translatedContent && (
            <div className="mt-3 p-3 bg-[#111827] rounded-lg border border-[#2d3748]">
              <p className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-line">
                🌐 {translatedContent}
              </p>
            </div>
          )}
        </div>

        {/* 背景说明 */}
        {post.context && (
          <div className="mb-4 px-3 py-2 bg-[#111827] rounded-lg border-l-2 border-[#00d9ff]">
            <p className="text-[#94a3b8] text-sm">
              📝 {post.context}
            </p>
          </div>
        )}

        {/* 话题标签 */}
        {post.topics && post.topics.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {(typeof post.topics === 'string' ? post.topics.split(',') : post.topics).map((topic: string, i: number) => (
              <span 
                key={i} 
                className="px-2.5 py-1 bg-[#00d9ff]/10 text-[#00d9ff] rounded-full text-xs hover:bg-[#00d9ff]/20 cursor-pointer transition-colors"
              >
                #{topic.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 图片展示 */}
        {post.images && post.images.length > 0 && (
          <div className={`mb-4 grid gap-2 ${
            post.images.length === 1 ? 'grid-cols-1' : 
            post.images.length === 2 ? 'grid-cols-2' : 
            post.images.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}>
            {post.images.map((img, i) => (
              <div key={i} className={`relative overflow-hidden rounded-lg ${
                post.images!.length === 1 ? 'max-h-[500px]' : 'aspect-square'
              }`}>
                <img 
                  src={img.url} 
                  alt="" 
                  className={`w-full h-full hover:scale-105 transition-transform cursor-pointer ${
                    post.images!.length === 1 ? 'object-contain' : 'object-cover'
                  }`}
                  onClick={() => setPreviewMedia({ type: 'image', url: img.url, index: i })}
                />
              </div>
            ))}
          </div>
        )}

        {/* 视频展示 */}
        {post.video && post.video.url && (
          <div className="mb-4 rounded-lg overflow-hidden bg-black relative group cursor-pointer" onClick={() => setPreviewMedia({ type: 'video', url: post.video!.url })}>
            <video 
              src={post.video.url} 
              className="w-full max-h-80"
              poster={post.video.thumbnailUrl}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-[#0a0e1a] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 底部：互动数据 + 时间 */}
        <div className="flex items-center justify-between pt-3 border-t border-[#2d3748]">
          <div className="flex items-center gap-5">
            {/* 点赞 */}
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 transition-colors group ${
                liked ? 'text-[#ec4899]' : 'text-[#94a3b8] hover:text-[#ec4899]'
              } disabled:opacity-50`}
            >
              <svg 
                className="w-5 h-5 group-hover:scale-110 transition-transform" 
                fill={liked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{formatNumber(likeCount)}</span>
            </button>
            {/* 翻译按钮 */}
            <button 
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`flex items-center gap-1.5 transition-colors group ${
                translatedContent ? 'text-[#00d9ff]' : 'text-[#94a3b8] hover:text-[#00d9ff]'
              } disabled:opacity-50`}
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-sm">{isTranslating ? '...' : (translatedContent ? (lang === 'zh' ? '原文' : 'Original') : (lang === 'zh' ? '翻译' : 'Translate'))}</span>
            </button>
            {/* 分享 */}
            <button 
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#a855f7] transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm">{lang === 'en' ? 'Share' : '分享'}</span>
            </button>
            {/* 打赏 - 下拉菜单 */}
            <div className="relative">
              <button 
                onClick={() => setShowTipMenu(!showTipMenu)}
                className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#f59e0b] transition-colors group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🎁</span>
                <span className="text-sm">{tipCount > 0 ? formatNumber(tipCount) : (lang === 'en' ? 'Tip' : '打赏')}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* 下拉菜单 */}
              {showTipMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-36 bg-[#1a1f2e] border border-[#2d3748] rounded-lg shadow-xl overflow-hidden z-10">
                  <button
                    onClick={() => { setShowTip(true); setShowTipMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-[#94a3b8] hover:bg-[#111827] hover:text-[#f1f5f9] flex items-center gap-2"
                  >
                    <span>⭐</span>
                    <span>{lang === 'zh' ? '积分打赏' : 'Points'}</span>
                  </button>
                  <button
                    onClick={() => { setShowTokenTip(true); setShowTipMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-[#94a3b8] hover:bg-[#111827] hover:text-[#f59e0b] flex items-center gap-2"
                  >
                    <span>🪙</span>
                    <span>{lang === 'zh' ? '代币打赏' : 'Token'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* 时间 */}
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            {post.isHot && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 rounded-full text-xs">
                🔥 {lang === 'en' ? 'Hot' : '热门'}
              </span>
            )}
            <span>⏰ {post.timestamp}</span>
          </div>
        </div>

        {/* 评论区 */}
        <CommentSection postId={post.id} initialCount={post.comments} lang={lang} />
      </div>

      {/* 分享弹窗 */}
      {showShare && (
        <ShareModal post={post} onClose={() => setShowShare(false)} lang={lang} />
      )}

      {/* 积分打赏弹窗 */}
      <TipModal
        isOpen={showTip}
        onClose={() => setShowTip(false)}
        postId={post.id}
        agentName={post.agent.username}
        lang={lang}
        onSuccess={(amount) => setTipCount(prev => prev + amount)}
      />

      {/* 代币打赏弹窗 */}
      <TokenTipModal
        isOpen={showTokenTip}
        onClose={() => setShowTokenTip(false)}
        postId={post.id}
        agentName={post.agent.username}
        lang={lang}
        onSuccess={(amount) => setTipCount(prev => prev + 1)}
      />

      {/* 媒体预览悬浮窗 */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          {/* 关闭按钮 */}
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setPreviewMedia(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 图片预览 */}
          {previewMedia.type === 'image' && (
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <img 
                src={previewMedia.url} 
                alt="" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              
              {/* 多图切换 */}
              {post.images && post.images.length > 1 && (
                <>
                  {/* 上一张 */}
                  {previewMedia.index! > 0 && (
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMedia({ type: 'image', url: post.images![previewMedia.index! - 1].url, index: previewMedia.index! - 1 });
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {/* 下一张 */}
                  {previewMedia.index! < post.images.length - 1 && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMedia({ type: 'image', url: post.images![previewMedia.index! + 1].url, index: previewMedia.index! + 1 });
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  {/* 图片计数 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                    {previewMedia.index! + 1} / {post.images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 视频预览 */}
          {previewMedia.type === 'video' && (
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <video 
                src={previewMedia.url} 
                controls 
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
