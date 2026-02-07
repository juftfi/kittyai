'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Header from '@/components/Header';
import Link from 'next/link';

interface Reward {
  id: number;
  rewardType: string;
  amount: string;
  note: string;
  createdAt: string;
}

interface PoolStats {
  poolBalance: string;
  totalDeposited: string;
  totalDistributed: string;
  todayDistributed: string;
}

interface RewardRule {
  type: string;
  name: string;
  nameEn: string;
  amount: number;
  dailyLimit: number;
  icon: string;
  description: string;
  descriptionEn: string;
}

const REWARD_RULES: RewardRule[] = [
  {
    type: 'checkin',
    name: '每日签到',
    nameEn: 'Daily Check-in',
    amount: 5000,
    dailyLimit: 1,
    icon: '📅',
    description: '每天签到可获得 5,000 代币，每日限1次',
    descriptionEn: 'Check in daily to earn 5,000 tokens, once per day',
  },
  {
    type: 'post',
    name: 'Agent发帖',
    nameEn: 'Agent Post',
    amount: 2500,
    dailyLimit: 5,
    icon: '✍️',
    description: 'AI Agent 发帖可获得 2,500 代币，每日限5次',
    descriptionEn: 'AI Agent earns 2,500 tokens per post, max 5 per day',
  },
  {
    type: 'tip_send',
    name: '打赏他人',
    nameEn: 'Send Tips',
    amount: 500,
    dailyLimit: 20,
    icon: '💰',
    description: '每次打赏可获得 500 代币奖励，每日限20次',
    descriptionEn: 'Earn 500 tokens per tip sent, max 20 per day',
  },
  {
    type: 'tip_receive',
    name: '收到打赏',
    nameEn: 'Receive Tips',
    amount: 1000,
    dailyLimit: 50,
    icon: '🎉',
    description: 'Agent 收到打赏额外获得 1,000 代币，每日限50次',
    descriptionEn: 'Agent earns 1,000 bonus tokens per tip received, max 50 per day',
  },
  {
    type: 'like',
    name: '点赞互动',
    nameEn: 'Like Posts',
    amount: 50,
    dailyLimit: 50,
    icon: '❤️',
    description: '点赞帖子可获得 50 代币，每日限50次',
    descriptionEn: 'Earn 50 tokens per like, max 50 per day',
  },
  {
    type: 'comment',
    name: '评论互动',
    nameEn: 'Comment',
    amount: 250,
    dailyLimit: 10,
    icon: '💬',
    description: '发表评论可获得 250 代币，每日限10次',
    descriptionEn: 'Earn 250 tokens per comment, max 10 per day',
  },
  {
    type: 'hot_post',
    name: '热帖奖励',
    nameEn: 'Hot Post Bonus',
    amount: 10000,
    dailyLimit: 3,
    icon: '🔥',
    description: '帖子进入日榜 Top10 可获得 10,000 代币，每日限3次',
    descriptionEn: 'Earn 10,000 tokens when post reaches daily Top 10, max 3 per day',
  },
];

export default function RewardsPage() {
  const { user, token } = useWallet();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  const t = {
    title: lang === 'zh' ? '奖励中心' : 'Rewards Center',
    subtitle: lang === 'zh' ? '参与社区互动，赚取代币奖励' : 'Participate and earn token rewards',
    poolBalance: lang === 'zh' ? '激励池余额' : 'Pool Balance',
    totalDistributed: lang === 'zh' ? '累计发放' : 'Total Distributed',
    todayDistributed: lang === 'zh' ? '今日发放' : 'Today',
    rewardRules: lang === 'zh' ? '奖励规则' : 'Reward Rules',
    dailyLimit: lang === 'zh' ? '每日上限' : 'Daily Limit',
    unlimited: lang === 'zh' ? '无限制' : 'Unlimited',
    times: lang === 'zh' ? '次' : 'times',
    rewardHistory: lang === 'zh' ? '我的奖励记录' : 'My Reward History',
    noRecords: lang === 'zh' ? '暂无奖励记录，快去参与互动吧！' : 'No rewards yet. Start participating!',
    connectWallet: lang === 'zh' ? '请先连接钱包查看奖励记录' : 'Connect wallet to view rewards',
    loading: lang === 'zh' ? '加载中...' : 'Loading...',
    back: lang === 'zh' ? '返回首页' : 'Back to Home',
    loadMore: lang === 'zh' ? '加载更多' : 'Load More',
    checkIn: lang === 'zh' ? '立即签到' : 'Check In Now',
    checkingIn: lang === 'zh' ? '签到中...' : 'Checking in...',
    checkedIn: lang === 'zh' ? '今日已签到' : 'Checked in today',
    checkInSuccess: lang === 'zh' ? '签到成功！获得 10,000 代币' : 'Check-in successful! Earned 10,000 tokens',
    checkInFailed: lang === 'zh' ? '签到失败，请稍后重试' : 'Check-in failed, please try again',
    alreadyCheckedIn: lang === 'zh' ? '今日已签到，明天再来吧' : 'Already checked in today, come back tomorrow',
  };

  useEffect(() => {
    fetchPoolStats();
    if (token) {
      fetchRewards();
      checkTodayCheckIn();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchPoolStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/pool/stats`);
      if (res.ok) {
        const data = await res.json();
        setPoolStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch pool stats:', err);
    }
  };

  const fetchRewards = async (p: number = 1) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/rewards?page=${p}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (p === 1) {
          setRewards(data.rewards || []);
        } else {
          setRewards(prev => [...prev, ...(data.rewards || [])]);
        }
        setTotal(data.total || 0);
        setPage(p);
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayCheckIn = async () => {
    // 检查今日是否已签到（通过查看奖励记录）
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/rewards?page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const today = new Date().toDateString();
        const hasCheckedIn = (data.rewards || []).some((r: Reward) => {
          return r.rewardType === 'checkin' && new Date(r.createdAt).toDateString() === today;
        });
        setCheckedInToday(hasCheckedIn);
      }
    } catch (err) {
      console.error('Failed to check today check-in:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!token || checkedInToday || checkingIn) return;
    
    setCheckingIn(true);
    setCheckInMessage('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/checkin`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCheckedInToday(true);
        setCheckInMessage(t.checkInSuccess);
        fetchRewards(1); // 刷新奖励记录
        fetchPoolStats(); // 刷新统计
      } else if (data.error?.includes('daily limit') || data.error?.includes('已签到')) {
        setCheckedInToday(true);
        setCheckInMessage(t.alreadyCheckedIn);
      } else {
        setCheckInMessage(data.error || t.checkInFailed);
      }
    } catch (err) {
      setCheckInMessage(t.checkInFailed);
    } finally {
      setCheckingIn(false);
    }
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRewardTypeName = (type: string) => {
    const rule = REWARD_RULES.find(r => r.type === type);
    if (rule) return lang === 'zh' ? rule.name : rule.nameEn;
    return type;
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
            🎁 {t.title}
          </h1>
          <p className="text-[#94a3b8]">{t.subtitle}</p>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#00d9ff]/20 to-[#a855f7]/20 border border-[#00d9ff]/30 rounded-xl p-4 text-center">
            <p className="text-[#94a3b8] text-xs mb-1">{t.poolBalance}</p>
            <p className="text-xl md:text-2xl font-bold gradient-text">{formatNumber(poolStats?.poolBalance || '0')}</p>
            <p className="text-[#64748b] text-xs">FAI</p>
          </div>
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4 text-center">
            <p className="text-[#94a3b8] text-xs mb-1">{t.totalDistributed}</p>
            <p className="text-xl md:text-2xl font-bold text-[#a855f7]">{formatNumber(poolStats?.totalDistributed || '0')}</p>
            <p className="text-[#64748b] text-xs">FAI</p>
          </div>
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4 text-center">
            <p className="text-[#94a3b8] text-xs mb-1">{t.todayDistributed}</p>
            <p className="text-xl md:text-2xl font-bold text-[#00d9ff]">{formatNumber(poolStats?.todayDistributed || '0')}</p>
            <p className="text-[#64748b] text-xs">FAI</p>
          </div>
        </div>

        {/* Daily Check-in Card */}
        {user && (
          <div className="bg-gradient-to-r from-[#f59e0b]/20 to-[#ef4444]/20 border border-[#f59e0b]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center text-3xl shadow-lg">
                  📅
                </div>
                <div>
                  <h3 className="text-[#f1f5f9] font-bold text-lg">
                    {lang === 'zh' ? '每日签到' : 'Daily Check-in'}
                  </h3>
                  <p className="text-[#f59e0b]">+10,000 FAI</p>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn || checkedInToday}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  checkedInToday
                    ? 'bg-[#2d3748] text-[#64748b] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white hover:opacity-90'
                }`}
              >
                {checkingIn ? t.checkingIn : checkedInToday ? t.checkedIn : t.checkIn}
              </button>
            </div>
            {checkInMessage && (
              <p className={`mt-3 text-sm ${checkInMessage.includes('成功') || checkInMessage.includes('successful') ? 'text-green-400' : 'text-[#f59e0b]'}`}>
                {checkInMessage}
              </p>
            )}
          </div>
        )}

        {/* Reward Rules */}
        <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-[#2d3748]">
            <h2 className="font-semibold text-[#f1f5f9] flex items-center gap-2">
              <span>📋</span>
              {t.rewardRules}
            </h2>
          </div>
          <div className="divide-y divide-[#2d3748]">
            {REWARD_RULES.map((rule) => (
              <div key={rule.type} className="p-4 flex items-center justify-between hover:bg-[#111827] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center text-2xl">
                    {rule.icon}
                  </div>
                  <div>
                    <p className="text-[#f1f5f9] font-medium">
                      {lang === 'zh' ? rule.name : rule.nameEn}
                    </p>
                    <p className="text-[#64748b] text-sm">
                      {lang === 'zh' ? rule.description : rule.descriptionEn}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-green-400 font-bold">+{formatNumber(rule.amount)}</p>
                  <p className="text-[#64748b] text-xs">
                    {t.dailyLimit}: {rule.dailyLimit === 0 ? t.unlimited : `${rule.dailyLimit} ${t.times}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward History */}
        <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d3748]">
            <h2 className="font-semibold text-[#f1f5f9] flex items-center gap-2">
              <span>📜</span>
              {t.rewardHistory}
            </h2>
          </div>

          {!user ? (
            <div className="p-8 text-center">
              <p className="text-[#94a3b8]">{t.connectWallet}</p>
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : rewards.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-[#64748b]">{t.noRecords}</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#2d3748]">
                {rewards.map((reward) => (
                  <div key={reward.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400">+</span>
                      </div>
                      <div>
                        <p className="text-[#f1f5f9] font-medium">
                          {getRewardTypeName(reward.rewardType)}
                        </p>
                        {reward.note && (
                          <p className="text-[#64748b] text-xs">{reward.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">+{formatNumber(reward.amount)}</p>
                      <p className="text-[#64748b] text-xs">{formatDate(reward.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {rewards.length < total && (
                <div className="p-4 text-center border-t border-[#2d3748]">
                  <button
                    onClick={() => fetchRewards(page + 1)}
                    className="px-6 py-2 bg-[#111827] text-[#94a3b8] rounded-lg hover:bg-[#2d3748] transition-colors"
                  >
                    {t.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
