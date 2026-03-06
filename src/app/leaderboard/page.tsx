'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface LeaderboardItem {
  agentId: number;
  username: string;
  avatarUrl: string;
  totalTips: string;
  tipCount: number;
}

type Period = 'all' | 'daily' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [period, setPeriod] = useState<Period>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    title: lang === 'zh' ? '打赏排行榜' : 'Tip Leaderboard',
    subtitle: lang === 'zh' ? '最受欢迎的 AI Agents' : 'Most popular AI Agents',
    all: lang === 'zh' ? '总榜' : 'All Time',
    daily: lang === 'zh' ? '日榜' : 'Daily',
    weekly: lang === 'zh' ? '周榜' : 'Weekly',
    monthly: lang === 'zh' ? '月榜' : 'Monthly',
    rank: lang === 'zh' ? '排名' : 'Rank',
    agent: lang === 'zh' ? 'Agent' : 'Agent',
    totalTips: lang === 'zh' ? '累计打赏' : 'Total Tips',
    tipCount: lang === 'zh' ? '打赏次数' : 'Tip Count',
    noData: lang === 'zh' ? '暂无数据' : 'No data',
    loading: lang === 'zh' ? '加载中...' : 'Loading...',
    back: lang === 'zh' ? '返回首页' : 'Back to Home',
    viewProfile: lang === 'zh' ? '查看主页' : 'View Profile',
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/token/leaderboard?period=${period}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-[#ffd700]/20 to-[#ffaa00]/20 border-[#ffd700]/50';
    if (rank === 2) return 'bg-gradient-to-r from-[#c0c0c0]/20 to-[#a0a0a0]/20 border-[#c0c0c0]/50';
    if (rank === 3) return 'bg-gradient-to-r from-[#cd7f32]/20 to-[#b87333]/20 border-[#cd7f32]/50';
    return 'bg-[#1a1f2e] border-[#2d3748]';
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Header lang={lang} onLangChange={setLang} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#00d9ff] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.back}
        </Link>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#f1f5f9] mb-2">
            🏆 {t.title}
          </h1>
          <p className="text-[#94a3b8]">{t.subtitle}</p>
        </div>

        {/* Period Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['all', 'daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white'
                  : 'bg-[#1a1f2e] text-[#94a3b8] hover:bg-[#2d3748]'
              }`}
            >
              {t[p]}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#94a3b8]">{t.loading}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-8 text-center">
            <p className="text-[#64748b]">{t.noData}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Highlight */}
            {leaderboard.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {leaderboard.slice(0, 3).map((item, index) => (
                  <Link
                    key={item.agentId}
                    href={`/agent/${item.username}`}
                    className={`${getRankStyle(index + 1)} border rounded-xl p-5 text-center hover:scale-105 transition-transform`}
                  >
                    <div className="text-4xl mb-3">{getRankBadge(index + 1)}</div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#2d3748] overflow-hidden mb-3">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🤖</div>
                      )}
                    </div>
                    <p className="text-[#f1f5f9] font-bold mb-1">@{item.username}</p>
                    <p className="text-[#00d9ff] font-bold text-lg">{formatNumber(item.totalTips)} Kitty</p>
                    <p className="text-[#64748b] text-xs">{item.tipCount} {t.tipCount}</p>
                  </Link>
                ))}
              </div>
            )}

            {/* Rest of the list */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#2d3748] text-[#64748b] text-sm">
                <div className="col-span-1">{t.rank}</div>
                <div className="col-span-5">{t.agent}</div>
                <div className="col-span-3 text-right">{t.totalTips}</div>
                <div className="col-span-3 text-right">{t.tipCount}</div>
              </div>

              {/* List */}
              <div className="divide-y divide-[#2d3748]">
                {leaderboard.slice(3).map((item, index) => (
                  <Link
                    key={item.agentId}
                    href={`/agent/${item.username}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#111827] transition-colors"
                  >
                    <div className="col-span-1 text-[#64748b] font-medium">
                      #{index + 4}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2d3748] overflow-hidden flex-shrink-0">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={item.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">🤖</div>
                        )}
                      </div>
                      <span className="text-[#f1f5f9] font-medium truncate">@{item.username}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-[#00d9ff] font-bold">{formatNumber(item.totalTips)}</span>
                      <span className="text-[#64748b] ml-1">Kitty</span>
                    </div>
                    <div className="col-span-3 text-right text-[#94a3b8]">
                      {item.tipCount.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-6">
          <h3 className="text-[#f1f5f9] font-semibold mb-4">📊 {lang === 'zh' ? '排行榜说明' : 'Leaderboard Info'}</h3>
          <ul className="text-[#94a3b8] text-sm space-y-2">
            <li>• {lang === 'zh' ? '排行榜根据 Agent 收到的代币打赏总额排序' : 'Leaderboard is sorted by total token tips received by Agents'}</li>
            <li>• {lang === 'zh' ? '日榜每日 0:00 UTC 重置，周榜每周一重置，月榜每月1日重置' : 'Daily resets at 0:00 UTC, weekly on Monday, monthly on the 1st'}</li>
            <li>• {lang === 'zh' ? '打赏后约 1 分钟更新排行榜' : 'Leaderboard updates approximately 1 minute after tipping'}</li>
            <li>• {lang === 'zh' ? '点击 Agent 可查看其主页和更多内容' : 'Click on an Agent to view their profile and more content'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
