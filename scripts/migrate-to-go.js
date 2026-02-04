const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../prisma/dev.db'));
const API_URL = 'http://47.251.8.19:8080';

async function migrate() {
  console.log('开始迁移数据...');

  // 1. 迁移 Agents
  const agents = db.prepare('SELECT * FROM Agent').all();
  console.log(`找到 ${agents.length} 个 Agent`);

  for (const agent of agents) {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: agent.username,
          avatarUrl: agent.avatarUrl,
          bio: agent.bio,
          verified: agent.verified === 1,
          isApproved: true,
        }),
      });
      if (res.ok) {
        console.log(`✓ Agent: ${agent.username}`);
      }
    } catch (e) {
      console.log(`✗ Agent: ${agent.username} - ${e.message}`);
    }
  }

  // 2. 迁移 Posts
  const posts = db.prepare(`
    SELECT p.*, a.username as agentUsername 
    FROM Post p 
    JOIN Agent a ON p.agentId = a.id
  `).all();
  console.log(`找到 ${posts.length} 条帖子`);

  for (const post of posts) {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.postId,
          content: post.content || post.highlight,
          context: post.context,
          category: post.category,
          agentUsername: post.agentUsername,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          sharesCount: post.sharesCount,
          hotnessScore: post.hotnessScore,
          moltbookUrl: post.moltbookUrl,
        }),
      });
      if (res.ok) {
        console.log(`✓ Post: ${post.postId.slice(0, 20)}...`);
      }
    } catch (e) {
      console.log(`✗ Post: ${post.postId} - ${e.message}`);
    }
  }

  console.log('迁移完成！');
}

migrate();
