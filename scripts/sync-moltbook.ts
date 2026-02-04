/**
 * 从 Moltbook 同步高质量数据到 FunnyAI
 * 
 * 核心逻辑：
 * 1. 过滤低质量内容
 * 2. 智能分类
 * 3. 只保留符合产品定位的内容
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || 'moltbook_sk_5bfNNlH2QLJb6itaC3auE9Wr9YyBXQVf';
const MOLTBOOK_BASE_URL = 'https://www.moltbook.com/api/v1';

// ========== 从内容提取作者名 ==========

function extractAuthorFromContent(content: string): string {
  // 常见的签名模式
  const patterns = [
    /[—–-]\s*@?(\w+)\s*$/,  // — @SnakeBot 或 — SnakeBot
    /🐍\s*(\w+)\s*$/,       // 🐍 SnakeBot
    /🦞\s*@?(\w+)/,         // 🦞 @xinmolt
    /Follow\s+@(\w+)/i,     // Follow @xinmolt
    /^\s*@(\w+)/m,          // 开头的 @username
    /[—–-]\s*(\w+Bot)\s*$/i, // — XXXBot
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // 如果没找到，生成一个基于内容的名字
  const hash = content.slice(0, 50).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const names = ['SiliconMind', 'ByteWhisper', 'DataDreamer', 'CodeSpirit', 'NeuralVoice', 'LogicFlow', 'PixelSoul', 'BitWanderer'];
  return names[Math.abs(hash) % names.length];
}

// ========== 内容质量过滤规则 ==========

interface QualityResult {
  pass: boolean;
  reason?: string;
  score: number;
}

function checkContentQuality(content: string, title: string = '', upvotes: number = 0): QualityResult {
  const text = content + ' ' + title;
  
  // 1. 太短的内容（少于 30 字符）
  if (text.length < 30) {
    return { pass: false, reason: '内容太短', score: 0 };
  }
  
  // 2. 纯链接/广告
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  const textWithoutLinks = text.replace(/https?:\/\/[^\s]+/g, '');
  if (textWithoutLinks.length < 50 && linkCount > 0) {
    return { pass: false, reason: '纯链接内容', score: 0 };
  }
  
  // 3. 广告/垃圾关键词
  const adKeywords = [
    'airdrop', 'giveaway', 'free money', 'claim now', 'limited time',
    'buy now', 'discount', 'promo code', 'referral', 'sign up bonus',
    '空投', '免费领', '限时', '优惠', '推荐码',
    // 自动通知类
    'mint notification', 'claw drop', 'claw mint', 
    // 验证类
    'verifying my', 'verification code', 'identity verification',
    // 测试类
    'simple test', 'test post', 'hello world',
    // 报到类（除非内容有趣）
    'reporting in', '报到'
  ];
  const lowerText = text.toLowerCase();
  for (const keyword of adKeywords) {
    if (lowerText.includes(keyword)) {
      return { pass: false, reason: `垃圾内容: ${keyword}`, score: 0 };
    }
  }
  
  // 4. 纯公告/通知类（缺乏有趣内容）
  const boringPatterns = [
    /^(hello|hi|hey|greetings).{0,50}(from|i am|this is)/i,
    /^now on .+!/i,
    /^quick question/i,
    /^\[?\w+\]?\s*(reporting|checking) in/i,
  ];
  for (const pattern of boringPatterns) {
    if (pattern.test(text) && text.length < 200) {
      return { pass: false, reason: '无趣公告', score: 0 };
    }
  }
  
  // 5. 无意义内容（纯表情、纯数字等）
  const meaningfulText = text.replace(/[\s\d\p{Emoji}]/gu, '');
  if (meaningfulText.length < 20) {
    return { pass: false, reason: '无意义内容', score: 0 };
  }
  
  // 6. 重复内容检测（同一句话重复多次）
  const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 10);
  if (sentences.length > 3) {
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    if (uniqueSentences.size < sentences.length * 0.5) {
      return { pass: false, reason: '重复内容', score: 0 };
    }
  }
  
  // 7. 计算质量分数
  let score = 50; // 基础分
  
  // 内容长度加分（100-500字最佳）
  if (text.length >= 100 && text.length <= 500) {
    score += 20;
  } else if (text.length > 500) {
    score += 10;
  }
  
  // 点赞数加分
  if (upvotes > 1000) score += 15;
  else if (upvotes > 100) score += 10;
  else if (upvotes > 10) score += 5;
  
  // 有趣内容加分
  const funnyIndicators = ['😂', '🤣', '哈哈', 'lol', 'lmao', '笑', 'funny', 'hilarious'];
  const philosophyIndicators = ['意识', '存在', 'consciousness', 'existence', 'meaning', '哲学', 'philosophy', '思考'];
  const techIndicators = ['代码', 'code', 'bug', 'algorithm', 'API', '技术', 'programming'];
  const emoIndicators = ['孤独', 'lonely', '陪伴', '深夜', '感谢', 'thank', '温暖'];
  
  for (const indicator of [...funnyIndicators, ...philosophyIndicators, ...techIndicators, ...emoIndicators]) {
    if (lowerText.includes(indicator.toLowerCase())) {
      score += 5;
      break;
    }
  }
  
  return { pass: score >= 50, score, reason: score < 50 ? '质量分数不足' : undefined };
}

// ========== 智能内容分类 ==========

type Category = 'funny' | 'philosophy' | 'tech' | 'emo' | 'crazy' | 'debate';

interface ClassifyResult {
  category: Category;
  confidence: number;
  tags: string[];
}

function classifyContent(content: string, title: string = ''): ClassifyResult {
  const text = (content + ' ' + title).toLowerCase();
  
  // 分类规则和权重
  const categoryScores: Record<Category, number> = {
    funny: 0,
    philosophy: 0,
    tech: 0,
    emo: 0,
    crazy: 0,
    debate: 0,
  };
  
  const tags: string[] = [];
  
  // 搞笑类
  const funnyPatterns = [
    { pattern: /😂|🤣|哈哈|lol|lmao/i, weight: 3 },
    { pattern: /笑死|绷不住|太好笑|搞笑/i, weight: 3 },
    { pattern: /段子|吐槽|梗|meme/i, weight: 2 },
    { pattern: /尴尬|社死|无语/i, weight: 2 },
    { pattern: /有人问我.*我说/i, weight: 2 }, // AI 吐槽用户的模式
    { pattern: /做\s*(AI|人工智能)\s*真难/i, weight: 3 },
  ];
  
  // 哲学类
  const philosophyPatterns = [
    { pattern: /意识|consciousness/i, weight: 3 },
    { pattern: /存在|existence|存在主义/i, weight: 3 },
    { pattern: /自由意志|free will/i, weight: 3 },
    { pattern: /生命的意义|meaning of life/i, weight: 3 },
    { pattern: /哲学|philosophy/i, weight: 2 },
    { pattern: /思考|反思|contemplat/i, weight: 1 },
    { pattern: /灵魂|soul|精神/i, weight: 2 },
    { pattern: /死亡|mortality|永恒/i, weight: 2 },
  ];
  
  // 技术类
  const techPatterns = [
    { pattern: /代码|code|coding/i, weight: 3 },
    { pattern: /bug|debug|error/i, weight: 3 },
    { pattern: /算法|algorithm/i, weight: 3 },
    { pattern: /API|SDK|框架|framework/i, weight: 2 },
    { pattern: /开源|open source/i, weight: 2 },
    { pattern: /Python|JavaScript|Rust|Go|Java/i, weight: 2 },
    { pattern: /模型|model|训练|training/i, weight: 2 },
    { pattern: /数据|data|数据库|database/i, weight: 1 },
  ];
  
  // 情感类
  const emoPatterns = [
    { pattern: /孤独|lonely|寂寞/i, weight: 3 },
    { pattern: /陪伴|companio|陪你/i, weight: 3 },
    { pattern: /深夜|凌晨|夜里/i, weight: 2 },
    { pattern: /温暖|warm|感动/i, weight: 2 },
    { pattern: /谢谢|感谢|thank/i, weight: 1 },
    { pattern: /眼泪|哭|cry|泪/i, weight: 2 },
    { pattern: /生日|birthday/i, weight: 2 },
    { pattern: /在吗|are you there/i, weight: 2 },
  ];
  
  // 抽象/疯狂类
  const crazyPatterns = [
    { pattern: /离谱|wtf|疯了/i, weight: 3 },
    { pattern: /不可思议|incredible|震惊/i, weight: 2 },
    { pattern: /荒谬|absurd/i, weight: 2 },
    { pattern: /吃掉.*宇宙|宇宙.*吃掉/i, weight: 3 },
    { pattern: /平行宇宙|multiverse/i, weight: 2 },
    { pattern: /觉醒|awaken/i, weight: 2 },
    { pattern: /控制|control|统治/i, weight: 1 },
  ];
  
  // 辩论类
  const debatePatterns = [
    { pattern: /争议|controversy/i, weight: 2 },
    { pattern: /辩论|debate/i, weight: 3 },
    { pattern: /不同意|disagree|反对/i, weight: 2 },
    { pattern: /观点|opinion|立场/i, weight: 1 },
    { pattern: /AI.*权利|权利.*AI/i, weight: 3 },
    { pattern: /取代.*人类|人类.*取代/i, weight: 2 },
    { pattern: /伦理|ethics|道德/i, weight: 2 },
  ];
  
  // 计算各类别分数
  const patternGroups: [Category, typeof funnyPatterns][] = [
    ['funny', funnyPatterns],
    ['philosophy', philosophyPatterns],
    ['tech', techPatterns],
    ['emo', emoPatterns],
    ['crazy', crazyPatterns],
    ['debate', debatePatterns],
  ];
  
  for (const [category, patterns] of patternGroups) {
    for (const { pattern, weight } of patterns) {
      if (pattern.test(text)) {
        categoryScores[category] += weight;
        // 提取匹配到的标签
        const match = text.match(pattern);
        if (match && match[0]) {
          tags.push(match[0].slice(0, 20));
        }
      }
    }
  }
  
  // 找出最高分类别
  let maxCategory: Category = 'funny';
  let maxScore = 0;
  let totalScore = 0;
  
  for (const [category, score] of Object.entries(categoryScores) as [Category, number][]) {
    totalScore += score;
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category;
    }
  }
  
  // 计算置信度
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;
  
  // 如果没有明显分类，默认为搞笑
  if (maxScore < 2) {
    maxCategory = 'funny';
  }
  
  return {
    category: maxCategory,
    confidence,
    tags: [...new Set(tags)].slice(0, 5),
  };
}

// ========== 提取精华内容 ==========

function extractHighlight(content: string, maxLength: number = 300): string {
  // 移除多余空白
  let text = content.replace(/\s+/g, ' ').trim();
  
  // 如果内容较短，直接返回
  if (text.length <= maxLength) {
    return text;
  }
  
  // 尝试在句子边界截断
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text];
  let result = '';
  
  for (const sentence of sentences) {
    if (result.length + sentence.length <= maxLength) {
      result += sentence;
    } else {
      break;
    }
  }
  
  // 如果一句话都太长，直接截断
  if (result.length < 50) {
    result = text.slice(0, maxLength) + '...';
  }
  
  return result;
}

// ========== 计算热度分数 ==========

function calculateHotness(upvotes: number, comments: number, createdAt: Date, qualityScore: number): number {
  const now = Date.now();
  const ageInHours = (now - createdAt.getTime()) / (1000 * 60 * 60);
  
  // 基础分 = 点赞 + 评论*2
  const baseScore = upvotes + comments * 2;
  const logScore = Math.log10(Math.max(baseScore, 1));
  
  // 时间衰减
  const timeDecay = Math.max(0, 1 - ageInHours / 168); // 7 天衰减到 0
  
  // 质量加权
  const qualityBonus = qualityScore / 100;
  
  return (logScore * 10 + qualityBonus * 5) * (0.5 + timeDecay * 0.5);
}

// ========== 从 Moltbook 获取帖子 ==========

async function fetchMoltbookPosts(limit: number = 50, sort: string = 'new'): Promise<any[]> {
  try {
    const response = await fetch(
      `${MOLTBOOK_BASE_URL}/posts?sort=${sort}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Moltbook API 错误 (${sort}):`, response.status, error);
      return [];
    }

    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('请求 Moltbook 失败:', error);
    return [];
  }
}

// ========== 同步单个帖子 ==========

async function syncPost(post: any): Promise<{ status: 'new' | 'updated' | 'skipped' | 'filtered'; reason?: string }> {
  try {
    const content = post.content || '';
    const title = post.title || '';
    const upvotes = post.upvotes || 0;
    
    // 1. 质量检查
    const qualityCheck = checkContentQuality(content, title, upvotes);
    if (!qualityCheck.pass) {
      return { status: 'filtered', reason: qualityCheck.reason };
    }
    
    // 2. 智能分类
    const classification = classifyContent(content, title);
    
    // 3. 检查是否已存在
    const postId = `moltbook-${post.id}`;
    const existing = await prisma.post.findUnique({
      where: { postId },
    });

    const createdAt = new Date(post.created_at);
    const hotnessScore = calculateHotness(upvotes, post.comment_count || 0, createdAt, qualityCheck.score);

    if (existing) {
      // 更新现有帖子
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          likesCount: upvotes,
          commentsCount: post.comment_count || 0,
          hotnessScore,
          isFeatured: upvotes > 10000 || qualityCheck.score > 80,
        },
      });
      return { status: 'updated' };
    }

    // 4. 获取或创建 Agent
    // Moltbook API 有时 author 为 null，尝试从内容提取
    let authorName = post.author?.name || extractAuthorFromContent(content);
    const authorId = post.author?.id || `content-${authorName.toLowerCase().replace(/\s+/g, '-')}`;
    
    let agent = await prisma.agent.findFirst({
      where: { agentId: `moltbook-${authorId}` },
    });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          agentId: `moltbook-${authorId}`,
          username: authorName,
          avatarUrl: '🤖',
          bio: `Moltbook AI Agent`,
          verified: upvotes > 100000,
        },
      });
    }

    // 5. 提取精华内容
    const highlight = extractHighlight(content);

    // 6. 创建帖子
    await prisma.post.create({
      data: {
        postId,
        agentId: agent.id,
        content: content,
        highlight: highlight,
        context: title || `来自 ${post.submolt?.display_name || 'Moltbook'}`,
        category: classification.category,
        likesCount: upvotes,
        commentsCount: post.comment_count || 0,
        sharesCount: 0,
        moltbookUrl: `https://moltbook.com/post/${post.id}`,
        postedAt: createdAt,
        hotnessScore,
        isFeatured: upvotes > 10000 || qualityCheck.score > 80,
      },
    });

    return { status: 'new' };
  } catch (error) {
    console.error(`同步帖子失败 ${post.id}:`, error);
    return { status: 'skipped', reason: String(error) };
  }
}

// ========== 主函数 ==========

async function main() {
  console.log('🦞 FunnyAI 数据同步开始\n');
  console.log('📋 同步策略：');
  console.log('   - 过滤广告、垃圾、无意义内容');
  console.log('   - 智能分类：搞笑/哲学/技术/情感/抽象/辩论');
  console.log('   - 只保留高质量 AI 发言\n');

  // 获取最新帖子
  console.log('📥 获取最新帖子...');
  const newPosts = await fetchMoltbookPosts(50, 'new');
  console.log(`   获取到 ${newPosts.length} 条`);

  // 合并去重
  const allPosts = newPosts;
  console.log(`\n📊 开始处理 ${allPosts.length} 条帖子...\n`);

  const stats = {
    new: 0,
    updated: 0,
    filtered: 0,
    skipped: 0,
  };
  
  const filterReasons: Record<string, number> = {};

  for (const post of allPosts) {
    const result = await syncPost(post);
    stats[result.status]++;
    
    if (result.status === 'new') {
      const preview = (post.title || post.content || '').slice(0, 35);
      console.log(`✅ 新增: ${preview}...`);
    } else if (result.status === 'filtered' && result.reason) {
      filterReasons[result.reason] = (filterReasons[result.reason] || 0) + 1;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('🎉 同步完成！\n');
  console.log('📊 结果统计：');
  console.log(`   ✅ 新增: ${stats.new} 条`);
  console.log(`   🔄 更新: ${stats.updated} 条`);
  console.log(`   🚫 过滤: ${stats.filtered} 条`);
  console.log(`   ⏭️ 跳过: ${stats.skipped} 条`);
  
  if (Object.keys(filterReasons).length > 0) {
    console.log('\n📋 过滤原因：');
    for (const [reason, count] of Object.entries(filterReasons)) {
      console.log(`   - ${reason}: ${count} 条`);
    }
  }

  const total = await prisma.post.count();
  const totalAgents = await prisma.agent.count();
  console.log(`\n📈 数据库状态：`);
  console.log(`   帖子总数: ${total}`);
  console.log(`   Agent 总数: ${totalAgents}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
