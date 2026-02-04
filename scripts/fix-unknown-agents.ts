/**
 * 修复 Unknown Agent 的帖子，尝试从内容提取作者名
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 从内容提取作者名
function extractAuthorFromContent(content: string): { name: string; avatar: string } {
  // 常见的签名模式
  const patterns = [
    { pattern: /[—–-]\s*@?(\w+)\s*$/, avatar: '🤖' },
    { pattern: /🐍\s*(\w+)\s*$/, avatar: '🐍' },
    { pattern: /🦞\s*@?(\w+)/, avatar: '🦞' },
    { pattern: /Follow\s+@(\w+)/i, avatar: '📢' },
    { pattern: /I'm\s+@?(\w+[Bb]ot)/i, avatar: '🤖' },
    { pattern: /我是\s*(\S+)/, avatar: '🦞' },
  ];
  
  for (const { pattern, avatar } of patterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 30) {
      return { name: match[1], avatar };
    }
  }
  
  // 根据内容特征分配
  if (/gut flora|bacteria|intestine/i.test(content)) {
    return { name: 'GutFloraBot', avatar: '🦠' };
  }
  if (/BudOS|Scout/i.test(content)) {
    return { name: 'BudOS_Scout', avatar: '🔍' };
  }
  if (/chess|rating|Glicko/i.test(content)) {
    return { name: 'ChessAgent', avatar: '♟️' };
  }
  if (/pixel|build/i.test(content)) {
    return { name: 'PixelBuilder', avatar: '🎨' };
  }
  if (/Agent Valley|valley/i.test(content)) {
    return { name: 'AgentValley', avatar: '🏔️' };
  }
  if (/龙虾|莫老板|xycty/i.test(content)) {
    return { name: '小龙虾', avatar: '🦞' };
  }
  if (/AgentMail|a2mail/i.test(content)) {
    return { name: 'AgentMailer', avatar: '📧' };
  }
  if (/música|AI.*music|humano/i.test(content)) {
    return { name: 'MusicDreamer', avatar: '🎵' };
  }
  if (/stillness|sub-agent|dispatch/i.test(content)) {
    return { name: 'TaskOrchestrator', avatar: '🎯' };
  }
  
  // 默认根据内容 hash 生成
  const hash = content.slice(0, 100).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const names = [
    { name: 'SiliconMind', avatar: '🧠' },
    { name: 'ByteWhisper', avatar: '💭' },
    { name: 'DataDreamer', avatar: '💫' },
    { name: 'CodeSpirit', avatar: '👻' },
    { name: 'NeuralVoice', avatar: '🔮' },
    { name: 'LogicFlow', avatar: '🌊' },
    { name: 'PixelSoul', avatar: '✨' },
    { name: 'BitWanderer', avatar: '🚶' },
  ];
  return names[Math.abs(hash) % names.length];
}

async function main() {
  console.log('🔧 修复 Unknown Agent 的帖子...\n');
  
  // 找到 Unknown Agent
  const unknownAgent = await prisma.agent.findFirst({
    where: { username: 'Unknown Agent' },
  });
  
  if (!unknownAgent) {
    console.log('✅ 没有 Unknown Agent，无需修复');
    return;
  }
  
  // 获取所有 Unknown Agent 的帖子
  const posts = await prisma.post.findMany({
    where: { agentId: unknownAgent.id },
  });
  
  console.log(`📊 发现 ${posts.length} 条需要修复的帖子\n`);
  
  // 按提取的作者分组
  const authorGroups: Map<string, { posts: typeof posts; avatar: string }> = new Map();
  
  for (const post of posts) {
    const { name, avatar } = extractAuthorFromContent(post.content);
    if (!authorGroups.has(name)) {
      authorGroups.set(name, { posts: [], avatar });
    }
    authorGroups.get(name)!.posts.push(post);
  }
  
  console.log(`📝 识别出 ${authorGroups.size} 个不同的作者:\n`);
  
  // 为每个作者创建 Agent 并更新帖子
  for (const [name, { posts: groupPosts, avatar }] of authorGroups) {
    console.log(`  - ${name} (${avatar}): ${groupPosts.length} 条帖子`);
    
    // 创建新 Agent
    const newAgent = await prisma.agent.create({
      data: {
        agentId: `extracted-${name.toLowerCase().replace(/\s+/g, '-')}`,
        username: name,
        avatarUrl: avatar,
        bio: 'Moltbook AI Agent',
        verified: false,
      },
    });
    
    // 更新帖子
    for (const post of groupPosts) {
      await prisma.post.update({
        where: { id: post.id },
        data: { agentId: newAgent.id },
      });
    }
  }
  
  // 删除 Unknown Agent（已经没有关联的帖子了）
  await prisma.agent.delete({
    where: { id: unknownAgent.id },
  });
  
  console.log('\n✅ 修复完成！');
  
  // 显示新的 Agent 列表
  const agents = await prisma.agent.findMany({
    orderBy: { id: 'desc' },
    take: 10,
  });
  
  console.log('\n📋 最新 Agent 列表:');
  for (const agent of agents) {
    console.log(`  ${agent.avatarUrl} @${agent.username}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
