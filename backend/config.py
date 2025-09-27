from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    APP_NAME: str = "PowerPulse"
    APP_ENV: str = "dev"
    DATABASE_URL: str = "sqlite+aiosqlite:///./powerpulse.db"
    CORS_ORIGINS: List[str] = ["*"]  # use JSON array in .env

settings = Settings()
