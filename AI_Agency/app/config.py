from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database — defaults to local SQLite (no external DB needed)
    # Set DATABASE_URL in .env to use PostgreSQL, or set individual DB_* vars.
    database_url: str = ""

    db_user: str = ""
    db_password: str = ""
    db_host: str = ""
    db_port: str = "5432"
    db_name: str = ""

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        if self.db_host and self.db_user:
            return (
                f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
            )
        return "sqlite+aiosqlite:///./content_engine.db"

    # Groq LLM
    groq_api_key: str = ""
    groq_model_creator: str = "llama-3.1-8b-instant"
    groq_model_validator: str = "llama-3.1-8b-instant"

    # Anthropic Claude
    anthropic_api_key: str = ""
    claude_model_creator: str = "claude-sonnet-4-5-20250929"
    claude_model_validator: str = "claude-haiku-4-5-20251001"

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model_creator: str = "gemini-2.5-pro"
    gemini_model_validator: str = "gemini-2.5-flash"

    # LLM provider routing.
    # Legacy: ``llm_provider`` is a single fallback for both roles.
    # Preferred (Block B-II): per-role providers so creator and
    # validator run on different model families (avoids validator-
    # collusion bias).
    llm_provider: str = "claude"
    creator_provider: str = "gemini"       # default: Gemini 2.5 Pro
    validator_provider: str = "claude"     # default: Claude Haiku 4.5

    # OpenAI (for vision/style extraction)
    openai_api_key: str = ""

    # Replicate (image generation)
    replicate_api_token: str = ""

    # Google Drive
    google_credentials_path: str = ""
    google_drive_root_folder_id: str = ""

    # Notion
    notion_token: str = ""
    notion_page_id: str = ""

    # CORS — comma-separated list of allowed origins, or "*" to allow all
    # (NOTE: "*" with credentials is disallowed by browsers and insecure;
    # keep defaults to localhost dev ports).
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"

    # Generation settings
    max_validation_loops: int = 3
    min_quality_score: float = 0.8
    max_concurrent_llm_calls: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
