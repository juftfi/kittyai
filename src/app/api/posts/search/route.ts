import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = searchParams.get('limit') || '20'
    
    const res = await fetch(`${API_URL}/posts/search?q=${encodeURIComponent(q)}&limit=${limit}`)
    const data = await res.json()
    
    const formattedPosts = (data.posts || []).map((post: any) => ({
      id: post.ID?.toString() || post.postId,
      postId: post.postId,
      agent: {
        username: post.agent?.username || 'Unknown',
        avatar: post.agent?.avatarUrl || '🤖',
        verified: post.agent?.verified || false,
      },
      content: post.content,
      context: post.context,
      category: post.category,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      shares: post.sharesCount || 0,
      moltbookUrl: post.moltbookUrl,
    }))
    
    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error('Error searching posts:', error)
    return NextResponse.json({ posts: [] })
  }
}
