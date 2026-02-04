'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export default function CheckInModal({ isOpen, onClose, lang }: CheckInModalProps) {
  const { user, token } = useWallet();
  const [loading, setLoading] = useState(false);
  const [pointsInfo, setPointsInfo] = useState<any>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [error, setError] = useState('');

  const t = {
    title: lang === 'zh' ? '🎁 每日签到' : '🎁 Daily Check-in',
    streak: lang === 'zh' ? '连续签到' : 'Streak',
    days: lang === 'zh' ? '天' : ' days',
    maxStreak: lang === 'zh' ? '最高记录' : 'Best Record',
    currentPoints: lang === 'zh' ? '当前积分' : 'Current Points',
    checkIn: lang === 'zh' ? '领取 5 积分' : 'Claim 5 Points',
    checking: lang === 'zh' ? '签到中...' : 'Checking in...',
    alreadyCheckedIn: lang === 'zh' ? '今日已签到 ✅' : 'Already Checked In ✅',
    success: lang === 'zh' ? '签到成功！' : 'Check-in Successful!',
    earned: lang === 'zh' ? '获得' : 'Earned',
    points: lang === 'zh' ? '积分' : 'points',
    close: lang === 'zh' ? '关闭' : 'Close',
    needLogin: lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first',
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchPointsInfo();
    }
  }, [isOpen, token]);

  const fetchPointsInfo = async () => {
    try {
      const res = await fetch('/api/user/points', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPointsInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch points info:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    setCheckInResult(null);

    try {
      const res = await fetch('/api/user/check-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setCheckInResult(data);
        setPointsInfo((prev: any) => ({
          ...prev,
          points: data.currentPoints,
          checkInStreak: data.streak,
          maxStreak: data.maxStreak,
          canCheckIn: false,
        }));
      } else {
        setError(data.error || data.message || '签到失败');
      }
    } catch (err) {
      setError('签到失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 text-center">{t.title}</h2>

        {!user ? (
          <div className="text-center py-8">
            <p className="text-[#94a3b8]">{t.needLogin}</p>
          </div>
        ) : (
          <>
            {/* 积分信息 */}
            <div className="bg-[#111827] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#94a3b8]">{t.currentPoints}</span>
                <span className="text-2xl font-bold text-[#00d9ff]">
                  💰 {pointsInfo?.points || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-[#64748b]">{t.streak}: </span>
                  <span className="text-[#f59e0b] font-medium">
                    {pointsInfo?.checkInStreak || 0}{t.days}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">{t.maxStreak}: </span>
                  <span className="text-[#a855f7] font-medium">
                    {pointsInfo?.maxStreak || 0}{t.days}
                  </span>
                </div>
              </div>
            </div>

            {/* 签到结果 */}
            {checkInResult && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 text-center">
                <p className="text-green-400 font-medium">{t.success}</p>
                <p className="text-green-300 text-lg mt-1">
                  {t.earned} <span className="font-bold">+{checkInResult.pointsEarned}</span> {t.points}
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* 签到按钮 */}
            <button
              onClick={handleCheckIn}
              disabled={loading || !pointsInfo?.canCheckIn}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                pointsInfo?.canCheckIn
                  ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white hover:opacity-90'
                  : 'bg-[#2d3748] text-[#64748b] cursor-not-allowed'
              }`}
            >
              {loading ? t.checking : pointsInfo?.canCheckIn ? t.checkIn : t.alreadyCheckedIn}
            </button>
          </>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-[#94a3b8] hover:text-white transition-colors"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
