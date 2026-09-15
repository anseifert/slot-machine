from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def migrate_db() -> None:
    from sqlalchemy import text

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE spins ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE spins DROP CONSTRAINT IF EXISTS spins_email_key"))
