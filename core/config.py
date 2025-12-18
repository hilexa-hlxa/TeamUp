from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "dev"
    DB_URL: str = ""
    DATABASE_URL: str = ""  # Render provides this
    SQLITE_DB_PATH: str = "teamup_backup.db"  # SQLite fallback database
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_TTL_MIN: int = 30
    REFRESH_TTL_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"  # Для продакшена добавьте адрес вашего frontend сервера через запятую

    # pydantic v2 settings config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert Render's postgresql:// to postgresql+psycopg://
        if not self.DB_URL and self.DATABASE_URL:
            self.DB_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
        elif self.DB_URL and self.DB_URL.startswith("postgresql://") and "+psycopg" not in self.DB_URL:
            self.DB_URL = self.DB_URL.replace("postgresql://", "postgresql+psycopg://")
    
    @property
    def sqlite_url(self) -> str:
        """Get SQLite database URL"""
        return f"sqlite:///{self.SQLITE_DB_PATH}"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        
        # In development, allow all local network IPs (192.168.x.x, 10.x.x.x, etc.)
        if self.APP_ENV == "dev":
            # Add wildcard pattern for local network development
            # This allows any IP on local network to access the API
            origins.append("http://*:5173")
            origins.append("http://*:5174")
            # Also allow all origins in dev mode for easier testing
            # But we'll use a more specific approach below
        
        return origins


settings = Settings()
