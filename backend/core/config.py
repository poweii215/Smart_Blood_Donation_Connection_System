import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str = os.getenv("JWT_SECRET", "sbdcs-super-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    PORT: int = 8000

settings = Settings()
