from fastapi import APIRouter

from app.core.config import settings
from app.schemas.meta import AppMeta

router = APIRouter(prefix="/meta", tags=["Meta"])


@router.get("", response_model=AppMeta)
def get_app_meta():
    return AppMeta(
        app_name=settings.app_name,
        app_version=settings.app_version,
        terms_version=settings.terms_version,
        privacy_version=settings.privacy_version,
        docs_url="/docs",
        health_url="/api/health",
    )