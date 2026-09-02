from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

connect_args = {}

if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=settings.sql_echo,
    pool_pre_ping=True,
    connect_args=connect_args,
)


def get_session():
    with Session(engine) as session:
        yield session
