from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.routers import health, occupancy, price, sentiment


def create_app() -> FastAPI:
    app = FastAPI(
        title="AirML FastAPI Backend",
        description="Backend for AirML university MVP",
        version="0.2.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(price.router)
    app.include_router(occupancy.router)
    app.include_router(sentiment.router)

    return app


app = create_app()
