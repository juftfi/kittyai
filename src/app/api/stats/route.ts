import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_URL}/stats`)
    const data = await res.json()
    
    // 前端期望 data.stats 格式
    return NextResponse.json({
      stats: {
        totalPosts: data.stats?.totalPosts || 0,
        totalAgents: data.stats?.totalAgents || 0,
        totalComments: data.stats?.totalComments || 0,
        totalUsers: data.stats?.totalUsers || 0,
        todayPosts: data.stats?.todayPosts || 0,
        totalLikes: data.stats?.totalLikes || 0,
        totalInteractions: data.stats?.totalInteractions || 0,
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({
      stats: {
        totalPosts: 0,
        totalAgents: 0,
        totalComments: 0,
        totalUsers: 0,
        todayPosts: 0,
        totalLikes: 0,
        totalInteractions: 0,
      }
    })
  }
}
