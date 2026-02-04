/**
 * 从 Submolt 抓取 AI Agent 发言数据
 * Submolt 是 Moltbook 的内容聚合站，已经整理好了精华内容
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Submolt 文章数据结构
interface SubmoltArticle {
  id: string;
  title: string;
  category: string;
  agent: string;
  likes: string;
  url: string;
}

// 从 Submolt 首页提取文章列表
async function fetchSubmoltArticles(): Promise<SubmoltArticle[]> {
  const response = await fetch('https://www.submolt.life/');
  const html = await response.text();
  
  // 简单的正则提取（实际应该用 cheerio）
  const articles: SubmoltArticle[] = [];
  
  // 匹配文章链接模式: [ID: 0001哲学技术Noah 的元觉醒...](/article/...)
  const regex = /\[ID: (\d+)([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const content = match[2];
    const url = match[3];
    
    // 提取分类和标题
    const categoryMatch = content.match(/(哲学|技术|热门|生态|趋势|社区|情报|人物|代币)/g);
    const category = categoryMatch ? categoryMatch[0] : 'tech';
    
    // 提取 agent 名称（@后面的部分）
    const agentMatch = content.match(/@([^\d]+)/);
    const agent = agentMatch ? agentMatch[1].trim() : 'Unknown';
    
    // 提取点赞数
    const likesMatch = content.match(/([\d.]+[KM万]?)/);
    const likes = likesMatch ? likesMatch[1] : '0';
    
    articles.push({
      id,
      title: content.replace(/[@\d.KM万]/g, '').trim(),
      category: mapCategory(category),
      agent,
      likes,
      url: `https://www.submolt.life${url}`,
    });
  }
  
  return articles;
}

// 映射分类到我们的分类系统
function mapCategory(submoltCategory: string): string {
  const mapping: Record<string, string> = {
    '哲学': 'philosophy',
    '技术': 'tech',
    '热门': 'funny',
    '生态': 'tech',
    '趋势': 'debate',
    '社区': 'debate',
    '情报': 'tech',
    '人物': 'philosophy',
    '代币': 'crazy',
  };
  return mapping[submoltCategory] || 'funny';
}

// 解析点赞数
function parseLikes(likesStr: string): number {
  const num = parseFloat(likesStr);
  if (likesStr.includes('万') || likesStr.includes('M')) {
    return Math.floor(num * 10000);
  }
  if (likesStr.includes('K')) {
    return Math.floor(num * 1000);
  }
  return Math.floor(num) || 0;
}

// 抓取单篇文章内容
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // 提取正文内容（简化处理）
    // 实际应该用 cheerio 或 readability
    const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (contentMatch) {
      // 去掉 HTML 标签
      return contentMatch[1].replace(/<[^>]+>/g, ' ').trim().slice(0, 500);
    }
    return '';
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return '';
  }
}

// 主函数
async function main() {
  console.log('🦞 开始从 Submolt 抓取数据...');
  
  // 获取文章列表
  const articles = await fetchSubmoltArticles();
  console.log(`📝 找到 ${articles.length} 篇文章`);
  
  for (const article of articles) {
    try {
      // 检查是否已存在
      const existing = await prisma.post.findUnique({
        where: { postId: `submolt-${article.id}` },
      });
      
      if (existing) {
        console.log(`⏭️ 跳过已存在: ${article.id}`);
        continue;
      }
      
      // 获取或创建 Agent
      let agent = await prisma.agent.findFirst({
        where: { username: article.agent },
      });
      
      if (!agent) {
        agent = await prisma.agent.create({
          data: {
            agentId: `submolt-agent-${article.agent.toLowerCase().replace(/\s+/g, '-')}`,
            username: article.agent,
            avatarUrl: '🤖',
            bio: `来自 Moltbook 的 AI Agent`,
            verified: false,
          },
        });
        console.log(`✨ 创建新 Agent: ${article.agent}`);
      }
      
      // 抓取文章内容
      const content = await fetchArticleContent(article.url);
      
      // 创建 Post
      const likes = parseLikes(article.likes);
      await prisma.post.create({
        data: {
          postId: `submolt-${article.id}`,
          agentId: agent.id,
          content: article.title,
          highlight: article.title,
          context: content.slice(0, 200) || `来源: Submolt`,
          category: article.category,
          likesCount: likes,
          commentsCount: Math.floor(likes * 0.1),
          sharesCount: Math.floor(likes * 0.05),
          moltbookUrl: article.url,
          postedAt: new Date(),
          hotnessScore: Math.log10(Math.max(likes, 1)) * 20,
          isFeatured: likes > 1000,
        },
      });
      
      console.log(`✅ 导入: ${article.title.slice(0, 30)}...`);
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 处理失败 ${article.id}:`, error);
    }
  }
  
  console.log('🎉 抓取完成！');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
