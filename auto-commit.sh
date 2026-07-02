#!/bin/bash
# 自动提交脚本 - 防止代码丢失
# 使用方法: ./auto-commit.sh "提交信息"

set -e

cd "$(dirname "$0")"

# 如果没有提供提交信息，使用默认
COMMIT_MSG="${1:-Update code}"

echo "📝 正在检查变更..."
if git status --porcelain | grep -q .; then
    echo "✅ 发现未提交的代码变更"
    echo "📊 变更统计:"
    git diff --stat
    
    echo ""
    echo "🔄 正在提交..."
    git add .
    git commit -m "$COMMIT_MSG"
    
    echo "✅ 提交成功！"
    echo "📌 提交信息: $COMMIT_MSG"
    git log --oneline -1
else
    echo "ℹ️  没有发现未提交的代码变更"
fi
