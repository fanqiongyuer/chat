from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.core.config import settings
from app.core.database import init_db


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(chat_router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
