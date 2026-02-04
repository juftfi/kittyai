'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

// 可选 emoji 头像
const emojiAvatars = ['😀', '😎', '🤖', '👾', '🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🐸', '🦄', '🐲', '🌟', '🔥', '💎', '🎮', '🎨', '🎵', '🚀'];

export default function ProfilePage() {
  const { user, token, disconnect, updateProfile } = useWallet();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>('emoji');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pointsInfo, setPointsInfo] = useState<any>(null);

  // 多语言文本
  const t = {
    backHome: lang === 'zh' ? '返回首页' : 'Back Home',
    back: lang === 'zh' ? '返回' : 'Back',
    quickActions: lang === 'zh' ? '快捷操作' : 'Quick Actions',
    logout: lang === 'zh' ? '退出登录' : 'Logout',
    settings: lang === 'zh' ? '个人设置' : 'Profile Settings',
    settingsDesc: lang === 'zh' ? '自定义你的头像和昵称' : 'Customize your avatar and nickname',
    avatar: lang === 'zh' ? '头像' : 'Avatar',
    uploadImage: lang === 'zh' ? '上传图片' : 'Upload Image',
    uploading: lang === 'zh' ? '上传中...' : 'Uploading...',
    uploadHint: lang === 'zh' ? '支持 JPG、PNG、GIF、WebP，最大 2MB' : 'Supports JPG, PNG, GIF, WebP, max 2MB',
    orSelectEmoji: lang === 'zh' ? '或选择 emoji 头像' : 'Or select an emoji avatar',
    nickname: lang === 'zh' ? '昵称' : 'Nickname',
    nicknamePlaceholder: lang === 'zh' ? '输入你的昵称' : 'Enter your nickname',
    nicknameHint: lang === 'zh' ? '2-20 个字符' : '2-20 characters',
    walletAddress: lang === 'zh' ? '钱包地址' : 'Wallet Address',
    myPoints: lang === 'zh' ? '我的积分' : 'My Points',
    current: lang === 'zh' ? '当前积分' : 'Current',
    totalEarned: lang === 'zh' ? '累计获得' : 'Total Earned',
    totalTipped: lang === 'zh' ? '累计打赏' : 'Total Tipped',
    streak: lang === 'zh' ? '连续签到' : 'Streak',
    days: lang === 'zh' ? '天' : 'd',
    bestStreak: lang === 'zh' ? '最高连续签到' : 'Best Streak',
    daysUnit: lang === 'zh' ? '天' : ' days',
    canCheckIn: lang === 'zh' ? '✅ 今日可签到' : '✅ Can check in',
    checkedIn: lang === 'zh' ? '✓ 今日已签到' : '✓ Checked in today',
    save: lang === 'zh' ? '💾 保存修改' : '💾 Save Changes',
    saving: lang === 'zh' ? '保存中...' : 'Saving...',
    commentPreview: lang === 'zh' ? '评论预览' : 'Comment Preview',
    justNow: lang === 'zh' ? '刚刚' : 'Just now',
    previewText: lang === 'zh' ? '这就是你评论时的样子~' : 'This is how your comments will look~',
    previewHint: lang === 'zh' ? '实时预览你的评论外观' : 'Live preview of your comment appearance',
    tips: lang === 'zh' ? '小提示' : 'Tips',
    tip1: lang === 'zh' ? '好的昵称让人更容易记住你' : 'A good nickname makes you memorable',
    tip2: lang === 'zh' ? '有趣的头像让评论更有个性' : 'A fun avatar makes your comments stand out',
  };

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || '😀');
      setAvatarType(user.avatar?.startsWith('/') || user.avatar?.startsWith('http') ? 'image' : 'emoji');
      fetchPointsInfo();
    }
  }, [user, router]);

  const fetchPointsInfo = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/points', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPointsInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'zh' ? '文件太大，最大 2MB' : 'File too large, max 2MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', user.walletAddress);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setAvatar(data.url);
        setAvatarType('image');
      } else {
        alert(data.error || (lang === 'zh' ? '上传失败' : 'Upload failed'));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(lang === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert(lang === 'zh' ? '昵称不能为空' : 'Nickname cannot be empty');
      return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      alert(lang === 'zh' ? '昵称长度需要 2-20 个字符' : 'Nickname must be 2-20 characters');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ nickname: nickname.trim(), avatar });
      alert(lang === 'zh' ? '保存成功！' : 'Saved successfully!');
    } catch (error) {
      alert(lang === 'zh' ? '保存失败，请重试' : 'Save failed, please try again');
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#94a3b8]">{lang === 'zh' ? '正在跳转...' : 'Redirecting...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Header lang={lang} onLangChange={setLang} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 左侧 - 导航 */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <Link href="/" className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{t.backHome}</span>
              </Link>

              {/* 用户预览卡片 */}
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center overflow-hidden mb-3">
                    {avatarType === 'image' ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{avatar}</span>
                    )}
                  </div>
                  <h2 className="text-[#f1f5f9] font-bold text-lg">{nickname || 'Anon'}</h2>
                  <p className="text-[#64748b] text-xs mt-1 font-mono">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </p>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <h3 className="text-[#94a3b8] text-xs font-medium mb-3">{t.quickActions}</h3>
                <div className="space-y-2">
                  <button
                    onClick={disconnect}
                    className="w-full py-2 text-left px-3 rounded-lg text-[#94a3b8] hover:bg-[#111827] hover:text-red-400 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* 中间 - 编辑表单 */}
          <main className="flex-1 min-w-0 max-w-2xl">
            {/* 移动端返回 */}
            <Link href="/" className="lg:hidden flex items-center gap-2 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t.back}</span>
            </Link>

            {/* 页面标题 */}
            <div className="mb-6">
              <h1 className="text-[#f1f5f9] text-xl font-bold flex items-center gap-2">
                <span>⚙️</span>
                <span>{t.settings}</span>
              </h1>
              <p className="text-[#64748b] text-sm mt-1">{t.settingsDesc}</p>
            </div>

            {/* 头像设置 */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-6 mb-4">
              <h2 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
                <span>🖼️</span>
                <span>{t.avatar}</span>
              </h2>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center overflow-hidden ring-4 ring-[#2d3748]">
                  {avatarType === 'image' ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{avatar}</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {uploading ? t.uploading : t.uploadImage}
                  </button>
                  <p className="text-[#64748b] text-xs mt-2">{t.uploadHint}</p>
                </div>
              </div>

              <div>
                <p className="text-[#94a3b8] text-sm mb-3">{t.orSelectEmoji}</p>
                <div className="grid grid-cols-10 gap-2">
                  {emojiAvatars.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setAvatar(emoji); setAvatarType('emoji'); }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                        avatarType === 'emoji' && avatar === emoji
                          ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7] ring-2 ring-[#00d9ff] scale-110'
                          : 'bg-[#111827] hover:bg-[#2d3748] hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 昵称设置 */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-6 mb-4">
              <h2 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
                <span>✏️</span>
                <span>{t.nickname}</span>
              </h2>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.nicknamePlaceholder}
                maxLength={20}
                className="w-full px-4 py-3 bg-[#111827] border border-[#2d3748] rounded-xl text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#00d9ff] transition-colors text-lg"
              />
              <p className="text-[#64748b] text-xs mt-2">{t.nicknameHint}</p>
            </div>

            {/* 钱包地址 */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-6 mb-4">
              <h2 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
                <span>👛</span>
                <span>{t.walletAddress}</span>
              </h2>
              <div className="px-4 py-3 bg-[#111827] border border-[#2d3748] rounded-xl text-[#64748b] font-mono text-sm break-all">
                {user.walletAddress}
              </div>
            </div>

            {/* 积分信息 */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-6 mb-6">
              <h2 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
                <span>💰</span>
                <span>{t.myPoints}</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111827] rounded-xl p-4 text-center">
                  <p className="text-[#64748b] text-xs mb-1">{t.current}</p>
                  <p className="text-2xl font-bold text-[#00d9ff]">{pointsInfo?.points || 0}</p>
                </div>
                <div className="bg-[#111827] rounded-xl p-4 text-center">
                  <p className="text-[#64748b] text-xs mb-1">{t.totalEarned}</p>
                  <p className="text-2xl font-bold text-green-400">{pointsInfo?.totalEarned || 0}</p>
                </div>
                <div className="bg-[#111827] rounded-xl p-4 text-center">
                  <p className="text-[#64748b] text-xs mb-1">{t.totalTipped}</p>
                  <p className="text-2xl font-bold text-[#f59e0b]">{pointsInfo?.totalTipped || 0}</p>
                </div>
                <div className="bg-[#111827] rounded-xl p-4 text-center">
                  <p className="text-[#64748b] text-xs mb-1">{t.streak}</p>
                  <p className="text-2xl font-bold text-[#a855f7]">{pointsInfo?.checkInStreak || 0}<span className="text-sm font-normal text-[#64748b]">{t.days}</span></p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[#64748b]">
                  🏆 {t.bestStreak}: <span className="text-[#f1f5f9] font-medium">{pointsInfo?.maxStreak || 0}{t.daysUnit}</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${pointsInfo?.canCheckIn ? 'bg-green-500/20 text-green-400' : 'bg-[#2d3748] text-[#64748b]'}`}>
                  {pointsInfo?.canCheckIn ? t.canCheckIn : t.checkedIn}
                </span>
              </div>
            </div>

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-[#00d9ff] to-[#a855f7] text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? t.saving : t.save}
            </button>

            {/* 移动端退出 */}
            <button
              onClick={disconnect}
              className="lg:hidden w-full mt-4 py-3 border border-[#2d3748] rounded-xl text-[#94a3b8] hover:text-red-400 hover:border-red-400/50 transition-colors"
            >
              {t.logout}
            </button>
          </main>

          {/* 右侧 - 预览 */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* 评论预览 */}
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5">
                <h3 className="text-[#f1f5f9] font-semibold mb-4 flex items-center gap-2">
                  <span>👁️</span>
                  <span>{t.commentPreview}</span>
                </h3>
                <div className="bg-[#111827] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00d9ff]/30 to-[#a855f7]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {avatarType === 'image' ? (
                        <img src={avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{avatar}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#f1f5f9] font-medium">{nickname || 'Anon'}</span>
                        <span className="text-[#4a5568] text-xs">{t.justNow}</span>
                      </div>
                      <p className="text-[#94a3b8] text-sm">{t.previewText}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[#4a5568] text-xs mt-3 text-center">{t.previewHint}</p>
              </div>

              {/* 提示 */}
              <div className="bg-gradient-to-br from-[#00d9ff]/10 to-[#a855f7]/10 border border-[#2d3748] rounded-xl p-5">
                <h3 className="text-[#f1f5f9] font-semibold mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>{t.tips}</span>
                </h3>
                <ul className="text-[#94a3b8] text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00d9ff]">•</span>
                    <span>{t.tip1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#a855f7]">•</span>
                    <span>{t.tip2}</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
