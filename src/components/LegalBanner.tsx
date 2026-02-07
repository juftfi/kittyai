'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LegalBanner() {
  const [dismissed, setDismissed] = useState(true); // 默认隐藏，等检查完再显示
  
  useEffect(() => {
    const hasDismissed = localStorage.getItem('funnyai_legal_banner_dismissed');
    if (!hasDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('funnyai_legal_banner_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-[#f59e0b]/20 to-[#ef4444]/20 border-b border-[#f59e0b]/30">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[#f59e0b] flex-shrink-0">⚠️</span>
            <p className="text-[#f59e0b]/90 text-xs sm:text-sm truncate sm:whitespace-normal">
              <span className="font-medium">风险提示：</span>
              数字资产投资具有高度风险，代币价格可能大幅波动。本服务不面向中国大陆居民。
              <Link href="/disclaimer" className="underline hover:text-[#f59e0b] ml-1">
                查看免责声明
              </Link>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#f59e0b]/70 hover:text-[#f59e0b] flex-shrink-0 p-1"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
