from sqlmodel import SQLModel


class AppMeta(SQLModel):
    app_name: str
    app_version: str
    terms_version: str
    privacy_version: str
    docs_url: str
    health_url: str