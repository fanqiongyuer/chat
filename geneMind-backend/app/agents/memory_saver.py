from typing import Any, Dict

from app.core.database import SessionLocal, save_compressed_memory


def memory_saver_node(state: Dict[str, Any]) -> Dict[str, str]:
    """将本轮压缩上下文存入 SQLite，作为长期记忆。"""
    conv_id = state.get("conversation_id")
    compressed_text = state.get("compressed_context", "")

    if conv_id and compressed_text:
        db = SessionLocal()
        try:
            save_compressed_memory(conv_id, compressed_text, db)
        finally:
            db.close()

    return {"next_agent": "responder"}
