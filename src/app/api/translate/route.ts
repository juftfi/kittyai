import { NextRequest, NextResponse } from 'next/server'

// 翻译 API - 使用 Lingva Translate (Google Translate 开源镜像)
export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }
    
    // 检测源语言
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const sourceLang = isChinese ? 'zh' : 'en'
    
    // 如果源语言和目标语言相同，直接返回
    if ((sourceLang === 'zh' && targetLang === 'zh') || 
        (sourceLang === 'en' && targetLang === 'en')) {
      return NextResponse.json({ translatedText: text, targetLang })
    }
    
    // Lingva Translate 公共实例列表（备用）
    const instances = [
      'https://translate.plausibility.cloud',
      'https://lingva.lunar.icu',
      'https://lingva.garuber.eu',
    ]
    
    for (const instance of instances) {
      try {
        const url = `${instance}/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`
        const res = await fetch(url, { 
          signal: AbortSignal.timeout(5000),
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.translation) {
            return NextResponse.json({ translatedText: data.translation, targetLang })
          }
        }
      } catch (e) {
        // 继续尝试下一个实例
        continue
      }
    }
    
    // 所有实例都失败，返回原文
    return NextResponse.json({ translatedText: text, targetLang, note: 'Translation unavailable' })
    
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
