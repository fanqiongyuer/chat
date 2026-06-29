import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME = "GeneMind Backend"
    API_V1_PREFIX = os.getenv("API_V1_PREFIX", "/api/v1")

    # 支持 auto / ollama / openai_compatible
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto").lower()

    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

    OPENAI_COMPAT_BASE_URL = os.getenv("OPENAI_COMPAT_BASE_URL", "")
    OPENAI_COMPAT_API_KEY = os.getenv("OPENAI_COMPAT_API_KEY", "")
    OPENAI_COMPAT_MODEL = os.getenv("OPENAI_COMPAT_MODEL", "")

    LLM_CONNECT_TIMEOUT = float(os.getenv("LLM_CONNECT_TIMEOUT", "5"))
    LLM_READ_TIMEOUT = float(os.getenv("LLM_READ_TIMEOUT", "30"))

    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-zh-v1.5")
    EMBEDDING_LOCAL_ONLY = os.getenv("EMBEDDING_LOCAL_ONLY", "true").lower() == "true"
    EMBEDDING_FALLBACK_DIM = int(os.getenv("EMBEDDING_FALLBACK_DIM", "384"))

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/gene_mind.db")
    CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./data/chroma_db")
    CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "gene_mind_docs")
    RAW_DATA_PATH = os.getenv("RAW_DATA_PATH", "./data/raw")


settings = Settings()
