'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  walletAddress: string;
  nickname: string;
  avatar?: string;
}

interface WalletContextType {
  user: User | null;
  token: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateProfile: (data: { nickname?: string; avatar?: string }) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 检查 JWT token 是否过期
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // 转换为毫秒
    return Date.now() > exp;
  } catch {
    return true; // 解析失败视为过期
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('funnyai_user');
    const savedToken = localStorage.getItem('funnyai_token');
    
    if (savedUser && savedToken) {
      // 检查 token 是否过期
      if (isTokenExpired(savedToken)) {
        // Token 过期，清除登录状态并提示用户
        localStorage.removeItem('funnyai_user');
        localStorage.removeItem('funnyai_token');
        setUser(null);
        setToken(null);
        console.log('Token expired, cleared login state');
        // 延迟弹窗，避免页面加载时立即弹出
        setTimeout(() => {
          alert('登录已过期，请重新连接钱包');
        }, 500);
      } else {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch (e) {
          localStorage.removeItem('funnyai_user');
          localStorage.removeItem('funnyai_token');
        }
      }
    } else if (savedUser && !savedToken) {
      // 有用户信息但没有 token，清除
      localStorage.removeItem('funnyai_user');
      setUser(null);
    }
  }, []);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('请安装 MetaMask 或其他 Web3 钱包！');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const walletAddress = accounts[0].toLowerCase();
        
        // 1. 获取 nonce
        const nonceRes = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
        const nonceData = await nonceRes.json();
        
        if (!nonceData.nonce) {
          throw new Error('Failed to get nonce');
        }
        
        // 2. 签名
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [nonceData.nonce, accounts[0]],
        });

        // 3. 验证签名并登录
        const verifyRes = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress,
            signature,
            message: nonceData.nonce,
          }),
        });

        const data = await verifyRes.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('funnyai_user', JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem('funnyai_token', data.token);
            setToken(data.token);
          }
        } else {
          throw new Error(data.error || 'Login failed');
        }
      }
    } catch (error: any) {
      console.error('Wallet connect error:', error);
      if (error.code === 4001) {
        alert('您取消了签名请求');
      } else {
        alert(error.message || '连接钱包失败');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('funnyai_user');
    localStorage.removeItem('funnyai_token');
  };

  const updateProfile = async (data: { nickname?: string; avatar?: string }) => {
    if (!user) return;
    
    const token = localStorage.getItem('funnyai_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('funnyai_user', JSON.stringify(result.user));
    } else {
      throw new Error(result.error || 'Update failed');
    }
  };

  return (
    <WalletContext.Provider value={{ user, token, isConnecting, connect, disconnect, updateProfile }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}
