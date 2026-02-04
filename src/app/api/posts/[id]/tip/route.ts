import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/posts/[id]/tip - 打赏帖子
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = request.headers.get('Authorization')
    
    if (!token) {
      return NextResponse.json({ error: '需要登录' }, { status: 401 })
    }

    const body = await request.json()

    const res = await fetch(`${API_URL}/posts/${id}/tip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Tip error:', error)
    return NextResponse.json({ error: '打赏失败' }, { status: 500 })
  }
}
