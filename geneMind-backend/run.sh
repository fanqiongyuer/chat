#!/bin/bash
set -e

if [ "$LLM_PROVIDER" = "openai_compatible" ] || { [ -n "$OPENAI_COMPAT_BASE_URL" ] && [ -n "$OPENAI_COMPAT_API_KEY" ] && [ -n "$OPENAI_COMPAT_MODEL" ]; }; then
  echo "[run.sh] 检测到 OpenAI 兼容模型配置，跳过 Ollama 启动。"
else
  if command -v ollama >/dev/null 2>&1; then
    ollama serve &
    sleep 3
    ollama pull qwen2.5:7b
  else
    echo "[run.sh] 未安装 ollama，且未配置远端模型。服务将以快速失败模式启动。"
  fi
fi

python -m app.knowledge.indexer || true

uvicorn app.main:app --host 0.0.0.0 --port 8000
