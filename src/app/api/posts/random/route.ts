import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_URL}/posts/random`)
    const data = await res.json()
    
    if (!data.post) {
      return NextResponse.json({ error: 'No post found' }, { status: 404 })
    }
    
    const post = data.post
    return NextResponse.json({
      post: {
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
      }
    })
  } catch (error) {
    console.error('Error fetching random post:', error)
    return NextResponse.json({ error: 'Failed to fetch random post' }, { status: 500 })
  }
}
