from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Averlen"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    testing: bool = False
    enable_docs: bool = True
    sql_echo: bool = False
    audit_all_requests: bool = False
    disable_audit_logs: bool = False

    rate_limit_enabled: bool = True
    admin_emails: str = ""

    terms_version: str = "2026-05-13"
    privacy_version: str = "2026-05-13"

    invite_expire_hours: int = 168

    database_url: str = "sqlite:///./averlen.db"
    redis_url: str = "redis://localhost:6379/0"

    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    openrouter_api_key: str = ""
    openrouter_model: str = "stepfun/step-3.5-flash:free"
    site_url: str = "http://localhost:8000"
    site_name: str = "Averlen"

    ai_question_max_chars: int = 500
    ai_max_context_chars: int = 5000
    ai_llm_timeout_seconds: int = 20
    ai_daily_user_limit: int = 50
    ai_daily_org_limit: int = 200

    media_storage_backend: str = "local"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_folder: str = "averlen"
    media_upload_timeout_seconds: int = 15

    # Legacy upload_dir fallback; booking CSVs stay private.
    upload_dir: str = "uploads"
    private_upload_dir: str = ""
    public_upload_dir: str = "uploads/property_photos"
    public_avatar_upload_dir: str = "uploads/user_avatars"
    max_upload_size_mb: int = 5
    max_csv_rows: int = 10000
    max_csv_columns: int = 100
    csv_preview_rows: int = 5
    upload_session_expire_minutes: int = 60

    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    refresh_token_expire_days: int = 7
    refresh_cookie_name: str = "averlen_refresh_token"
    refresh_cookie_secure: bool = False
    refresh_cookie_samesite: str = "lax"
    refresh_cookie_path: str = "/api/auth"

    bcrypt_rounds: int = 12

    @field_validator("media_storage_backend")
    @classmethod
    def validate_media_storage_backend(cls, value: str) -> str:
        normalized = value.strip().lower()

        if normalized not in {"local", "cloudinary"}:
            raise ValueError(
                "MEDIA_STORAGE_BACKEND must be local or cloudinary"
            )

        return normalized

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)

        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)

        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()