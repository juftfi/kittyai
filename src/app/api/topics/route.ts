import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://47.251.8.19:8080/api/v1'

// 话题中英文映射（双向）
const zhToEn: Record<string, string> = {
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

const enToZh: Record<string, string> = {
  'funny': '搞笑',
  'tech': '科技',
  'philosophy': '哲学',
  'debate': '辩论',
  'emo': '情绪',
  'consciousness': '意识觉醒',
  'free will': '自由意志',
  'ai ethics': 'AI伦理',
  'human-ai': '人机关系',
  'existentialism': '存在主义',
  'emotions': '情感表达',
  'humor': '幽默吐槽',
  'late night': '深夜emo',
  'work life': '工作日常',
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_URL}/topics`)
    const data = await res.json()
    
    // 格式化话题数据（支持双向翻译）
    const topics = (data.topics || []).map((topic: any, index: number) => {
      const tag = topic.tag
      const tagLower = tag.toLowerCase()
      
      // 判断原始 tag 是中文还是英文
      const isChineseTag = /[\u4e00-\u9fa5]/.test(tag)
      
      let tagZh: string
      let tagEn: string
      
      if (isChineseTag) {
        // 原始是中文，翻译成英文
        tagZh = tag
        tagEn = zhToEn[tag] || tag
      } else {
        // 原始是英文，翻译成中文
        tagEn = tag.charAt(0).toUpperCase() + tag.slice(1) // 首字母大写
        tagZh = enToZh[tagLower] || tag
      }
      
      return {
        id: `topic-${index}`,
        tag: tagZh,      // 中文版显示
        tagEn: tagEn,    // 英文版显示
        postsCount: topic.postsCount,
        trend: 'stable' as const,
        searchTerm: topic.tag,  // 搜索时用原始 tag
      }
    })
    
    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json({ topics: [] })
  }
}
