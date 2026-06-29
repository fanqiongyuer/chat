from functools import lru_cache
from typing import Any, Dict, List

import chromadb

from app.core.config import settings
from app.knowledge.embedding import embed_text


@lru_cache(maxsize=1)
def get_collection() -> chromadb.api.models.Collection.Collection:
    client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
    try:
        return client.get_collection(settings.CHROMA_COLLECTION)
    except Exception:
        return client.create_collection(settings.CHROMA_COLLECTION)


def retrieve(query: str, top_k: int = 10) -> List[Dict[str, Any]]:
    if not query.strip():
        return []

    collection = get_collection()
    query_vec = embed_text(query)

    result = collection.query(
        query_embeddings=[query_vec],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    payload: List[Dict[str, Any]] = []
    for idx, text in enumerate(docs):
        meta = metas[idx] if idx < len(metas) and metas[idx] else {}
        distance = distances[idx] if idx < len(distances) else None
        payload.append(
            {
                "text": text,
                "source": meta.get("source", "未知来源"),
                "page": meta.get("page"),
                "distance": float(distance) if distance is not None else None,
            }
        )

    return payload
