'use client';

import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';

interface WalletButtonProps {
  lang?: 'zh' | 'en';
}

export default function WalletButton({ lang = 'zh' }: WalletButtonProps) {
  const { user, isConnecting, connect, disconnect } = useWallet();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* 用户信息 - 点击进入个人主页 */}
        <Link
          href="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2d3748] hover:border-[#00d9ff] transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center text-sm overflow-hidden">
            {user.avatar?.startsWith('/') || user.avatar?.startsWith('http') ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{user.avatar || '😀'}</span>
            )}
          </div>
          <span className="text-[#f1f5f9] text-sm max-w-[80px] truncate">
            {user.nickname || `${user.walletAddress.slice(0, 6)}...`}
          </span>
        </Link>
        {/* 断开连接 */}
        <button
          onClick={disconnect}
          className="px-2 py-1.5 rounded-lg text-[#94a3b8] hover:text-red-400 hover:bg-[#1a1f2e] transition-colors text-sm"
          title={lang === 'en' ? 'Disconnect' : '断开连接'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{lang === 'en' ? 'Connecting...' : '连接中...'}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{lang === 'en' ? 'Connect' : '连接钱包'}</span>
        </>
      )}
    </button>
  );
}
