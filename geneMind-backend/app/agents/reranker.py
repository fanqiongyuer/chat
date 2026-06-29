from typing import Any, Dict, List

import numpy as np

from app.knowledge.embedding import embed_text


def reranker_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """重排序过滤：低于阈值的上下文被丢弃，保留最相关 Top-3。"""
    messages = state.get("messages", [])
    query = messages[-1].get("content", "") if messages else ""
    raw_docs: List[Dict[str, Any]] = state.get("raw_docs", [])

    if not query or not raw_docs:
        return {"filtered_docs": [], "next_agent": "compressor"}

    query_vec = np.array(embed_text(query), dtype=np.float32)
    query_norm = np.linalg.norm(query_vec) + 1e-8

    filtered: List[Dict[str, Any]] = []
    for doc in raw_docs:
        text = (doc.get("text") or "")[:200]
        if not text:
            continue
        doc_vec = np.array(embed_text(text), dtype=np.float32)
        doc_norm = np.linalg.norm(doc_vec) + 1e-8
        similarity = float(np.dot(query_vec, doc_vec) / (query_norm * doc_norm))
        if similarity >= 0.35:
            normalized_doc = dict(doc)
            normalized_doc["relevance"] = similarity
            filtered.append(normalized_doc)

    filtered.sort(key=lambda x: x["relevance"], reverse=True)
    return {
        "filtered_docs": filtered[:3],
        "next_agent": "compressor",
    }
