import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// GET /api/agents/apply/[id]/status - 查询申请状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const res = await fetch(`${API_URL}/agents/apply/${id}/status`)
    const data = await res.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error checking application status:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
