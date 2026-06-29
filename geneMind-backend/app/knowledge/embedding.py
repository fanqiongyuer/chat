import hashlib
from functools import lru_cache
from math import sqrt
from typing import List, Optional

from sentence_transformers import SentenceTransformer

from app.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model() -> Optional[SentenceTransformer]:
    try:
        return SentenceTransformer(
            settings.EMBEDDING_MODEL,
            local_files_only=settings.EMBEDDING_LOCAL_ONLY,
        )
    except Exception as exc:
        print(f"[embedding] 模型加载失败，回退为哈希向量: {exc}")
        return None


def _hash_embedding(text: str, dim: int) -> List[float]:
    source = (text or "").encode("utf-8")
    digest = hashlib.sha256(source).digest() if source else bytes([0] * 32)
    vec = [((digest[i % len(digest)] / 255.0) - 0.5) for i in range(dim)]

    norm = sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed_text(text: str) -> List[float]:
    model = get_embedding_model()
    if model is None:
        return _hash_embedding(text, settings.EMBEDDING_FALLBACK_DIM)

    try:
        vector = model.encode(text or "", normalize_embeddings=True)
        return vector.tolist()
    except Exception as exc:
        print(f"[embedding] 编码失败，回退为哈希向量: {exc}")
        return _hash_embedding(text, settings.EMBEDDING_FALLBACK_DIM)


def embed_texts(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []

    model = get_embedding_model()
    if model is None:
        return [_hash_embedding(text, settings.EMBEDDING_FALLBACK_DIM) for text in texts]

    try:
        vectors = model.encode(texts, normalize_embeddings=True)
        return vectors.tolist()
    except Exception as exc:
        print(f"[embedding] 批量编码失败，回退为哈希向量: {exc}")
        return [_hash_embedding(text, settings.EMBEDDING_FALLBACK_DIM) for text in texts]
