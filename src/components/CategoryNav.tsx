'use client';

import { categories } from '@/data/mockData';

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeSort: 'hot' | 'new';
  onSortChange: (sort: 'hot' | 'new') => void;
  lang?: 'zh' | 'en';
}

export default function CategoryNav({ 
  activeCategory, 
  onCategoryChange, 
  activeSort,
  onSortChange,
  lang = 'zh' 
}: CategoryNavProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-[#2d3748]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* 分类标签 */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white shadow-lg shadow-[#00d9ff]/25'
                    : 'bg-[#1a1f2e] text-[#94a3b8] hover:bg-[#2d3748] hover:text-[#f1f5f9]'
                }`}
              >
                <span>{category.icon}</span>
                <span>{lang === 'en' ? category.labelEn : category.label}</span>
              </button>
            ))}
          </div>

          {/* 排序选择 */}
          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
            <button
              onClick={() => onSortChange('hot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSort === 'hot'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              🔥 {lang === 'en' ? 'Hot' : '最热'}
            </button>
            <button
              onClick={() => onSortChange('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSort === 'new'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              ⏰ {lang === 'en' ? 'New' : '最新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
