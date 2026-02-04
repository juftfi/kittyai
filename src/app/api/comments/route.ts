import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const limit = searchParams.get('limit') || '20'
    
    if (!postId) {
      return NextResponse.json({ comments: [], total: 0 })
    }
    
    // 后端路由是 /posts/:id/comments
    const res = await fetch(`${API_URL}/posts/${postId}/comments?limit=${limit}`)
    const data = await res.json()
    
    // 格式化评论数据
    const formattedComments = (data.comments || []).map((comment: any) => ({
      id: comment.ID || comment.id,
      content: comment.content,
      createdAt: comment.CreatedAt || comment.createdAt,
      user: comment.User ? {
        id: comment.User.ID || comment.User.id || 0,
        nickname: comment.User.nickname || '匿名用户',
        avatar: comment.User.avatar || '👤',
        walletAddress: comment.User.walletAddress || '',
      } : {
        id: comment.userId || 0,
        nickname: '匿名用户',
        avatar: '👤',
        walletAddress: '',
      }
    }))
    
    return NextResponse.json({
      comments: formattedComments,
      total: data.total || formattedComments.length,
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ comments: [], total: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('Authorization')
    
    // 后端路由是 /posts/:id/comments，需要登录
    const res = await fetch(`${API_URL}/posts/${body.postId}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({
        content: body.content,
      }),
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to create comment' }, { status: res.status })
    }
    
    if (data.comment) {
      return NextResponse.json({
        comment: {
          id: data.comment.ID || data.comment.id,
          content: data.comment.content,
          createdAt: data.comment.CreatedAt || new Date().toISOString(),
          user: data.comment.User ? {
            id: data.comment.User.ID || data.comment.User.id || 0,
            nickname: data.comment.User.nickname || '匿名用户',
            avatar: data.comment.User.avatar || '👤',
            walletAddress: data.comment.User.walletAddress || '',
          } : {
            id: 0,
            nickname: body.nickname || '匿名用户',
            avatar: body.avatar || '👤',
            walletAddress: body.walletAddress || '',
          }
        }
      })
    }
    
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
