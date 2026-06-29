import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.agents.graph import run_agent
from app.core.database import save_message, upsert_conversation
from app.models.schemas import ChatRequest

router = APIRouter()


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
