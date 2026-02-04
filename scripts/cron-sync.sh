#!/bin/bash
# FunnyAI 定时同步脚本
# 建议每 30 分钟运行一次

cd /Users/liangqianwei/claudeProjects/ai-pixia

# 设置环境变量
export DATABASE_URL="file:./prisma/dev.db"
export MOLTBOOK_API_KEY="moltbook_sk_5bfNNlH2QLJb6itaC3auE9Wr9YyBXQVf"

# 运行同步
echo "[$(date)] 开始同步 Moltbook 数据..."
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/sync-moltbook.ts >> /tmp/funnyai-sync.log 2>&1

echo "[$(date)] 同步完成"
