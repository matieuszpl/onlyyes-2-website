import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/db_name")
    celery_broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    secret_key: str = os.getenv("SECRET_KEY", "secret-key-change-in-production")
    discord_client_id: str = os.getenv("DISCORD_CLIENT_ID", "")
    discord_client_secret: str = os.getenv("DISCORD_CLIENT_SECRET", "")
    app_base_url: str = os.getenv("APP_BASE_URL", "http://localhost:9523")
    azuracast_url: str = os.getenv("AZURACAST_API_URL", os.getenv("AZURACAST_URL", ""))
    azuracast_api_key: str = os.getenv("AZURACAST_API_KEY", "")
    azuracast_station_id: str = os.getenv("AZURACAST_STATION_ID", "1")
    azuracast_stream_url: str = os.getenv("AZURACAST_STREAM_URL", "")
    
    class Config:
        env_file = ".env"

settings = Settings()

