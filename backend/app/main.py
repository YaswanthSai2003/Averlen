import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy import text
from sqlmodel import Session

from app.api.analytics_routes import router as analytics_router
from app.api.audit_routes import router as audit_router
from app.api.auth_routes import router as auth_router
from app.api.insight_routes import router as insights_router
from app.api.internal_routes import router as internal_router
from app.api.invite_routes import router as invite_router
from app.api.meta_routes import router as meta_router
from app.api.notification_routes import router as notification_router
from app.api.pricing_routes import router as pricing_router
from app.api.property_routes import router as property_router
from app.api.search_routes import router as search_router
from app.api.upload_routes import router as upload_router
from app.api.workspace_routes import router as workspace_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.db.database import engine
from app.services.audit_service import create_audit_log


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Starting Averlen API")
    yield
    logger.info("Shutting down Averlen API")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    description="Revenue Intelligence API for Short-Term Rental Analytics",
    lifespan=lifespan,
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
)

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)

app.state.limiter = limiter

if settings.rate_limit_enabled:
    app.add_middleware(SlowAPIMiddleware)

allowed_origins = [
    origin.strip()
    for origin in settings.frontend_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local development serves public media from disk. Production uses Cloudinary.
if settings.media_storage_backend == "local":
    os.makedirs(settings.public_upload_dir, exist_ok=True)
    app.mount(
        "/uploads/property_photos",
        StaticFiles(directory=settings.public_upload_dir),
        name="property_photos",
    )

    os.makedirs(settings.public_avatar_upload_dir, exist_ok=True)
    app.mount(
        "/uploads/user_avatars",
        StaticFiles(directory=settings.public_avatar_upload_dir),
        name="user_avatars",
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id

    return response


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    if not settings.debug:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


SKIP_LOG_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/health",
    "/healthz",
    "/readyz",
}

SKIP_LOG_PREFIXES = (
    "/uploads/property_photos",
    "/uploads/user_avatars",
    "/favicon.ico",
)


def should_skip_request_logging(path: str) -> bool:
    if path in SKIP_LOG_PATHS:
        return True

    return any(path.startswith(prefix) for prefix in SKIP_LOG_PREFIXES)


def should_audit_request(path: str, method: str, status_code: int) -> bool:
    if settings.testing or settings.disable_audit_logs:
        return False

    if should_skip_request_logging(path):
        return False

    if method.upper() == "OPTIONS":
        return False

    if settings.audit_all_requests:
        return True

    if status_code >= 400:
        return True

    if path.startswith("/api/auth"):
        return True

    if path.startswith("/api/invites"):
        return True

    if path.startswith("/api/internal"):
        return True

    if path.startswith("/api/workspace") and method in {
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
    }:
        return True

    if path.startswith("/api/properties") and method in {
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
    }:
        return True

    if path.startswith("/api/upload") and method in {
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
    }:
        return True

    if path.startswith("/api/notifications") and method in {
        "PATCH",
        "DELETE",
    }:
        return True

    if path.startswith("/api/recommendations") and method in {
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
    }:
        return True

    if path.startswith("/api/insights") and method in {
        "POST",
        "PATCH",
        "DELETE",
    }:
        return True

    return False


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    path = request.url.path
    request_id = getattr(request.state, "request_id", None)

    if not should_skip_request_logging(path):
        logger.info(
            "request_id=%s method=%s path=%s status_code=%s duration_ms=%s",
            request_id,
            request.method,
            path,
            response.status_code,
            duration_ms,
        )

    if should_audit_request(
        path,
        request.method,
        response.status_code,
    ):
        try:
            with Session(engine) as session:
                create_audit_log(
                    session=session,
                    request=request,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                )
        except Exception as exc:
            logger.warning("audit_log_failed request_id=%s error=%s", request_id, str(exc))

    return response


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs" if settings.enable_docs else None,
        "health": "/api/health",
        "ready": "/readyz",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "debug": settings.debug,
    }


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1")).one()

        return {
            "status": "ok",
            "database": "ok",
        }

    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "error",
                "detail": str(exc),
            },
        )


app.include_router(auth_router, prefix="/api")
app.include_router(property_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(pricing_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(workspace_router, prefix="/api")
app.include_router(invite_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(meta_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(internal_router, prefix="/api")
