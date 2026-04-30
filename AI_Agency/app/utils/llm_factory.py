"""LLM factory — routes role (creator | validator) to the right provider.

Block B-II introduces per-role provider config. The default split is:

  - Creator  → Gemini 2.5 Pro    (sharper, more opinionated voice)
  - Validator → Claude Haiku 4.5 (strict, cheap, DIFFERENT model family
                                  so it catches Gemini's tells)

This avoids the validator-collusion bias where the same family
rubber-stamps its own slop.

Config:
  creator_provider  = "gemini" | "claude" | "groq"
  validator_provider = "claude" | "gemini" | "groq"
  gemini_api_key, anthropic_api_key, groq_api_key
  gemini_model_creator / validator
  claude_model_creator / validator
  groq_model_creator / validator

Back-compat: if only ``llm_provider`` is set (old single-provider config),
fall back to it for both roles.
"""

from app.config import Settings
from app.utils.anthropic_client import AnthropicClient
from app.utils.gemini_client import GeminiClient
from app.utils.groq_client import GroqClient


def _resolve_provider(settings: Settings, role: str) -> str:
    """Pick the provider for a role, honoring new + legacy config."""
    if role == "creator":
        explicit = getattr(settings, "creator_provider", "") or ""
    else:
        explicit = getattr(settings, "validator_provider", "") or ""

    if explicit:
        return explicit
    # Back-compat with the old single-provider setting.
    return settings.llm_provider or "claude"


def get_llm_client(settings: Settings, role: str = "creator"):
    """Return an LLM client for the given role.

    Falls back gracefully if the requested provider's API key is
    missing — caller should check settings before assuming a role
    actually works.
    """
    provider = _resolve_provider(settings, role)

    if provider == "gemini" and settings.gemini_api_key:
        return GeminiClient(settings.gemini_api_key)

    if provider == "claude" and settings.anthropic_api_key:
        return AnthropicClient(settings.anthropic_api_key)

    if provider == "groq" and settings.groq_api_key:
        return GroqClient(settings.groq_api_key)

    # Fallback chain: Claude → Gemini → Groq.
    if settings.anthropic_api_key:
        return AnthropicClient(settings.anthropic_api_key)
    if settings.gemini_api_key:
        return GeminiClient(settings.gemini_api_key)
    return GroqClient(settings.groq_api_key)


def get_model_name(settings: Settings, role: str = "creator") -> str:
    """Return the model name for the resolved (provider, role) pair."""
    provider = _resolve_provider(settings, role)

    if provider == "gemini" and settings.gemini_api_key:
        return (
            settings.gemini_model_creator if role == "creator"
            else settings.gemini_model_validator
        )

    if provider == "claude" and settings.anthropic_api_key:
        return (
            settings.claude_model_creator if role == "creator"
            else settings.claude_model_validator
        )

    if provider == "groq" and settings.groq_api_key:
        return (
            settings.groq_model_creator if role == "creator"
            else settings.groq_model_validator
        )

    # Mirror the client fallback chain.
    if settings.anthropic_api_key:
        return (
            settings.claude_model_creator if role == "creator"
            else settings.claude_model_validator
        )
    if settings.gemini_api_key:
        return (
            settings.gemini_model_creator if role == "creator"
            else settings.gemini_model_validator
        )
    return (
        settings.groq_model_creator if role == "creator"
        else settings.groq_model_validator
    )
