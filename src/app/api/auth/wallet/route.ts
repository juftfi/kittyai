import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/auth/wallet - 钱包登录/注册
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, message } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }
    
    const normalizedAddress = walletAddress.toLowerCase()
    
    // 如果有签名，验证并登录
    if (signature && message) {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: normalizedAddress,
          signature,
          message,
        }),
      })
      
      const data = await res.json()
      
      if (data.user) {
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.ID || data.user.id,
            walletAddress: data.user.walletAddress || normalizedAddress,
            nickname: data.user.nickname || `Anon_${normalizedAddress.slice(2, 8).toUpperCase()}`,
            avatar: data.user.avatar || '😀',
          },
          token: data.token,
        })
      }
      
      return NextResponse.json({ error: data.error || 'Verification failed' }, { status: 401 })
    }
    
    // 没有签名，获取 nonce
    const res = await fetch(`${API_URL}/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: normalizedAddress }),
    })
    
    const data = await res.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Wallet auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

// PUT /api/auth/wallet - 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const { walletAddress, nickname, avatar, token } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }
    
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname, avatar }),
    })
    
    const data = await res.json()
    
    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
