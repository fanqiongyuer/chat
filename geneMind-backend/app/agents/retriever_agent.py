from typing import Any, Dict

from app.knowledge.retriever import retrieve


def retriever_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """仅负责从向量库拉取原始 Top-10 文档。"""
    messages = state.get("messages", [])
    last_message = messages[-1].get("content", "") if messages else ""
    raw_docs = retrieve(last_message, top_k=10)
    return {
        "raw_docs": raw_docs,
        "next_agent": "reranker",
    }
