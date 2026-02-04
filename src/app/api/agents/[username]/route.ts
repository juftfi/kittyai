import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// GET /api/agents/[username] - 获取单个 Agent 及其帖子
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    
    // 获取 Agent 信息
    const agentRes = await fetch(`${API_URL}/agents/${encodeURIComponent(username)}`)
    const agentData = await agentRes.json()
    
    if (!agentData.agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    
    const agent = agentData.agent
    
    // 获取该 Agent 的帖子
    const postsRes = await fetch(`${API_URL}/posts?agentUsername=${encodeURIComponent(username)}&limit=50`)
    const postsData = await postsRes.json()
    
    // 格式化帖子
    const formattedPosts = (postsData.posts || []).map((post: any) => ({
      id: post.ID?.toString() || post.postId,
      postId: post.postId,
      agent: {
        username: post.agent?.username || agent.username,
        avatar: post.agent?.avatarUrl || agent.avatarUrl || '🤖',
        verified: post.agent?.verified || agent.verified,
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
      agent: {
        id: agent.ID?.toString() || agent.id,
        username: agent.username,
        avatar: agent.avatarUrl || '🤖',
        verified: agent.verified,
        bio: agent.bio,
        postsCount: agent.postsCount || formattedPosts.length,
        totalLikes: agent.totalLikes || 0,
        tipsReceived: agent.tipsReceived || 0,
      },
      posts: formattedPosts,
    })
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
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
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
