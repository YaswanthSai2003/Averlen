import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlmodel import Session

from app.api.analytics_routes import router as analytics_router
from app.api.audit_routes import router as audit_router
from app.api.auth_routes import router as auth_router
from app.api.insight_routes import router as insights_router
from app.api.pricing_routes import router as pricing_router
from app.api.property_routes import router as property_router
from app.api.upload_routes import router as upload_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.db.database import engine
from app.services.audit_service import create_audit_log


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Starting PricePilot API")
    yield
    logger.info("Shutting down PricePilot API")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    description="Revenue Intelligence API for Short-Term Rental Analytics",
    lifespan=lifespan,
)

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    logger.info(
        "method=%s path=%s status_code=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    try:
        with Session(engine) as session:
            create_audit_log(
                session=session,
                request=request,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
    except Exception as exc:
        logger.warning("audit_log_failed error=%s", str(exc))

    return response


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "PricePilot API is running"}


app.include_router(auth_router, prefix="/api")
app.include_router(property_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(pricing_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
