from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    app_name: str = Field(default="Incubyte Salary Management API", validation_alias="APP_NAME")
    environment: str = Field(default="development", validation_alias="APP_ENVIRONMENT")
    database_url: str = "postgresql+psycopg://incubyte:incubyte@localhost:5432/incubyte"
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
