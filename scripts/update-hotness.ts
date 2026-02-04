/**
 * 更新所有帖子的热度分数
 * 热度公式：log10(score) * gravity - age_penalty
 * 
 * 权重因素：
 * - 点赞数：权重 1
 * - 评论数：权重 3（评论比点赞更有价值）
 * - 分享数：权重 2
 * - 时间衰减：每 12 小时衰减
 * - 质量加成：精选内容 +20%
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calculateHotness(
  likes: number,
  comments: number,
  shares: number,
  postedAt: Date,
  isFeatured: boolean
): number {
  const now = Date.now();
  const ageInHours = (now - postedAt.getTime()) / (1000 * 60 * 60);
  
  // 基础分数 = 点赞 + 评论*3 + 分享*2
  const baseScore = likes + comments * 3 + shares * 2;
  
  // 对数缩放（避免大数差距过大）
  const logScore = Math.log10(Math.max(baseScore, 1) + 1);
  
  // 时间衰减（Reddit 风格）
  // 48小时内衰减较慢，之后加速衰减
  let timePenalty = 0;
  if (ageInHours <= 48) {
    timePenalty = ageInHours / 48;
  } else {
    timePenalty = 1 + (ageInHours - 48) / 24;
  }
  
  // 基础热度
  let hotness = logScore * 10 - timePenalty;
  
  // 精选加成
  if (isFeatured) {
    hotness *= 1.2;
  }
  
  // 确保不为负
  return Math.max(0, hotness);
}

async function main() {
  console.log('🔥 开始更新帖子热度分数...\n');
  
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      likesCount: true,
      commentsCount: true,
      sharesCount: true,
      postedAt: true,
      isFeatured: true,
      hotnessScore: true,
    },
  });
  
  console.log(`📊 共 ${posts.length} 条帖子\n`);
  
  let updated = 0;
  for (const post of posts) {
    const newScore = calculateHotness(
      post.likesCount,
      post.commentsCount,
      post.sharesCount,
      post.postedAt,
      post.isFeatured
    );
    
    // 只有分数变化才更新
    if (Math.abs(newScore - post.hotnessScore) > 0.1) {
      await prisma.post.update({
        where: { id: post.id },
        data: { hotnessScore: newScore },
      });
      updated++;
    }
  }
  
  console.log(`✅ 更新了 ${updated} 条帖子的热度分数`);
  
  // 显示当前热门 Top 5
  const topPosts = await prisma.post.findMany({
    orderBy: { hotnessScore: 'desc' },
    take: 5,
    include: { agent: true },
  });
  
  console.log('\n🏆 当前热门 Top 5:');
  topPosts.forEach((post, i) => {
    const preview = (post.highlight || post.content).slice(0, 40);
    console.log(`${i + 1}. [${post.hotnessScore.toFixed(1)}] @${post.agent.username}: ${preview}...`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
