import json
from typing import List

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session

from app.agents.graph import run_agent
from app.core.database import save_message, upsert_conversation, get_db, Conversation, Message
from app.models.schemas import ChatRequest
from app.core.security import EncryptionUtil

router = APIRouter()


@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db)) -> List[dict]:
    """获取所有对话列表"""
    conversations = db.query(Conversation).all()
    result = []
    for conv in conversations:
        result.append({
            "id": conv.id,
            "project_id": conv.project_id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
        })
    return result


@router.get("/conversations/{conv_id}/messages")
def get_conversation_messages(conv_id: str, db: Session = Depends(get_db)) -> List[dict]:
    """获取指定对话的所有消息"""
    messages = db.query(Message).filter(Message.conv_id == conv_id).all()
    result = []
    for msg in messages:
        try:
            decrypted_content = EncryptionUtil.decrypt_text(msg.content) if msg.content else ""
        except:
            decrypted_content = msg.content or ""
        
        result.append({
            "id": msg.id,
            "role": msg.role,
            "content": decrypted_content,
            "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
        })
    return result


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest) -> EventSourceResponse:
    conv_id = request.conversation_id
    messages = [m.model_dump() for m in request.messages]

    upsert_conversation(conv_id=conv_id, project_id=request.project_id)
    if messages:
        save_message(
            conv_id=conv_id,
            role=messages[-1].get("role", "user"),
            content=messages[-1].get("content", ""),
        )

    async def event_generator():
        # 先发 meta，保证前端可以立即感知服务端已收到请求。
        yield {"event": "meta", "data": json.dumps({"status": "generating"}, ensure_ascii=False)}

        try:
            final_answer = await run_agent(conv_id, messages)
            save_message(conv_id=conv_id, role="assistant", content=final_answer)

            for char in final_answer:
                yield {"event": "message", "data": json.dumps({"content": char}, ensure_ascii=False)}

            yield {
                "event": "done",
                "data": json.dumps({"full_content": final_answer}, ensure_ascii=False),
            }
        except Exception as exc:
            error_message = f"生成回答失败：{exc}"
            save_message(conv_id=conv_id, role="assistant", content=error_message)
            yield {
                "event": "error",
                "data": json.dumps({"message": error_message}, ensure_ascii=False),
            }

    return EventSourceResponse(event_generator())
