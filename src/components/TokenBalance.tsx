'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';

interface TokenBalanceData {
  balance: string;
  lockedBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  totalTipped: string;
  totalReceived: string;
  totalRewards: string;
}

interface TokenBalanceProps {
  lang?: 'zh' | 'en';
  compact?: boolean;
}

export default function TokenBalance({ lang = 'zh', compact = false }: TokenBalanceProps) {
  const { user, token } = useWallet();
  const [balance, setBalance] = useState<TokenBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: lang === 'zh' ? '代币余额' : 'Token Balance',
    available: lang === 'zh' ? '可用' : 'Available',
    locked: lang === 'zh' ? '锁定中' : 'Locked',
    deposit: lang === 'zh' ? '充值' : 'Deposit',
    withdraw: lang === 'zh' ? '提现' : 'Withdraw',
    notConnected: lang === 'zh' ? '请先连接钱包' : 'Connect wallet first',
    loading: lang === 'zh' ? '加载中...' : 'Loading...',
    error: lang === 'zh' ? '获取余额失败' : 'Failed to load balance',
    totalDeposited: lang === 'zh' ? '累计充值' : 'Total Deposited',
    totalWithdrawn: lang === 'zh' ? '累计提现' : 'Total Withdrawn',
    totalTipped: lang === 'zh' ? '累计打赏' : 'Total Tipped',
    totalReceived: lang === 'zh' ? '累计收到' : 'Total Received',
    totalRewards: lang === 'zh' ? '累计奖励' : 'Total Rewards',
    warning: lang === 'zh' 
      ? '⚠️ 数字资产有风险，请谨慎操作'
      : '⚠️ Digital assets carry risks, proceed with caution',
  };

  useEffect(() => {
    if (token) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [token]);

  const fetchBalance = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/token/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      } else {
        setError(t.error);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string | undefined) => {
    if (!num) return '0';
    const n = parseFloat(num);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  };

  if (!user) {
    if (compact) return null;
    return (
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4 text-center">
        <p className="text-[#94a3b8] text-sm">{t.notConnected}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
          <div className="w-4 h-4 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button 
          onClick={fetchBalance}
          className="mt-2 text-[#00d9ff] text-sm hover:underline block mx-auto"
        >
          {lang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    );
  }

  // Compact mode - just show balance
  if (compact) {
    return (
      <Link 
        href="/deposit"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f59e0b]/10 to-[#ef4444]/10 border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 transition-colors"
      >
        <span className="text-lg">🪙</span>
        <span className="text-[#f59e0b] font-medium text-sm">
          {formatNumber(balance?.balance || '0')}
        </span>
      </Link>
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2d3748] bg-gradient-to-r from-[#f59e0b]/10 to-[#ef4444]/10">
        <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2">
          <span>🪙</span>
          <span>{t.title}</span>
        </h3>
      </div>

      {/* Balance Display */}
      <div className="p-4">
        <div className="text-center mb-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">{t.available}</p>
          <p className="text-3xl font-bold gradient-text">
            {formatNumber(balance?.balance || '0')}
          </p>
          <p className="text-[#64748b] text-xs mt-1">KittyAI Token</p>
        </div>

        {/* Locked Balance */}
        {balance?.lockedBalance && parseFloat(balance.lockedBalance) > 0 && (
          <div className="text-center mb-4 py-2 bg-[#111827] rounded-lg">
            <p className="text-[#64748b] text-xs">{t.locked}</p>
            <p className="text-[#f59e0b] font-medium">
              {formatNumber(balance.lockedBalance)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Link
            href="/deposit"
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white text-sm font-medium text-center hover:opacity-90 transition-opacity"
          >
            {t.deposit}
          </Link>
          <Link
            href="/withdraw"
            className="flex-1 py-2 rounded-lg border border-[#2d3748] text-[#94a3b8] text-sm font-medium text-center hover:bg-[#111827] hover:text-white transition-colors"
          >
            {t.withdraw}
          </Link>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-[#64748b]">
            <span>{t.totalDeposited}</span>
            <span className="text-[#f1f5f9]">{formatNumber(balance?.totalDeposited)}</span>
          </div>
          <div className="flex justify-between text-[#64748b]">
            <span>{t.totalWithdrawn}</span>
            <span className="text-[#f1f5f9]">{formatNumber(balance?.totalWithdrawn)}</span>
          </div>
          <div className="flex justify-between text-[#64748b]">
            <span>{t.totalTipped}</span>
            <span className="text-[#f1f5f9]">{formatNumber(balance?.totalTipped)}</span>
          </div>
          <div className="flex justify-between text-[#64748b]">
            <span>{t.totalReceived}</span>
            <span className="text-[#00d9ff]">{formatNumber(balance?.totalReceived)}</span>
          </div>
          <div className="flex justify-between text-[#64748b]">
            <span>{t.totalRewards}</span>
            <span className="text-[#a855f7]">{formatNumber(balance?.totalRewards)}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-4 p-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
          <p className="text-[#f59e0b] text-xs text-center">{t.warning}</p>
        </div>
      </div>
    </div>
  );
}
