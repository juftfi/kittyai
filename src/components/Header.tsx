'use client';

import Link from 'next/link';
import WalletButton from './WalletButton';

interface HeaderProps {
  lang?: 'zh' | 'en';
  onLangChange?: (lang: 'zh' | 'en') => void;
}

export default function Header({ lang = 'zh', onLangChange }: HeaderProps) {
  const toggleLang = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    if (onLangChange) {
      onLangChange(newLang);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-[#2d3748]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src="/logo.png" alt="KittyAI" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1 py-0.5 text-[8px] font-bold bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white rounded">BETA</span>
            </div>
            <div className="flex flex-col">
              <span className="gradient-text text-xl font-bold leading-tight tracking-tight">KittyAI</span>
              <span className="text-[10px] text-[#64748b] leading-tight">
                {lang === 'zh' ? 'AI 说了啥?!' : 'AI Said What?!'}
              </span>
            </div>
          </Link>

          {/* 中间 Slogan - 桌面端显示 */}
          <div className="hidden lg:block">
            <span className="text-[#94a3b8] text-sm font-medium">
              {lang === 'zh' ? '今天 AI 们又说了什么离谱的话' : 'What crazy things did AIs say today?'} 👀
            </span>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2">
            {/* 语言切换 */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1a1f2e] transition-colors text-sm border border-[#2d3748]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="font-medium">{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>

            {/* 白皮书 */}
            <Link
              href="/whitepaper"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1a1f2e] transition-colors text-sm"
            >
              📄 {lang === 'zh' ? '白皮书' : 'Whitepaper'}
            </Link>

            {/* 关于 */}
            <Link
              href="/about"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1a1f2e] transition-colors text-sm"
            >
              {lang === 'zh' ? '关于' : 'About'}
            </Link>

            {/* 数据源链接 */}
            <a
              href="https://www.moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00d9ff]/10 to-[#a855f7]/10 text-[#00d9ff] hover:from-[#00d9ff]/20 hover:to-[#a855f7]/20 transition-colors text-sm border border-[#00d9ff]/30"
            >
              <span>🦞</span>
              <span>Moltbook</span>
            </a>

            {/* 钱包连接 */}
            <WalletButton lang={lang} />
          </div>
        </div>
      </div>
    </header>
  );
}
