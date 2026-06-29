from datetime import datetime
from typing import Generator, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings
from app.core.security import EncryptionUtil


is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, nullable=True)
    title = Column(String, default="新对话")
    compressed_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conv_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    compressed_chunk = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def upsert_conversation(conv_id: str, project_id: Optional[str], title: str = "新对话") -> None:
    db = SessionLocal()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.project_id = project_id
            if title:
                conv.title = title
        else:
            conv = Conversation(id=conv_id, project_id=project_id, title=title)
            db.add(conv)
        db.commit()
    finally:
        db.close()


def save_message(
    conv_id: str,
    role: str,
    content: str,
    compressed_chunk: Optional[str] = None,
) -> None:
    db = SessionLocal()
    try:
        db_msg = Message(
            conv_id=conv_id,
            role=role,
            content=EncryptionUtil.encrypt_text(content),
            compressed_chunk=EncryptionUtil.encrypt_text(compressed_chunk) if compressed_chunk else None,
        )
        db.add(db_msg)
        db.commit()
    finally:
        db.close()


def save_compressed_memory(conv_id: str, compressed_text: str, db: Session) -> None:
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    encrypted_summary = EncryptionUtil.encrypt_text(compressed_text)
    if conv:
        conv.compressed_summary = encrypted_summary
    else:
        conv = Conversation(id=conv_id, compressed_summary=encrypted_summary)
        db.add(conv)
    db.commit()


def get_compressed_memory(conv_id: str, db: Session) -> str:
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        return ""
    return EncryptionUtil.decrypt_text(conv.compressed_summary or "")
