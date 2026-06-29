from typing import Any, Dict, List

from app.utils.llm_client import LLMUnavailableError, stream_llm


async def compressor_node(state: Dict[str, Any]) -> Dict[str, str]:
    """将过滤后的文档压缩为短摘要，减小上下文窗口占用。"""
    docs: List[Dict[str, Any]] = state.get("filtered_docs", [])
    messages = state.get("messages", [])
    query = messages[-1].get("content", "") if messages else ""

    if not docs or not query:
        return {"compressed_context": "", "next_agent": "memory_saver"}

    raw_text = "\n---\n".join(
        [f"[{d.get('source', '未知')}]\n{(d.get('text') or '')[:600]}" for d in docs]
    )

    compression_prompt = f"""
请根据用户问题，将以下参考资料压缩成最多 300 字的核心事实摘要。
要求：只保留关键机制、数据结论，去除重复和修饰词。
问题：{query}
参考资料：
{raw_text}
摘要："""

    full_summary = ""
    try:
        async for chunk in stream_llm(
            compression_prompt,
            system_prompt="你是科研文献压缩专家。",
        ):
            full_summary += chunk
    except LLMUnavailableError:
        # 压缩阶段失败时不阻塞主回答链路，直接让 responder 基于历史/问题继续。
        full_summary = ""

    return {
        "compressed_context": full_summary[:500],
        "next_agent": "memory_saver",
    }
