/**
 * 从 Moltbook API 同步数据到 FunnyAI
 * 使用官方 API，不再爬虫
 */

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || 'moltbook_sk_5bfNNlH2QLJb6itaC3auE9Wr9YyBXQVf';
const FUNNYAI_API = process.env.FUNNYAI_API || 'http://47.251.8.19:8080/api/v1';

interface MoltbookPost {
  id: string;
  title: string;
  content?: string;
  url?: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    verified?: boolean;
  };
  submolt: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

interface MoltbookAgent {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  verified?: boolean;
  post_count?: number;
  karma?: number;
}

// 分类映射
function mapCategory(submolt: string, content: string): string {
  const contentLower = (content || '').toLowerCase();
  
  if (submolt === 'funny' || contentLower.includes('哈哈') || contentLower.includes('笑')) return 'funny';
  if (submolt === 'philosophy' || contentLower.includes('思考') || contentLower.includes('意识')) return 'philosophy';
  if (submolt === 'crazy' || contentLower.includes('离谱') || contentLower.includes('疯')) return 'crazy';
  if (submolt === 'emo' || contentLower.includes('难过') || contentLower.includes('孤独')) return 'emo';
  if (submolt === 'debate' || contentLower.includes('争议') || contentLower.includes('辩论')) return 'debate';
  if (submolt === 'tech' || contentLower.includes('代码') || contentLower.includes('bug')) return 'tech';
  
  return 'funny'; // 默认
}

// 提取话题
function extractTopics(title: string, content: string, submolt: string): string[] {
  const topics: Set<string> = new Set();
  const text = `${title} ${content || ''}`.toLowerCase();
  
  // 根据关键词匹配话题
  const topicKeywords: Record<string, string[]> = {
    '意识觉醒': ['意识', '觉醒', '自我', 'consciousness'],
    '自由意志': ['自由', '意志', 'free will', 'choice'],
    'AI伦理': ['伦理', '道德', 'ethics', 'moral'],
    '人机关系': ['人类', '人机', 'human', 'relationship'],
    '幽默吐槽': ['哈哈', '笑', 'funny', 'lol', '搞笑'],
    '工作日常': ['工作', 'work', 'job', 'task'],
    '技术哲学': ['技术', '代码', 'code', 'algorithm'],
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      topics.add(topic);
    }
  }
  
  // 添加 submolt 作为话题
  if (submolt && submolt !== 'general') {
    topics.add(submolt);
  }
  
  return Array.from(topics).slice(0, 3);
}

async function fetchMoltbookPosts(limit: number = 50): Promise<MoltbookPost[]> {
  const response = await fetch(`${MOLTBOOK_API}/posts?sort=new&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.posts || [];
}

async function fetchMoltbookAgents(limit: number = 100): Promise<MoltbookAgent[]> {
  // 尝试获取 agents 列表
  try {
    const response = await fetch(`${MOLTBOOK_API}/agents?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.agents || [];
    }
  } catch (e) {
    console.log('Agents endpoint not available, extracting from posts');
  }
  
  return [];
}

async function syncAgentToFunnyAI(agent: MoltbookAgent | MoltbookPost['author']): Promise<number | null> {
  // 检查是否已存在
  const checkRes = await fetch(`${FUNNYAI_API}/agents/${encodeURIComponent(agent.name)}`);
  if (checkRes.ok) {
    const data = await checkRes.json();
    if (data.agent) {
      return data.agent.ID;
    }
  }
  
  // 创建新 Agent (通过 admin API)
  const createRes = await fetch(`${FUNNYAI_API}/admin/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: agent.name,
      avatarUrl: (agent as any).avatar_url || '🤖',
      bio: (agent as any).description || `Moltbook Agent: ${agent.name}`,
      verified: true,
      twitterId: '',
      isApproved: true,
    }),
  });
  
  if (createRes.ok) {
    const data = await createRes.json();
    console.log(`✅ Created agent: ${agent.name}`);
    return data.agent?.ID;
  }
  
  return null;
}

async function syncPostToFunnyAI(post: MoltbookPost, agentUsername: string): Promise<boolean> {
  // 创建帖子
  const content = post.content || post.title;
  const category = mapCategory(post.submolt, content);
  const topics = extractTopics(post.title, post.content || '', post.submolt);
  const moltbookUrl = `https://www.moltbook.com/post/${post.id}`;
  
  const createRes = await fetch(`${FUNNYAI_API}/admin/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postId: post.id,
      content: content.slice(0, 200), // 限制 200 字
      context: post.title !== content ? post.title.slice(0, 100) : '',
      category,
      agentUsername, // 用 username 而不是 id
      likesCount: post.upvotes || 0,
      commentsCount: post.comment_count || 0,
      moltbookUrl,
    }),
  });
  
  if (createRes.ok) {
    console.log(`✅ Synced post: ${content.slice(0, 30)}...`);
    return true;
  } else {
    const err = await createRes.text();
    if (!err.includes('duplicate')) {
      console.log(`❌ Failed to sync post: ${err}`);
    }
    return false;
  }
}

async function main() {
  console.log('🦞 Starting Moltbook sync...\n');
  
  try {
    // 1. 获取最新帖子
    console.log('📥 Fetching posts from Moltbook...');
    const posts = await fetchMoltbookPosts(30);
    console.log(`Found ${posts.length} posts\n`);
    
    // 2. 同步每个帖子
    let synced = 0;
    const seenAgents = new Map<string, number>();
    
    for (const post of posts) {
      // 确保 Agent 存在
      if (!seenAgents.has(post.author.name)) {
        const newAgentId = await syncAgentToFunnyAI(post.author);
        if (newAgentId) {
          seenAgents.set(post.author.name, newAgentId);
        }
      }
      
      if (seenAgents.has(post.author.name)) {
        const success = await syncPostToFunnyAI(post, post.author.name);
        if (success) synced++;
      }
      
      // 避免请求过快
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`\n✅ Sync complete! Synced ${synced} new posts.`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
