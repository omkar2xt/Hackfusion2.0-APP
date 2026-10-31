import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SignalSafe Campus API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Allowed CORS Origins for development and production
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,"
        "http://10.10.9.33:5173,http://192.168.56.1:5173"
    )

    # Database configuration
    # Can be set via environment variable: DATABASE_URL, SUPABASE_DATABASE_URL, or INTERNAL_DATABASE_URL
    DATABASE_URL: Optional[str] = None
    SUPABASE_DATABASE_URL: Optional[str] = None
    INTERNAL_DATABASE_URL: Optional[str] = None
    POSTGRES_URL: Optional[str] = None

    @property
    def default_sqlite_url(self) -> str:
        _backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        _default_db_path = os.path.join(_backend_dir, "signalsafe.db").replace("\\", "/")
        return f"sqlite:///{_default_db_path}"

    # Supabase optional integration
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Threat Intelligence Key
    THREAT_INTELLIGENCE_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.ALLOWED_ORIGINS.split(",") if orig.strip()]
        # Allow custom production domains from environment
        return origins


settings = Settings()
