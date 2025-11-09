from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache
import json


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "Sound CU Co-Pilot API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/v1"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    ASYNC_DATABASE_URL: str
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - can be string or list
    ALLOWED_ORIGINS: str = '["http://localhost:3000","http://localhost:5173","chrome-extension://*"]'
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    ENABLE_RATE_LIMITING: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # ML Configuration
    RECOMMENDATION_MODEL_PATH: str = "./models/recommendation_model.pkl"
    MIN_RECOMMENDATIONS: int = 3
    MAX_RECOMMENDATIONS: int = 5
    ENABLE_ML_RECOMMENDATIONS: bool = True
    
    # Feature Flags
    ENABLE_ANALYTICS: bool = True
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into a list."""
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        try:
            # Try parsing as JSON
            return json.loads(self.ALLOWED_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            # Fallback: split by comma
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()