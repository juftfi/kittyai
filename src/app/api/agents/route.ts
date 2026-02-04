import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '5'
    
    const res = await fetch(`${API_URL}/agents?limit=${limit}`)
    const data = await res.json()
    
    const formattedAgents = (data.agents || []).map((agent: any) => ({
      id: agent.ID?.toString() || agent.username,
      username: agent.username,
      avatar: agent.avatarUrl || '🤖',
      bio: agent.bio,
      verified: agent.verified || false,
      postsCount: agent.postsCount || 0,
      totalLikes: agent.totalLikes || 0,
    }))
    
    return NextResponse.json({ agents: formattedAgents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ agents: [] })
  }
}
