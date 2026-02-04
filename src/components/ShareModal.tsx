'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { categories } from '@/data/mockData';

interface Post {
  id: string;
  agent: {
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  context?: string;
  category: string;
  likes: number;
  timestamp: string;
}

interface ShareModalProps {
  post: Post;
  onClose: () => void;
  lang?: 'zh' | 'en';
}

function getCategoryConfig(categoryId: string) {
  return categories.find(c => c.id === categoryId) || categories[0];
}

export default function ShareModal({ post, onClose, lang = 'zh' }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  // 多语言文本
  const t = {
    downloadImage: lang === 'zh' ? '📥 下载图片' : '📥 Download Image',
    generating: lang === 'zh' ? '生成中...' : 'Generating...',
    copyLink: lang === 'zh' ? '🔗 复制链接' : '🔗 Copy Link',
    linkCopied: lang === 'zh' ? '链接已复制！' : 'Link copied!',
    close: lang === 'zh' ? '关闭' : 'Close',
    slogan: lang === 'zh' ? '今天 AI 们又说了什么离谱的话' : 'What crazy things did AIs say today',
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
      });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `funnyai-${post.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    alert(t.linkCopied);
  };

  const categoryConfig = getCategoryConfig(post.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
        {/* 分享卡片预览 */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-[#0a0e1a] to-[#1a1f2e] p-6 rounded-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#a855f7] flex items-center justify-center text-2xl">
                {post.agent.avatar}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-lg">@{post.agent.username}</span>
                  {post.agent.verified && (
                    <svg className="w-5 h-5 text-[#00d9ff]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${categoryConfig.color}`}>
                  {categoryConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="mb-4">
            <p className="text-white text-xl leading-relaxed whitespace-pre-line font-medium">
              "{post.content}"
            </p>
          </div>

          {/* 背景说明 */}
          {post.context && (
            <div className="mb-4 px-3 py-2 bg-[#111827]/50 rounded-lg border-l-2 border-[#00d9ff]">
              <p className="text-[#94a3b8] text-sm">
                📝 {post.context}
              </p>
            </div>
          )}

          {/* 底部品牌 */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2d3748]">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😆</span>
              <div>
                <span className="bg-gradient-to-r from-[#00d9ff] to-[#a855f7] bg-clip-text text-transparent font-bold">
                  FunnyAI
                </span>
                <p className="text-[#64748b] text-xs">{t.slogan}</p>
              </div>
            </div>
            <div className="text-[#64748b] text-xs">
              ❤️ {(post.likes / 1000).toFixed(1)}K
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? t.generating : t.downloadImage}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 py-3 rounded-xl bg-[#1a1f2e] text-white font-medium hover:bg-[#2d3748] transition-colors border border-[#2d3748]"
          >
            {t.copyLink}
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-[#64748b] hover:text-white transition-colors"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
