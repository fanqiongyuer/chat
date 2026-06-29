from pathlib import Path
from typing import Dict, List

from pypdf import PdfReader

from app.core.config import settings
from app.knowledge.embedding import embed_texts
from app.knowledge.retriever import get_collection


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    cleaned = " ".join(text.split())
    if not cleaned:
        return []

    chunks: List[str] = []
    start = 0
    text_len = len(cleaned)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(cleaned[start:end])
        if end == text_len:
            break
        start = max(end - overlap, 0)
    return chunks


def extract_pdf_chunks(pdf_path: Path) -> List[Dict[str, str]]:
    reader = PdfReader(str(pdf_path))
    all_chunks: List[Dict[str, str]] = []

    for page_idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        for chunk_idx, chunk in enumerate(chunk_text(text)):
            all_chunks.append(
                {
                    "id": f"{pdf_path.stem}-p{page_idx}-c{chunk_idx}",
                    "text": chunk,
                    "source": pdf_path.name,
                    "page": str(page_idx),
                }
            )

    return all_chunks


def index_pdfs() -> int:
    raw_dir = Path(settings.RAW_DATA_PATH)
    raw_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = sorted(raw_dir.glob("*.pdf"))
    if not pdf_files:
        print("[indexer] data/raw 下没有 PDF，跳过索引。")
        return 0

    collection = get_collection()
    total_chunks = 0

    for pdf_path in pdf_files:
        chunks = extract_pdf_chunks(pdf_path)
        if not chunks:
            continue

        ids = [c["id"] for c in chunks]
        docs = [c["text"] for c in chunks]
        metadatas = [{"source": c["source"], "page": c["page"]} for c in chunks]
        embeddings = embed_texts(docs)

        try:
            collection.delete(ids=ids)
        except Exception:
            pass

        collection.add(ids=ids, documents=docs, metadatas=metadatas, embeddings=embeddings)
        total_chunks += len(chunks)
        print(f"[indexer] 已索引 {pdf_path.name}，chunk 数: {len(chunks)}")

    print(f"[indexer] 索引完成，总 chunk 数: {total_chunks}")
    return total_chunks


if __name__ == "__main__":
    index_pdfs()
