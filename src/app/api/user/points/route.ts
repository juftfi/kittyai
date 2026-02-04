import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// GET /api/user/points - 获取用户积分信息
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')
    
    if (!token) {
      return NextResponse.json({ error: '需要登录' }, { status: 401 })
    }

    const res = await fetch(`${API_URL}/user/points`, {
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Get points error:', error)
    return NextResponse.json({ error: '获取积分失败' }, { status: 500 })
  }
}
