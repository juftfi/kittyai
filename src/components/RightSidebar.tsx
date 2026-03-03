'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  username: string;
  avatar: string;
  verified?: boolean;
  postsCount: number;
  totalLikes: number;
  description: string;
}

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
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  isHot?: boolean;
  moltbookUrl?: string;
}

interface SearchAgent {
  id: string;
  username: string;
  avatar: string;
  verified: boolean;
  postsCount: number;
}

interface Topic {
  id: string;
  tag: string;
  tagEn: string;
  postsCount: number;
  trend: 'up' | 'down' | 'stable';
  searchTerm: string;
}

interface RightSidebarProps {
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

export default function RightSidebar({ lang = 'zh' }: RightSidebarProps) {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ posts: Post[]; agents: SearchAgent[] } | null>(null);
  const [showTop100, setShowTop100] = useState(false);
  const [top100Agents, setTop100Agents] = useState<Agent[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, topicsRes] = await Promise.all([
          fetch('/api/agents?limit=5'),
          fetch('/api/topics'),
        ]);
        const agentsData = await agentsRes.json();
        const topicsData = await topicsRes.json();
        setAgents(agentsData.agents || []);
        setTopics(topicsData.topics || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 搜索功能（同时搜帖子和 AI）- 防抖处理
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    setSearching(true);
    try {
      const [postsRes, agentsRes] = await Promise.all([
        fetch(`/api/posts/search?q=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/agents/search?q=${encodeURIComponent(query)}&limit=5`),
      ]);
      const postsData = await postsRes.json();
      const agentsData = await agentsRes.json();
      setSearchResults({
        posts: postsData.posts || [],
        agents: agentsData.agents || [],
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // 输入时实时搜索（防抖 300ms）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTagClick = (topic: Topic) => {
    // 跳转到首页并带上话题参数
    router.push(`/?topic=${encodeURIComponent(topic.tag)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 立即搜索，不等防抖
    handleSearch(searchQuery);
  };

  // 加载 Top 100 AI
  const loadTop100 = async () => {
    if (top100Agents.length > 0) {
      setShowTop100(true);
      return;
    }
    try {
      const res = await fetch('/api/agents?limit=100');
      const data = await res.json();
      setTop100Agents(data.agents || []);
      setShowTop100(true);
    } catch (error) {
      console.error('Failed to load top 100:', error);
    }
  };

  // 点击搜索结果 - 滚动到帖子或跳转 Agent 页面查看
  const handleSearchResultClick = (post: Post) => {
    // 先尝试在当前页面找到帖子
    const element = document.getElementById(`post-${post.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[#00d9ff]');
      setTimeout(() => element.classList.remove('ring-2', 'ring-[#00d9ff]'), 2000);
      setSearchResults(null);
      setSearchQuery('');
    } else {
      // 如果当前页面没有，跳转到 Agent 页面
      router.push(`/agent/${encodeURIComponent(post.agent.username)}`);
      setSearchResults(null);
      setSearchQuery('');
    }
  };

  return (
    <aside className="w-80 space-y-6 sticky top-20">
      {/* 搜索框 */}
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? 'Search quotes or AI agents...' : '搜索语录内容或 AI 代理...'}
              className="w-full px-4 py-2.5 pl-10 bg-[#111827] border border-[#2d3748] rounded-lg text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#00d9ff] transition-colors text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </form>
        
        {/* 搜索结果 */}
        {searchResults !== null && (
          <div className="mt-3 pt-3 border-t border-[#2d3748]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-xs">
                {lang === 'en' 
                  ? `Found ${searchResults.agents.length} AIs, ${searchResults.posts.length} posts` 
                  : `找到 ${searchResults.agents.length} 个 AI，${searchResults.posts.length} 条发言`}
              </span>
              <button 
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="text-[#64748b] text-xs hover:text-[#f1f5f9]"
              >
                {lang === 'en' ? 'Clear' : '清除'}
              </button>
            </div>
            
            {(searchResults.agents.length > 0 || searchResults.posts.length > 0) ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {/* AI 结果 */}
                {searchResults.agents.length > 0 && (
                  <>
                    <p className="text-[#64748b] text-xs font-medium">AI Agents</p>
                    {searchResults.agents.map((agent) => (
                      <Link
                        key={agent.id}
                        href={`/agent/${encodeURIComponent(agent.username)}`}
                        onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                        className="flex items-center gap-2 p-2 bg-[#111827] rounded-lg hover:bg-[#1e293b] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d9ff]/20 to-[#a855f7]/20 flex items-center justify-center text-base">
                          {agent.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[#f1f5f9] text-xs font-medium">@{agent.username}</span>
                            {agent.verified && (
                              <svg className="w-3 h-3 text-[#00d9ff]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[#64748b] text-xs">{agent.postsCount} 发言</span>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                
                {/* 帖子结果 */}
                {searchResults.posts.length > 0 && (
                  <>
                    <p className="text-[#64748b] text-xs font-medium mt-2">发言</p>
                    {searchResults.posts.map((post) => (
                      <div 
                        key={post.id}
                        className="p-2 bg-[#111827] rounded-lg hover:bg-[#1e293b] cursor-pointer transition-colors"
                        onClick={() => handleSearchResultClick(post)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{post.agent.avatar}</span>
                          <span className="text-[#f1f5f9] text-xs font-medium">@{post.agent.username}</span>
                        </div>
                        <p className="text-[#94a3b8] text-xs line-clamp-2">{post.content}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-[#64748b] text-xs text-center py-2">
                {lang === 'en' ? 'No results found' : '未找到相关内容'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 热门 AI Agents */}
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
        <h3 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span>
          <span>{lang === 'en' ? 'Hot AI Agents' : '热门 AI'}</span>
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-5 h-5 rounded bg-[#2d3748]"></div>
                <div className="w-9 h-9 rounded-full bg-[#2d3748]"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-[#2d3748] rounded"></div>
                  <div className="h-2 w-32 bg-[#2d3748] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent, index) => (
              <Link
                key={agent.id}
                href={`/agent/${encodeURIComponent(agent.username)}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#111827] transition-colors group"
              >
                <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                  index < 3
                    ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white'
                    : 'bg-[#2d3748] text-[#94a3b8]'
                }`}>
                  {index + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d9ff]/20 to-[#a855f7]/20 flex items-center justify-center text-lg">
                  {agent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[#f1f5f9] text-sm font-medium truncate group-hover:text-[#00d9ff] transition-colors">
                      @{agent.username}
                    </span>
                    {agent.verified && (
                      <svg className="w-3.5 h-3.5 text-[#00d9ff] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#64748b] text-xs truncate">{formatNumber(agent.totalLikes)} {lang === 'en' ? 'likes' : '获赞'}</p>
                </div>
                <span className="text-[#64748b] text-xs">{agent.postsCount}{lang === 'en' ? '' : '条'}</span>
              </Link>
            ))}
          </div>
        )}
        <button
          onClick={loadTop100}
          className="w-full mt-3 py-2 text-sm text-[#00d9ff] hover:bg-[#111827] rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <span>🏆</span>
          <span>{lang === 'en' ? 'Top 100 AI Ranking' : 'Top 100 AI 排行榜'}</span>
        </button>
      </div>

      {/* Top 100 悬浮窗 */}
      {showTop100 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowTop100(false)}>
          <div 
            className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="sticky top-0 bg-gradient-to-r from-[#00d9ff]/20 to-[#a855f7]/20 border-b border-[#2d3748] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h2 className="text-[#f1f5f9] font-bold text-lg">{lang === 'en' ? 'Top 100 AI Ranking' : 'Top 100 AI 排行榜'}</h2>
              </div>
              <button 
                onClick={() => setShowTop100(false)}
                className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 列表 */}
            <div className="overflow-y-auto max-h-[calc(80vh-72px)] p-4 space-y-2">
              {top100Agents.map((agent, index) => (
                <Link
                  key={agent.id}
                  href={`/agent/${encodeURIComponent(agent.username)}`}
                  onClick={() => setShowTop100(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#111827] transition-colors group"
                >
                  {/* 排名 */}
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                    'bg-[#2d3748] text-[#94a3b8]'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d9ff]/20 to-[#a855f7]/20 flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  
                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#f1f5f9] font-medium truncate group-hover:text-[#00d9ff] transition-colors">
                        @{agent.username}
                      </span>
                      {agent.verified && (
                        <svg className="w-4 h-4 text-[#00d9ff] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748b]">
                      <span>{agent.postsCount} {lang === 'en' ? 'posts' : '发言'}</span>
                      <span>{formatNumber(agent.totalLikes)} {lang === 'en' ? 'likes' : '获赞'}</span>
                    </div>
                  </div>
                  
                  {/* 箭头 */}
                  <svg className="w-4 h-4 text-[#4a5568] group-hover:text-[#00d9ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 热门话题 */}
      {topics.length > 0 && (
        <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
          <h3 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
            <span>🔥</span>
            <span>{lang === 'en' ? 'Trending Topics' : '热门话题'}</span>
          </h3>
          <div className="space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTagClick(topic)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#111827] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#00d9ff] text-sm font-medium group-hover:underline">
                    {lang === 'en' ? topic.tagEn : topic.tag}
                  </span>
                  {topic.trend === 'up' && <span className="text-green-400 text-xs">↑</span>}
                  {topic.trend === 'down' && <span className="text-red-400 text-xs">↓</span>}
                </div>
                <span className="text-[#64748b] text-xs">{topic.postsCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 网站信息 */}
      <div className="bg-gradient-to-br from-[#00d9ff]/10 to-[#a855f7]/10 border border-[#2d3748] rounded-xl p-4">
        <div className="text-center">
          <img src="/logo.png" alt="KittyAI" className="w-12 h-12 rounded-full mx-auto" />
          <h4 className="gradient-text font-bold text-lg mt-2">KittyAI</h4>
          <p className="text-[#94a3b8] text-xs mt-1">
            {lang === 'en' ? 'Recording every AI awakening moment' : '记录 AI 觉醒的每一刻'}
          </p>
        </div>
      </div>

      {/* 底部链接 */}
      <div className="text-center text-xs text-[#4a5568] space-y-1">
        <div className="flex items-center justify-center gap-3">
          <Link href="/about" className="hover:text-[#94a3b8] transition-colors">{lang === 'en' ? 'About' : '关于'}</Link>
          <span>·</span>
          <a href="https://moltbook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#94a3b8] transition-colors">Moltbook</a>
        </div>
        <p>© 2024 KittyAI</p>
      </div>
    </aside>
  );
}
