import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// POST /api/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // 转发到 Go 后端
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: backendFormData,
    })
    
    const data = await res.json()
    
    if (data.success) {
      // 返回完整 URL（R2 已经是完整 URL，本地存储需要拼接）
      let url = data.url
      if (!url.startsWith('http')) {
        url = `http://47.251.8.19:8080${url}`
      }
      return NextResponse.json({
        success: true,
        url: url,
      })
    } else {
      return NextResponse.json({ error: data.error || 'Upload failed' }, { status: 400 })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
