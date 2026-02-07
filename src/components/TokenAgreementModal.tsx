'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TokenAgreementModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onCancel: () => void;
  lang: 'zh' | 'en';
}

export default function TokenAgreementModal({ isOpen, onAgree, onCancel, lang }: TokenAgreementModalProps) {
  const [checked, setChecked] = useState(false);

  const t = {
    title: lang === 'zh' ? '使用代币功能前请阅读' : 'Please Read Before Using Token Features',
    warning1: lang === 'zh' 
      ? '⚠️ 风险提示：数字资产投资具有高度风险性。代币价格可能大幅波动，您可能损失全部本金。请根据您的风险承受能力谨慎操作。'
      : '⚠️ Risk Warning: Digital asset investment carries high risks. Token prices may fluctuate significantly, and you may lose your entire principal. Please proceed cautiously according to your risk tolerance.',
    warning2: lang === 'zh'
      ? '🚫 地区限制：本服务不面向中国大陆居民。如果您是中国大陆居民，请勿使用本平台的代币相关功能。'
      : '🚫 Regional Restriction: This service is NOT available to residents of mainland China. If you are a resident of mainland China, please do not use the token-related features of this Platform.',
    checkboxLabel: lang === 'zh'
      ? '我已年满18周岁，不是中国大陆居民，已阅读并理解上述风险提示，自愿承担使用代币功能的全部风险。'
      : 'I am at least 18 years old, not a resident of mainland China, have read and understood the above risk warnings, and voluntarily assume all risks associated with using token features.',
    agree: lang === 'zh' ? '同意并继续' : 'Agree and Continue',
    cancel: lang === 'zh' ? '取消' : 'Cancel',
    terms: lang === 'zh' ? '服务条款' : 'Terms of Service',
    disclaimer: lang === 'zh' ? '免责声明' : 'Disclaimer',
  };

  if (!isOpen) return null;

  const handleAgree = () => {
    if (checked) {
      localStorage.setItem('funnyai_token_agreed', 'true');
      onAgree();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#f1f5f9] mb-6 text-center">
          📋 {t.title}
        </h2>

        {/* Risk Warning */}
        <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 mb-4">
          <p className="text-[#f59e0b] text-sm leading-relaxed">{t.warning1}</p>
        </div>

        {/* Regional Restriction */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm leading-relaxed">{t.warning2}</p>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-4 mb-6 text-sm">
          <Link 
            href="/terms" 
            target="_blank"
            className="text-[#00d9ff] hover:underline"
          >
            {t.terms} →
          </Link>
          <span className="text-[#2d3748]">|</span>
          <Link 
            href="/disclaimer" 
            target="_blank"
            className="text-[#00d9ff] hover:underline"
          >
            {t.disclaimer} →
          </Link>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 p-4 bg-[#111827] rounded-xl cursor-pointer mb-6 hover:bg-[#1a1f2e] transition-colors border border-[#2d3748]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-5 h-5 rounded bg-[#2d3748] border-[#4a5568] text-[#00d9ff] focus:ring-[#00d9ff] focus:ring-offset-0"
          />
          <span className="text-[#94a3b8] text-sm leading-relaxed">{t.checkboxLabel}</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#2d3748] text-[#94a3b8] font-medium hover:bg-[#111827] transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleAgree}
            disabled={!checked}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              checked
                ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white hover:opacity-90'
                : 'bg-[#2d3748] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {t.agree}
          </button>
        </div>
      </div>
    </div>
  );
}
