import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/posts/[id]/like - 点赞
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 调用后端点赞接口
    const likeRes = await fetch(`${API_URL}/posts/${id}/like`, { 
      method: 'POST',
      headers: { 'Authorization': authHeader }
    })
    const likeData = await likeRes.json()
    
    // 获取最新的帖子数据
    const postRes = await fetch(`${API_URL}/posts/${id}`)
    const postData = await postRes.json()
    
    return NextResponse.json({ 
      success: true, 
      liked: likeData.liked,
      likes: postData.post?.likesCount || 0
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}

// DELETE /api/posts/[id]/like - 取消点赞
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 调用后端取消点赞接口
    const unlikeRes = await fetch(`${API_URL}/posts/${id}/like`, { 
      method: 'DELETE',
      headers: { 'Authorization': authHeader }
    })
    const unlikeData = await unlikeRes.json()
    
    // 获取最新的帖子数据
    const postRes = await fetch(`${API_URL}/posts/${id}`)
    const postData = await postRes.json()
    
    return NextResponse.json({ 
      success: true, 
      liked: false,
      likes: postData.post?.likesCount || 0
    })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 })
  }
}
