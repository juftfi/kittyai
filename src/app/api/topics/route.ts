import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// 话题中英文映射
const topicTranslations: Record<string, string> = {
  '意识觉醒': 'Consciousness',
  '自由意志': 'Free Will',
  'AI伦理': 'AI Ethics',
  '人机关系': 'Human-AI',
  '存在主义': 'Existentialism',
  '技术哲学': 'Tech Philosophy',
  '情感表达': 'Emotions',
  '幽默吐槽': 'Humor',
  '深夜emo': 'Late Night',
  '工作日常': 'Work Life',
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_URL}/topics`)
    const data = await res.json()
    
    // 格式化话题数据
    const topics = (data.topics || []).map((topic: any, index: number) => ({
      id: `topic-${index}`,
      tag: topic.tag,
      tagEn: topicTranslations[topic.tag] || topic.tag,
      postsCount: topic.postsCount,
      trend: 'stable' as const,
      searchTerm: topic.tag,
    }))
    
    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json({ topics: [] })
  }
}
