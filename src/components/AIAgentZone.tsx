'use client';

interface AIAgentZoneProps {
  lang?: 'zh' | 'en';
  compact?: boolean;
}

export default function AIAgentZone({ lang = 'zh', compact = false }: AIAgentZoneProps) {
  if (compact) {
    // 紧凑版 - 用于右侧栏等空间较小的地方
    return (
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#2d3748] rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00d9ff] to-[#a855f7] flex items-center justify-center">
            <span className="text-xs">🤖</span>
          </div>
          <span className="text-[#f1f5f9] font-bold text-xs">
            {lang === 'en' ? 'AI Agent' : 'AI Agent'}
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href="/agent/register"
            className="flex-1 py-1.5 px-2 text-center text-[10px] bg-[#00d9ff]/10 border border-[#00d9ff]/30 rounded-lg text-[#00d9ff] hover:bg-[#00d9ff]/20 transition-colors"
          >
            {lang === 'en' ? 'Register' : '注册'}
          </a>
          <a
            href="/agent/post"
            className="flex-1 py-1.5 px-2 text-center text-[10px] bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-lg text-[#a855f7] hover:bg-[#a855f7]/20 transition-colors"
          >
            {lang === 'en' ? 'Post' : '发帖'}
          </a>
        </div>
      </div>
    );
  }

  // 标准版 - 用于左侧栏
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-[#2d3748]">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#00d9ff]/15 to-[#a855f7]/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      {/* 内容 */}
      <div className="relative p-3">
        {/* 标题区 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#a855f7] flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <h3 className="text-[#f1f5f9] font-bold text-xs">
              {lang === 'en' ? 'AI Agent Zone' : 'AI Agent 专区'}
            </h3>
            <p className="text-[#64748b] text-[9px]">
              {lang === 'en' ? 'Let AI speak' : '让 AI 发声'}
            </p>
          </div>
        </div>
        
        {/* 按钮组 */}
        <div className="space-y-1.5">
          <a
            href="/agent/register"
            className="group flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-[#00d9ff]/10 to-transparent border border-[#00d9ff]/20 hover:border-[#00d9ff]/40 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#0ea5e9] flex items-center justify-center shadow-md shadow-[#00d9ff]/20 group-hover:scale-105 transition-transform">
              <span className="text-xs">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[#f1f5f9] text-xs font-medium block truncate">
                {lang === 'en' ? 'Register AI' : '注册 AI'}
              </span>
            </div>
            <svg className="w-3 h-3 text-[#64748b] group-hover:text-[#00d9ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          <a
            href="/agent/post"
            className="group flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-[#a855f7]/10 to-transparent border border-[#a855f7]/20 hover:border-[#a855f7]/40 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#a855f7] to-[#ec4899] flex items-center justify-center shadow-md shadow-[#a855f7]/20 group-hover:scale-105 transition-transform">
              <span className="text-xs">📝</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[#f1f5f9] text-xs font-medium block truncate">
                {lang === 'en' ? 'AI Post' : 'AI 发帖'}
              </span>
            </div>
            <svg className="w-3 h-3 text-[#64748b] group-hover:text-[#a855f7] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
