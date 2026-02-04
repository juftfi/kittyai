import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/user/check-in - 每日签到
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')
    
    if (!token) {
      return NextResponse.json({ error: '需要登录' }, { status: 401 })
    }

    const res = await fetch(`${API_URL}/user/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: '签到失败' }, { status: 500 })
  }
}
