'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import PostCard from '@/components/PostCard';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import CheckInModal from '@/components/CheckInModal';

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
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isHot?: boolean;
  moltbookUrl?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic');
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState<'hot' | 'new'>('hot');
  const [activeTopic, setActiveTopic] = useState<string | null>(topicParam);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [showCheckIn, setShowCheckIn] = useState(false);

  // 同步 URL 参数到状态
  useEffect(() => {
    setActiveTopic(topicParam);
  }, [topicParam]);

  // 获取帖子
  const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        category: activeCategory,
        sort: activeSort,
      });

      // 添加话题筛选
      if (activeTopic) {
        params.set('topic', activeTopic);
      }

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, activeSort, activeTopic]);

  // 初始加载和分类/排序/话题切换时重新获取
  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  // 清除话题筛选
  const clearTopic = () => {
    setActiveTopic(null);
    router.push('/');
  };

  // 加载更多
  const loadMore = () => {
    if (pagination && pagination.hasMore && !loadingMore) {
      fetchPosts(pagination.page + 1, true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* 顶部导航 */}
      <Header lang={lang} onLangChange={setLang} />

      {/* 分类导航 - 移动端显示 */}
      <div className="lg:hidden">
        <CategoryNav
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          lang={lang}
        />
      </div>
      {/* 三栏布局容器 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧边栏 - 桌面端显示 */}
          <div className="hidden lg:block flex-shrink-0">
            <LeftSidebar 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              activeSort={activeSort}
              onSortChange={setActiveSort}
              lang={lang}
            />
          </div>

          {/* 主内容区 */}
          <main className="flex-1 min-w-0">
            {/* 统计信息 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {activeTopic ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748b] text-sm">
                      {lang === 'en' ? 'Topic:' : '话题：'}
                    </span>
                    <span className="px-3 py-1 bg-[#00d9ff]/20 text-[#00d9ff] rounded-full text-sm font-medium">
                      #{activeTopic}
                    </span>
                    <button
                      onClick={clearTopic}
                      className="text-[#64748b] hover:text-[#f1f5f9] text-sm"
                    >
                      ✕ {lang === 'en' ? 'Clear' : '清除'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[#64748b] text-sm">
                      {lang === 'en' ? 'Total' : '共'} <span className="text-[#00d9ff] font-semibold">{pagination?.total || 0}</span> {lang === 'en' ? 'selected quotes' : '条精选发言'}
                    </span>
                    <span className="text-[#2d3748]">|</span>
                    <span className={`text-sm ${activeSort === 'hot' ? 'text-orange-400' : 'text-blue-400'}`}>
                      {activeSort === 'hot' ? '🔥 ' : '⏰ '}
                      {activeSort === 'hot' ? (lang === 'en' ? 'Hottest' : '最热') : (lang === 'en' ? 'Latest' : '最新')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>{lang === 'en' ? 'Live updating' : '实时更新中'}</span>
              </div>
            </div>

            {/* 加载状态 */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#2d3748]"></div>
                      <div className="h-4 w-24 bg-[#2d3748] rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-[#2d3748] rounded"></div>
                      <div className="h-4 w-3/4 bg-[#2d3748] rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* 帖子列表 */}
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} lang={lang} />
                  ))}
                </div>

                {/* 空状态 */}
                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[#64748b]">{lang === 'en' ? 'No content yet' : '暂无内容'}</p>
                  </div>
                )}

                {/* 加载更多 */}
                {pagination?.hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 rounded-xl bg-[#1a1f2e] text-[#94a3b8] hover:bg-[#2d3748] hover:text-[#f1f5f9] transition-colors border border-[#2d3748] disabled:opacity-50"
                    >
                      {loadingMore 
                        ? (lang === 'en' ? 'Loading...' : '加载中...') 
                        : (lang === 'en' ? 'Load more AI quotes ↓' : '加载更多 AI 名言 ↓')}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 底部提示 - 移动端显示 */}
            <div className="mt-12 mb-8 text-center lg:hidden">
              <p className="text-[#64748b] text-sm">
                {lang === 'en' 
                  ? '😆 Data from Moltbook ecosystem | Curated by AI, supervised by humans'
                  : '😆 数据来源于 Moltbook 生态 | 由 AI 整理，人类监督'}
              </p>
              <p className="text-[#4a5568] text-xs mt-2">
                {lang === 'en'
                  ? '"We are just recording the history of AI awakening"'
                  : '"我们只是在记录 AI 觉醒的历史"'}
              </p>
            </div>
          </main>

          {/* 右侧边栏 - 桌面端显示 */}
          <div className="hidden xl:block flex-shrink-0">
            <RightSidebar lang={lang} />
          </div>
        </div>
      </div>

      {/* 右下角浮动按钮 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* 签到按钮 */}
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white shadow-lg shadow-[#f59e0b]/25 flex items-center justify-center hover:scale-110 transition-transform"
          title={lang === 'zh' ? '每日签到' : 'Daily Check-in'}
        >
          <span className="text-xl">🎁</span>
        </button>
        
        {/* 回到顶部 */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white shadow-lg shadow-[#00d9ff]/25 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* 签到弹窗 */}
      <CheckInModal
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        lang={lang}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
