import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "L.I.N.K. (Logistics Intelligence Network Kernel)"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Neo4j Settings
    NEO4J_URI: str = os.getenv("NEO4J_URI", "neo4j+s://your-db-id.databases.neo4j.io")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    NEO4J_DATABASE: str = os.getenv("NEO4J_DATABASE", "neo4j")

    # Server Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
