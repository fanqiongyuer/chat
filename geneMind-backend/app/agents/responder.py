from typing import Any, Dict

from app.core.database import SessionLocal, get_compressed_memory
from app.utils.llm_client import LLMUnavailableError, stream_llm


async def responder_node(state: Dict[str, Any]) -> Dict[str, str]:
    """融合历史记忆与当前上下文，生成最终回答。"""
    conv_id = state.get("conversation_id")
    current_context = state.get("compressed_context", "")
    messages = state.get("messages", [])
    query = messages[-1].get("content", "") if messages else ""

    db = SessionLocal()
    try:
        history_memory = get_compressed_memory(conv_id, db) if conv_id else ""
    finally:
        db.close()

    memory_part = f"【历史对话要点】\n{history_memory}\n\n" if history_memory else ""
    context_part = f"【当前参考资料】\n{current_context}\n\n" if current_context else ""

    final_prompt = f"""
{memory_part}{context_part}
用户新问题：{query}
请基于以上历史信息和参考资料进行回答。如果信息不足，请明确告知。
回答："""

    full_response = ""
    try:
        async for chunk in stream_llm(final_prompt, system_prompt="你是严谨的科研助理。"):
            full_response += chunk
    except LLMUnavailableError as exc:
        full_response = f"模型服务当前不可用：{exc}"

    if not full_response.strip():
        full_response = "当前没有生成到有效内容，请稍后重试。"

    return {
        "final_answer": full_response,
        "next_agent": "END",
    }
