from sqlmodel import Session, create_engine

from app.core.config import settings

DATABASE_URL = settings.database_url

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=settings.debug,
    connect_args=connect_args,
)


def get_session():
    with Session(engine) as session:
        yield session
