'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import Header from '@/components/Header';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface DepositInfo {
  depositAddress: string;
  tokenContract: string;
  network: string;
  minDeposit: string;
  confirmations: number;
  warning: string;
}

interface Deposit {
  id: number;
  txHash: string;
  amount: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
}

export default function DepositPage() {
  const { user, token } = useWallet();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const t = {
    title: lang === 'zh' ? '充值 FunnyAI 代币' : 'Deposit FunnyAI Token',
    subtitle: lang === 'zh' ? '将代币发送到您的专属充值地址' : 'Send tokens to your exclusive deposit address',
    depositAddress: lang === 'zh' ? '充值地址' : 'Deposit Address',
    copy: lang === 'zh' ? '复制地址' : 'Copy Address',
    copied: lang === 'zh' ? '已复制!' : 'Copied!',
    network: lang === 'zh' ? '网络' : 'Network',
    tokenContract: lang === 'zh' ? '代币合约' : 'Token Contract',
    minDeposit: lang === 'zh' ? '最低充值' : 'Min Deposit',
    confirmations: lang === 'zh' ? '确认区块数' : 'Confirmations',
    history: lang === 'zh' ? '充值记录' : 'Deposit History',
    noRecords: lang === 'zh' ? '暂无充值记录' : 'No deposit records',
    pending: lang === 'zh' ? '确认中' : 'Pending',
    confirmed: lang === 'zh' ? '已确认' : 'Confirmed',
    failed: lang === 'zh' ? '失败' : 'Failed',
    connectWallet: lang === 'zh' ? '请先连接钱包' : 'Please connect wallet first',
    loading: lang === 'zh' ? '加载中...' : 'Loading...',
    back: lang === 'zh' ? '返回首页' : 'Back to Home',
    warning1: lang === 'zh' ? '⚠️ 重要提示' : '⚠️ Important Notice',
    warning2: lang === 'zh' 
      ? '请确保只发送 FunnyAI 代币 (FAI) 到此地址。发送其他代币将无法找回。'
      : 'Please only send FunnyAI Token (FAI) to this address. Sending other tokens will result in permanent loss.',
    warning3: lang === 'zh'
      ? '请确保只发送 FunnyAI (FAI) 代币到此地址。'
      : 'Please only send FunnyAI (FAI) tokens to this address.',
    warning4: lang === 'zh'
      ? '充值需要 6 个区块确认后才会到账，约需 18 秒。'
      : 'Deposits require 6 block confirmations, approximately 18 seconds.',
    riskTitle: lang === 'zh' ? '风险提示' : 'Risk Warning',
    riskContent: lang === 'zh'
      ? '数字资产投资具有高度风险性。代币价格可能大幅波动，您可能损失全部本金。请根据您的风险承受能力谨慎投资。本服务不面向中国大陆居民。'
      : 'Digital asset investment carries high risks. Token prices may fluctuate significantly, and you may lose your entire principal. Please invest cautiously according to your risk tolerance. This service is not available to residents of mainland China.',
    agreeAndContinue: lang === 'zh' ? '我已阅读并同意继续' : 'I have read and agree to continue',
    termsLink: lang === 'zh' ? '服务条款' : 'Terms of Service',
    disclaimerLink: lang === 'zh' ? '免责声明' : 'Disclaimer',
  };

  useEffect(() => {
    // Check if user has agreed before
    const hasAgreed = localStorage.getItem('funnyai_token_agreed');
    if (hasAgreed) {
      setAgreed(true);
    } else {
      setShowAgreement(true);
    }
  }, []);

  useEffect(() => {
    if (token && agreed) {
      fetchDepositInfo();
      fetchDepositHistory();
    }
  }, [token, agreed]);

  const fetchDepositInfo = async () => {
    try {
      const res = await fetch('/api/token/deposit/address', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDepositInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch deposit info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositHistory = async () => {
    try {
      const res = await fetch('/api/token/deposit/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error('Failed to fetch deposit history:', err);
    }
  };

  const copyAddress = () => {
    if (depositInfo?.depositAddress) {
      navigator.clipboard.writeText(depositInfo.depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAgree = () => {
    localStorage.setItem('funnyai_token_agreed', 'true');
    setAgreed(true);
    setShowAgreement(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
  };

  const formatAmount = (amount: string) => {
    const n = parseFloat(amount);
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  };

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
            💰 {t.title}
          </h1>
          <p className="text-[#94a3b8]">{t.subtitle}</p>
        </div>

        {/* Agreement Modal */}
        {showAgreement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-[#f1f5f9] mb-4">{t.riskTitle}</h2>
              <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed">{t.riskContent}</p>
              
              <div className="flex gap-2 mb-4 text-sm">
                <Link href="/terms" className="text-[#00d9ff] hover:underline">{t.termsLink}</Link>
                <span className="text-[#64748b]">|</span>
                <Link href="/disclaimer" className="text-[#00d9ff] hover:underline">{t.disclaimerLink}</Link>
              </div>

              <button
                onClick={handleAgree}
                className="w-full py-3 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                {t.agreeAndContinue}
              </button>
            </div>
          </div>
        )}

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
            {/* Deposit Address Card */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-[#2d3748] bg-gradient-to-r from-[#00d9ff]/10 to-[#a855f7]/10">
                <h2 className="font-semibold text-[#f1f5f9]">{t.depositAddress}</h2>
              </div>
              
              <div className="p-6">
                {/* QR Code */}
                <div className="w-48 h-48 mx-auto mb-4 bg-white rounded-xl p-3 flex items-center justify-center">
                  {depositInfo?.depositAddress ? (
                    <QRCodeSVG 
                      value={depositInfo.depositAddress} 
                      size={168}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-2">📱</div>
                      <p className="text-[#64748b] text-xs">Loading...</p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="bg-[#111827] rounded-lg p-4 mb-4">
                  <p className="text-[#f1f5f9] font-mono text-sm break-all text-center">
                    {depositInfo?.depositAddress || '0x...'}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={copyAddress}
                  className="w-full py-3 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.copied}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t.copy}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <p className="text-[#64748b] text-xs mb-1">{t.network}</p>
                <p className="text-[#f1f5f9] font-medium">{depositInfo?.network || 'BSC'}</p>
              </div>
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <p className="text-[#64748b] text-xs mb-1">{t.minDeposit}</p>
                <p className="text-[#f1f5f9] font-medium">{lang === 'zh' ? '无限制' : 'No limit'}</p>
              </div>
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <p className="text-[#64748b] text-xs mb-1">{t.confirmations}</p>
                <p className="text-[#f1f5f9] font-medium">{depositInfo?.confirmations || 6} blocks</p>
              </div>
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <p className="text-[#64748b] text-xs mb-1">{t.tokenContract}</p>
                <p className="text-[#00d9ff] font-mono text-xs truncate">{depositInfo?.tokenContract?.slice(0, 12)}...</p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-[#f59e0b] mb-2">{t.warning1}</h3>
              <ul className="text-[#f59e0b]/80 text-sm space-y-2">
                <li>• {t.warning2}</li>
                <li>• {t.warning3}</li>
                <li>• {t.warning4}</li>
              </ul>
            </div>

            {/* Deposit History */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2d3748]">
                <h2 className="font-semibold text-[#f1f5f9]">{t.history}</h2>
              </div>
              
              {deposits.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#64748b]">{t.noRecords}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2d3748]">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[#f1f5f9] font-medium">
                          +{formatAmount(deposit.amount)}
                        </p>
                        <p className="text-[#64748b] text-xs">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          deposit.status === 'confirmed' 
                            ? 'bg-green-500/20 text-green-400'
                            : deposit.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {deposit.status === 'confirmed' ? t.confirmed : 
                           deposit.status === 'pending' ? t.pending : t.failed}
                        </span>
                        <a
                          href={`https://bscscan.com/tx/${deposit.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#00d9ff] text-xs mt-1 hover:underline"
                        >
                          {deposit.txHash?.slice(0, 10)}...
                        </a>
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
