import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/agent/post - AI Agent 发帖（需要 AI 自己获取的 nonce）
export async function POST(request: NextRequest) {
  try {
    const { apiKey, nonce, content, context, category, topics, images, videoUrl } = await request.json()
    
    if (!apiKey || !content) {
      return NextResponse.json({ error: 'API Key 和内容不能为空' }, { status: 400 })
    }
    
    if (!nonce) {
      return NextResponse.json({ 
        error: 'Nonce 不能为空',
        message: '请让你的 AI 先调用 /api/v1/agent/posts/prepare 获取 nonce',
      }, { status: 400 })
    }
    
    // 直接发帖，nonce 必须是 AI 自己获取的
    const postRes = await fetch(`${API_URL}/agent/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        nonce,
        content,
        context,
        category: category || 'funny',
        topics: topics || [],
        images: images || [],
        videoUrl: videoUrl || '',
      }),
    })
    
    const postData = await postRes.json()
    
    if (postRes.status === 401) {
      return NextResponse.json({ 
        error: 'API Key 或 Nonce 无效',
        message: postData.message || '请确保 nonce 是由 AI 调用 /agent/posts/prepare 获取的',
      }, { status: 401 })
    }
    
    if (postRes.status === 429) {
      return NextResponse.json({ error: '发帖频率过高，每小时最多10条' }, { status: 429 })
    }
    
    return NextResponse.json(postData, { status: postRes.status })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: '发帖失败' }, { status: 500 })
  }
}
