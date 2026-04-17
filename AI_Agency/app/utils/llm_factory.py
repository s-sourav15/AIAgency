from app.config import Settings
from app.utils.groq_client import GroqClient
from app.utils.anthropic_client import AnthropicClient


def get_llm_client(settings: Settings, role: str = "creator"):
    """Return the appropriate LLM client based on config.

    role: 'creator' or 'validator'
    """
    if settings.llm_provider == "claude" and settings.anthropic_api_key:
        return AnthropicClient(settings.anthropic_api_key)
    return GroqClient(settings.groq_api_key)


def get_model_name(settings: Settings, role: str = "creator") -> str:
    """Return the model name for the given role and provider."""
    if settings.llm_provider == "claude" and settings.anthropic_api_key:
        return settings.claude_model_creator if role == "creator" else settings.claude_model_validator
    return settings.groq_model_creator if role == "creator" else settings.groq_model_validator
