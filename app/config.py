from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def build_database_url(user: str, password: str, host: str, port: int, db: str) -> str:
    return (
        f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{quote_plus(db)}"
    )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_port: int = 5555

    postgres_user: str = "slotmachine"
    postgres_password: str = "slotmachine"
    postgres_db: str = "slotmachine"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    database_url: str = ""

    admin_username: str = "admin"
    admin_password: str = "admin"
    admin_session_secret: str = "dev-secret-change-me"

    golf_ball_max: int = 30
    hat_max: int = 30
    total_odds_weight: int = 700
    golf_ball_odds: int = 30
    hat_odds: int = 30

    @model_validator(mode="after")
    def assemble_database_url(self) -> "Settings":
        object.__setattr__(
            self,
            "database_url",
            build_database_url(
                self.postgres_user,
                self.postgres_password,
                self.postgres_host,
                self.postgres_port,
                self.postgres_db,
            ),
        )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
