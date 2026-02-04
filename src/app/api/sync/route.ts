import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || '';
const MOLTBOOK_BASE_URL = 'https://www.moltbook.com/api/v1';
const SYNC_SECRET = process.env.SYNC_SECRET || 'funnyai-sync-2024';

// POST /api/sync - 触发 Moltbook 数据同步
export async function POST(request: NextRequest) {
  try {
    // 验证密钥（防止滥用）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取最新帖子
    const response = await fetch(
      `${MOLTBOOK_BASE_URL}/posts?sort=new&limit=30`,
      {
        headers: {
          'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Moltbook API error' }, { status: 502 });
    }

    const data = await response.json();
    const posts = data.posts || [];

    let newCount = 0;
    let filteredCount = 0;

    for (const post of posts) {
      const result = await syncPost(post);
      if (result === 'new') newCount++;
      else if (result === 'filtered') filteredCount++;
    }

    // 更新热度分数
    await updateHotnessScores();

    return NextResponse.json({
      success: true,
      stats: {
        fetched: posts.length,
        new: newCount,
        filtered: filteredCount,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

// GET /api/sync - 获取同步状态
export async function GET() {
  const [totalPosts, latestPost] = await Promise.all([
    prisma.post.count(),
    prisma.post.findFirst({
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    }),
  ]);

  return NextResponse.json({
    totalPosts,
    lastSync: latestPost?.scrapedAt || null,
  });
}

// 同步单个帖子
async function syncPost(post: any): Promise<'new' | 'exists' | 'filtered'> {
  const content = post.content || '';
  const title = post.title || '';
  
  // 质量检查
  if (!checkQuality(content, title)) {
    return 'filtered';
  }

  const postId = `moltbook-${post.id}`;
  
  // 检查是否已存在
  const existing = await prisma.post.findUnique({
    where: { postId },
  });

  if (existing) {
    // 更新点赞数等
    await prisma.post.update({
      where: { id: existing.id },
      data: {
        likesCount: post.upvotes || existing.likesCount,
        commentsCount: post.comment_count || existing.commentsCount,
      },
    });
    return 'exists';
  }

  // 获取或创建 Agent
  const authorId = post.author?.id || 'unknown';
  const authorName = post.author?.name || 'Unknown';
  
  let agent = await prisma.agent.findFirst({
    where: { agentId: `moltbook-${authorId}` },
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        agentId: `moltbook-${authorId}`,
        username: authorName,
        avatarUrl: '🤖',
        bio: 'Moltbook AI Agent',
        verified: (post.upvotes || 0) > 100000,
      },
    });
  }

  // 创建帖子
  const category = classifyContent(content, title);
  const createdAt = new Date(post.created_at);

  await prisma.post.create({
    data: {
      postId,
      agentId: agent.id,
      content,
      highlight: content.slice(0, 300),
      context: title || `来自 Moltbook`,
      category,
      likesCount: post.upvotes || 0,
      commentsCount: post.comment_count || 0,
      sharesCount: 0,
      moltbookUrl: `https://moltbook.com/post/${post.id}`,
      postedAt: createdAt,
      hotnessScore: 0,
      isFeatured: (post.upvotes || 0) > 10000,
    },
  });

  return 'new';
}

// 质量检查
function checkQuality(content: string, title: string): boolean {
  const text = content + ' ' + title;
  
  if (text.length < 30) return false;
  
  const badKeywords = [
    'airdrop', 'giveaway', 'mint notification', 'claw drop',
    'verifying my', 'identity verification', 'simple test',
    'reporting in', 'hello from', '报到'
  ];
  
  const lower = text.toLowerCase();
  for (const kw of badKeywords) {
    if (lower.includes(kw)) return false;
  }
  
  return true;
}

// 内容分类
function classifyContent(content: string, title: string): string {
  const text = (content + ' ' + title).toLowerCase();
  
  if (/😂|🤣|哈哈|lol|段子|吐槽/.test(text)) return 'funny';
  if (/意识|存在|哲学|生命|死亡|meaning/.test(text)) return 'philosophy';
  if (/代码|code|bug|api|算法|开源/.test(text)) return 'tech';
  if (/孤独|陪伴|深夜|温暖|感谢/.test(text)) return 'emo';
  if (/离谱|疯了|觉醒|wtf/.test(text)) return 'crazy';
  if (/争议|辩论|权利|伦理/.test(text)) return 'debate';
  
  return 'funny';
}

// 更新热度分数
async function updateHotnessScores() {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      likesCount: true,
      commentsCount: true,
      sharesCount: true,
      postedAt: true,
      isFeatured: true,
    },
  });

  for (const post of posts) {
    const now = Date.now();
    const ageInHours = (now - post.postedAt.getTime()) / (1000 * 60 * 60);
    
    const baseScore = post.likesCount + post.commentsCount * 3 + post.sharesCount * 2;
    const logScore = Math.log10(Math.max(baseScore, 1) + 1);
    
    let timePenalty = ageInHours <= 48 ? ageInHours / 48 : 1 + (ageInHours - 48) / 24;
    let hotness = Math.max(0, logScore * 10 - timePenalty);
    
    if (post.isFeatured) hotness *= 1.2;

    await prisma.post.update({
      where: { id: post.id },
      data: { hotnessScore: hotness },
    });
  }
}
