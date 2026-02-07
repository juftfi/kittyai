'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Header from '@/components/Header';
import Link from 'next/link';

interface Withdrawal {
  id: number;
  amount: string;
  fee: string;
  netAmount: string;
  toAddress: string;
  txHash?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface BalanceInfo {
  balance: string;
  lockedBalance: string;
}

export default function WithdrawPage() {
  const { user, token } = useWallet();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const minWithdraw = 100000;
  const feeRate = 0.02;

  const t = {
    title: lang === 'zh' ? '提现 FunnyAI 代币' : 'Withdraw FunnyAI Token',
    subtitle: lang === 'zh' ? '将代币提取到您的钱包' : 'Withdraw tokens to your wallet',
    availableBalance: lang === 'zh' ? '可用余额' : 'Available Balance',
    withdrawAmount: lang === 'zh' ? '提现数量' : 'Withdraw Amount',
    toAddressLabel: lang === 'zh' ? '提现地址' : 'Withdraw Address',
    toAddressPlaceholder: lang === 'zh' ? '输入 BSC 钱包地址' : 'Enter BSC wallet address',
    useConnectedWallet: lang === 'zh' ? '使用当前钱包' : 'Use connected wallet',
    fee: lang === 'zh' ? '手续费 (2%)' : 'Fee (2%)',
    willReceive: lang === 'zh' ? '实际到账' : 'You will receive',
    minWithdraw: lang === 'zh' ? '最低提现' : 'Minimum withdrawal',
    submit: lang === 'zh' ? '提交提现申请' : 'Submit Withdrawal',
    submitting: lang === 'zh' ? '提交中...' : 'Submitting...',
    history: lang === 'zh' ? '提现记录' : 'Withdrawal History',
    noRecords: lang === 'zh' ? '暂无提现记录' : 'No withdrawal records',
    pending: lang === 'zh' ? '处理中' : 'Processing',
    approved: lang === 'zh' ? '已批准' : 'Approved',
    completed: lang === 'zh' ? '已完成' : 'Completed',
    rejected: lang === 'zh' ? '已拒绝' : 'Rejected',
    connectWallet: lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first',
    loading: lang === 'zh' ? '加载中...' : 'Loading...',
    back: lang === 'zh' ? '返回首页' : 'Back to Home',
    warning: lang === 'zh' 
      ? '⚠️ 提现申请提交后，预计 24 小时内处理。请确保提现地址正确，错误地址导致的损失无法找回。'
      : '⚠️ Withdrawal requests are processed within 24 hours. Please ensure the address is correct. Losses due to incorrect addresses cannot be recovered.',
    insufficientBalance: lang === 'zh' ? '余额不足' : 'Insufficient balance',
    invalidAmount: lang === 'zh' ? '请输入有效金额' : 'Please enter a valid amount',
    invalidAddress: lang === 'zh' ? '请输入有效的钱包地址' : 'Please enter a valid wallet address',
    belowMinimum: lang === 'zh' ? `最低提现 ${minWithdraw.toLocaleString()} 代币` : `Minimum withdrawal is ${minWithdraw.toLocaleString()} tokens`,
    successMessage: lang === 'zh' ? '提现申请已提交，请耐心等待处理' : 'Withdrawal request submitted, please wait for processing',
    all: lang === 'zh' ? '全部' : 'Max',
  };

  useEffect(() => {
    if (token) {
      fetchBalance();
      fetchWithdrawals();
    }
  }, [token]);

  useEffect(() => {
    if (user && !toAddress) {
      setToAddress(user.walletAddress);
    }
  }, [user]);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/token/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/token/withdraw/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    }
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
  };

  const calculateFee = (amt: number) => {
    return amt * feeRate;
  };

  const calculateReceive = (amt: number) => {
    return amt - calculateFee(amt);
  };

  const handleSetMax = () => {
    if (balance) {
      setAmount(balance.balance);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError(t.invalidAmount);
      return;
    }

    if (amountNum < minWithdraw) {
      setError(t.belowMinimum);
      return;
    }

    if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError(t.invalidAddress);
      return;
    }

    if (balance && amountNum > parseFloat(balance.balance)) {
      setError(t.insufficientBalance);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/token/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          toAddress: toAddress,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(t.successMessage);
        setAmount('');
        fetchBalance();
        fetchWithdrawals();
      } else {
        setError(data.error || 'Withdrawal failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Header lang={lang} onLangChange={setLang} />

      <div className="max-w-2xl mx-auto px-4 py-8">
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
            💸 {t.title}
          </h1>
          <p className="text-[#94a3b8]">{t.subtitle}</p>
        </div>

        {!user ? (
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-8 text-center">
            <p className="text-[#94a3b8]">{t.connectWallet}</p>
          </div>
        ) : loading ? (
          <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#94a3b8]">{t.loading}</p>
          </div>
        ) : (
          <>
            {/* Withdraw Form */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-[#2d3748]">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-sm">{t.availableBalance}</span>
                  <span className="text-[#f1f5f9] font-bold text-lg">
                    {formatNumber(balance?.balance || '0')} FAI
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">{t.withdrawAmount}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-[#111827] border border-[#2d3748] rounded-xl text-[#f1f5f9] focus:border-[#00d9ff] focus:outline-none text-lg"
                    />
                    <button
                      onClick={handleSetMax}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#00d9ff]/20 text-[#00d9ff] rounded-lg text-sm hover:bg-[#00d9ff]/30 transition-colors"
                    >
                      {t.all}
                    </button>
                  </div>
                  <p className="text-[#64748b] text-xs mt-1">{t.minWithdraw}: {minWithdraw.toLocaleString()}</p>
                </div>

                {/* To Address - 只显示当前钱包地址，不可修改 */}
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">{t.toAddressLabel}</label>
                  <div className="w-full px-4 py-3 bg-[#111827] border border-[#2d3748] rounded-xl text-[#94a3b8] font-mono text-sm">
                    {user?.walletAddress || '0x...'}
                  </div>
                  <p className="text-[#64748b] text-xs mt-1">
                    {lang === 'zh' ? '提现只能发送到当前登录的钱包地址' : 'Withdrawals can only be sent to your connected wallet'}
                  </p>
                </div>

                {/* Fee Calculation */}
                {amountNum > 0 && (
                  <div className="bg-[#111827] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">{t.fee}</span>
                      <span className="text-[#f59e0b]">-{formatNumber(calculateFee(amountNum))} FAI</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-[#2d3748]">
                      <span className="text-[#64748b]">{t.willReceive}</span>
                      <span className="text-green-400 font-medium">{formatNumber(calculateReceive(amountNum))} FAI</span>
                    </div>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <p className="text-green-400 text-sm text-center">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || amountNum <= 0}
                  className="w-full py-3 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 mb-6">
              <p className="text-[#f59e0b] text-sm">{t.warning}</p>
            </div>

            {/* Withdrawal History */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2d3748]">
                <h2 className="font-semibold text-[#f1f5f9]">{t.history}</h2>
              </div>
              
              {withdrawals.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#64748b]">{t.noRecords}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2d3748]">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[#f1f5f9] font-medium">
                            -{formatNumber(w.amount)} FAI
                          </p>
                          <p className="text-[#64748b] text-xs">
                            {t.fee}: {formatNumber(w.fee)} | {t.willReceive}: {formatNumber(w.netAmount)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          w.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400'
                            : w.status === 'approved'
                            ? 'bg-blue-500/20 text-blue-400'
                            : w.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {w.status === 'completed' ? t.completed : 
                           w.status === 'approved' ? t.approved :
                           w.status === 'pending' ? t.pending : t.rejected}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748b]">{formatDate(w.createdAt)}</span>
                        {w.txHash && (
                          <a
                            href={`https://bscscan.com/tx/${w.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00d9ff] hover:underline"
                          >
                            {w.txHash.slice(0, 10)}...
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
