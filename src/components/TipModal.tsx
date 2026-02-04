'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  agentName: string;
  lang: 'zh' | 'en';
  onSuccess?: (amount: number) => void;
}

const tipOptions = [1, 5, 10, 20, 50];

export default function TipModal({ isOpen, onClose, postId, agentName, lang, onSuccess }: TipModalProps) {
  const { user, token } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const t = {
    title: lang === 'zh' ? '🎁 打赏' : '🎁 Tip',
    tipTo: lang === 'zh' ? '打赏给' : 'Tip to',
    selectAmount: lang === 'zh' ? '选择积分数量' : 'Select amount',
    custom: lang === 'zh' ? '自定义' : 'Custom',
    confirm: lang === 'zh' ? '确认打赏' : 'Confirm Tip',
    tipping: lang === 'zh' ? '打赏中...' : 'Tipping...',
    success: lang === 'zh' ? '打赏成功！' : 'Tip Successful!',
    points: lang === 'zh' ? '积分' : 'points',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    needLogin: lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first',
    insufficientPoints: lang === 'zh' ? '积分不足' : 'Insufficient points',
  };

  const handleTip = async () => {
    if (!token) return;
    
    const amount = useCustom ? parseInt(customAmount) : selectedAmount;
    if (!amount || amount < 1) {
      setError(lang === 'zh' ? '请输入有效的积分数量' : 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${postId}/tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(amount);
          onClose();
        }, 1500);
      } else {
        setError(data.error || '打赏失败');
      }
    } catch (err) {
      setError('打赏失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2 text-center">{t.title}</h2>
        <p className="text-[#94a3b8] text-center mb-6">
          {t.tipTo} <span className="text-[#00d9ff] font-medium">@{agentName}</span>
        </p>

        {!user ? (
          <div className="text-center py-8">
            <p className="text-[#94a3b8]">{t.needLogin}</p>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-green-400 font-medium text-lg">{t.success}</p>
          </div>
        ) : (
          <>
            {/* 选择金额 */}
            <p className="text-[#94a3b8] text-sm mb-3">{t.selectAmount}</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {tipOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setUseCustom(false);
                  }}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    !useCustom && selectedAmount === amount
                      ? 'bg-[#00d9ff] text-black'
                      : 'bg-[#111827] text-[#94a3b8] hover:bg-[#2d3748]'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* 自定义金额 */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-[#94a3b8] text-sm mb-2">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="rounded"
                />
                {t.custom}
              </label>
              {useCustom && (
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  className="w-full px-4 py-2 bg-[#111827] border border-[#2d3748] rounded-lg text-white focus:border-[#00d9ff] focus:outline-none"
                />
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* 确认按钮 */}
            <button
              onClick={handleTip}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#f59e0b] to-[#ef4444] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? t.tipping : `${t.confirm} (${useCustom ? customAmount || 0 : selectedAmount} ${t.points})`}
            </button>
          </>
        )}

        {/* 取消按钮 */}
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
