from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PricePilot"
    app_version: str = "2.0.0"
    debug: bool = True
    log_level: str = "INFO"

    rate_limit_enabled: bool = True

    database_url: str = "sqlite:///./pricepilot.db"
    redis_url: str = "redis://localhost:6379/0"

    openai_api_key: str = ""
    openai_model: str = "stepfun/step-3.5-flash:free"
    site_url: str = "http://localhost:8000"
    site_name: str = "PricePilot"

    upload_dir: str = "uploads"

    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
