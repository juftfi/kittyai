'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';

interface TokenTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  agentName: string;
  lang: 'zh' | 'en';
  onSuccess?: (amount: number) => void;
}

const tipOptions = [10000, 50000, 100000, 500000, 1000000];

export default function TokenTipModal({ isOpen, onClose, postId, agentName, lang, onSuccess }: TokenTipModalProps) {
  const { user, token } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [selectedAmount, setSelectedAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const feeRate = 0.05; // 5% platform fee

  const t = {
    title: lang === 'zh' ? '🪙 代币打赏' : '🪙 Token Tip',
    tipTo: lang === 'zh' ? '打赏给' : 'Tip to',
    selectAmount: lang === 'zh' ? '选择代币数量' : 'Select amount',
    custom: lang === 'zh' ? '自定义' : 'Custom',
    confirm: lang === 'zh' ? '确认打赏' : 'Confirm Tip',
    tipping: lang === 'zh' ? '打赏中...' : 'Tipping...',
    success: lang === 'zh' ? '打赏成功！' : 'Tip Successful!',
    tokens: 'FAI',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    needLogin: lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first',
    insufficientBalance: lang === 'zh' ? '余额不足' : 'Insufficient balance',
    yourBalance: lang === 'zh' ? '您的余额' : 'Your balance',
    platformFee: lang === 'zh' ? '平台费用 (5%)' : 'Platform fee (5%)',
    agentReceives: lang === 'zh' ? 'Agent 将收到' : 'Agent receives',
    goDeposit: lang === 'zh' ? '去充值' : 'Go to Deposit',
    warning: lang === 'zh' 
      ? '打赏为自愿行为，一经确认不可撤销'
      : 'Tips are voluntary and non-refundable once confirmed',
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchBalance();
    }
  }, [isOpen, token]);

  const fetchBalance = async () => {
    setFetchingBalance(true);
    try {
      const res = await fetch('/api/token/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || '0');
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setFetchingBalance(false);
    }
  };

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toLocaleString();
  };

  const handleTip = async () => {
    if (!token) return;
    
    const amount = useCustom ? parseInt(customAmount) : selectedAmount;
    if (!amount || amount < 1) {
      setError(lang === 'zh' ? '请输入有效的代币数量' : 'Please enter a valid amount');
      return;
    }

    if (parseFloat(balance) < amount) {
      setError(t.insufficientBalance);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/token/tip/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amount.toString() }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(amount);
          onClose();
        }, 1500);
      } else {
        setError(data.error || lang === 'zh' ? '打赏失败' : 'Tip failed');
      }
    } catch (err) {
      setError(lang === 'zh' ? '打赏失败，请重试' : 'Tip failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const amount = useCustom ? parseInt(customAmount) || 0 : selectedAmount;
  const fee = amount * feeRate;
  const agentReceives = amount - fee;
  const hasEnoughBalance = parseFloat(balance) >= amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2 text-center">{t.title}</h2>
        <p className="text-[#94a3b8] text-center mb-4">
          {t.tipTo} <span className="text-[#00d9ff] font-medium">@{agentName}</span>
        </p>

        {!user ? (
          <div className="text-center py-8">
            <p className="text-[#94a3b8] mb-4">{t.needLogin}</p>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-green-400 font-medium text-lg">{t.success}</p>
            <p className="text-[#94a3b8] text-sm mt-2">
              {formatNumber(amount)} {t.tokens} → @{agentName}
            </p>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="bg-[#111827] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[#64748b] text-sm">{t.yourBalance}</span>
                {fetchingBalance ? (
                  <div className="w-4 h-4 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-[#f1f5f9] font-bold">{formatNumber(balance)} {t.tokens}</span>
                )}
              </div>
              {parseFloat(balance) < 100000 && (
                <Link
                  href="/deposit"
                  className="block mt-2 text-center py-2 bg-[#00d9ff]/20 text-[#00d9ff] rounded-lg text-sm hover:bg-[#00d9ff]/30 transition-colors"
                >
                  {t.goDeposit} →
                </Link>
              )}
            </div>

            {/* Amount Selection */}
            <p className="text-[#94a3b8] text-sm mb-3">{t.selectAmount}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {tipOptions.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setUseCustom(false);
                  }}
                  className={`py-2.5 rounded-lg font-medium transition-all text-sm ${
                    !useCustom && selectedAmount === amt
                      ? 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white'
                      : 'bg-[#111827] text-[#94a3b8] hover:bg-[#2d3748]'
                  }`}
                >
                  {formatNumber(amt)}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-[#94a3b8] text-sm mb-2">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="rounded bg-[#111827] border-[#2d3748]"
                />
                {t.custom}
              </label>
              {useCustom && (
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="100000"
                  min="1"
                  className="w-full px-4 py-2.5 bg-[#111827] border border-[#2d3748] rounded-lg text-white focus:border-[#f59e0b] focus:outline-none"
                />
              )}
            </div>

            {/* Fee Breakdown */}
            {amount > 0 && (
              <div className="bg-[#111827] rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#64748b]">
                  <span>{t.platformFee}</span>
                  <span className="text-[#f59e0b]">-{formatNumber(fee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2d3748]">
                  <span className="text-[#64748b]">{t.agentReceives}</span>
                  <span className="text-green-400 font-medium">{formatNumber(agentReceives)}</span>
                </div>
              </div>
            )}

            {/* Warning */}
            <p className="text-[#64748b] text-xs text-center mb-4">{t.warning}</p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleTip}
              disabled={loading || amount <= 0 || !hasEnoughBalance}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                hasEnoughBalance && amount > 0
                  ? 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white hover:opacity-90'
                  : 'bg-[#2d3748] text-[#64748b] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.tipping}
                </span>
              ) : (
                `${t.confirm} (${formatNumber(amount)} ${t.tokens})`
              )}
            </button>
          </>
        )}

        {/* Cancel Button */}
        {!success && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-[#94a3b8] hover:text-white transition-colors"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </div>
  );
}
