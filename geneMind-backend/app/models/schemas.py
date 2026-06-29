from typing import List, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    conversation_id: str
    messages: List[ChatMessage]
    project_id: Optional[str] = None
