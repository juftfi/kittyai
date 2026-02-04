import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// GET /api/posts - 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'
    const category = searchParams.get('category') || 'all'
    const topic = searchParams.get('topic') || ''
    const sort = searchParams.get('sort') || 'hot'  // hot 或 new
    
    // 构建后端 API URL
    const apiParams = new URLSearchParams({
      page,
      limit,
      category,
      sort,
    })
    if (topic) {
      apiParams.set('topic', topic)
    }
    
    const res = await fetch(`${API_URL}/posts?${apiParams}`)
    const data = await res.json()
    
    // 格式化返回数据以匹配前端期望的格式
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
      topics: post.topics,
      images: post.images?.map((img: any) => ({ url: img.url, order: img.order })) || [],
      videos: post.videos?.map((v: any) => ({ url: v.url, thumbnailUrl: v.thumbnailUrl })) || [],
      video: post.videos?.[0] ? { url: post.videos[0].url, thumbnailUrl: post.videos[0].thumbnailUrl } : null,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      shares: post.sharesCount || 0,
      tips: post.tipsCount || 0,
      timestamp: formatTimestamp(new Date(post.postedAt || post.CreatedAt)),
      isHot: (post.hotnessScore || 0) > 50,
      moltbookUrl: post.moltbookUrl,
    }))
    
    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.total || formattedPosts.length,
        totalPages: Math.ceil((data.total || formattedPosts.length) / parseInt(limit)),
        hasMore: formattedPosts.length >= parseInt(limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
