"""Tests for Block B-II prompt rewrites.

Covers:
- New banned-word categories (openers, generic CTAs, fake-stat intros)
- copy_prompt structure: grounding, samples, banned words, brief_too_thin
- regeneration_prompt structure
- strategy prompt platform-coverage default (full) vs opt-in rotation
"""

import pytest

from app.prompts.anti_slop import BANNED_WORD_CATEGORIES, BANNED_WORDS
from app.prompts.copy_generation import (
    BANNED_STRUCTURAL_PATTERNS,
    CREATOR_SYSTEM_PROMPT,
    _banned_words_block,
    _format_samples,
    copy_prompt,
    regeneration_prompt,
)
from app.prompts.strategy import calendar_strategy_prompt


# ---------- Banned word expansion -------------------------------------------


def test_new_categories_added():
    for cat in ("ai_openers", "generic_ctas", "fake_stat_intros"):
        assert cat in BANNED_WORD_CATEGORIES
        assert len(BANNED_WORD_CATEGORIES[cat]) >= 5


def test_ai_opener_examples_in_list():
    openers = BANNED_WORD_CATEGORIES["ai_openers"]
    assert any("we've all been there" in o.lower() for o in openers)
    assert any("what if i told you" in o.lower() for o in openers)
    assert any("let's talk about" in o.lower() for o in openers)


def test_generic_ctas_examples_in_list():
    ctas = BANNED_WORD_CATEGORIES["generic_ctas"]
    assert any("join the movement" in c.lower() for c in ctas)
    assert any("break the cycle" in c.lower() for c in ctas)


def test_fake_stat_intros_examples_in_list():
    stats = BANNED_WORD_CATEGORIES["fake_stat_intros"]
    assert any("studies show" in s.lower() for s in stats)
    assert any("a staggering" in s.lower() for s in stats)


def test_banned_words_contains_all_categories():
    for cat_name, words in BANNED_WORD_CATEGORIES.items():
        for w in words:
            assert w in BANNED_WORDS, f"{cat_name}/{w} missing from BANNED_WORDS"


# ---------- _format_samples helper ------------------------------------------


def test_format_samples_empty():
    out = _format_samples([])
    assert "no example posts" in out.lower()


def test_format_samples_numbered():
    out = _format_samples(["First post.", "Second post.", "Third."])
    assert "[1] First post." in out
    assert "[2] Second post." in out
    assert "[3] Third." in out


def test_format_samples_strips_whitespace():
    out = _format_samples(["  hello  \n"])
    assert "[1] hello" in out
    assert "  hello  " not in out


def test_format_samples_drops_blank_entries():
    out = _format_samples(["real", "", "   ", "also real"])
    # Only non-blank entries get numbered
    assert "[1] real" in out
    assert "[2] also real" in out
    assert "[3]" not in out


# ---------- _banned_words_block ---------------------------------------------


def test_banned_words_block_contains_quoted_items():
    block = _banned_words_block(limit=5)
    # Should produce quoted, comma-separated entries
    assert block.count('"') >= 10  # 5 words * 2 quotes each
    assert ", " in block


def test_banned_words_block_full_by_default():
    block = _banned_words_block()
    # Full list is well north of 100 items
    assert block.count(",") > 100


# ---------- copy_prompt structure -------------------------------------------


def test_copy_prompt_has_system_and_user():
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="Acme",
        brand_description="A test brand.",
        sample_content=["Example one.", "Example two."],
    )
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"
    assert msgs[0]["content"] == CREATOR_SYSTEM_PROMPT


def test_copy_prompt_user_contains_brand_brief():
    msgs = copy_prompt(
        platform="instagram", day_number=3, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="Acme",
        brand_description="Acme makes cold-processed skincare in Bangalore.",
        sample_content=["We ship from Koramangala."],
    )
    user = msgs[1]["content"]
    assert "Acme" in user
    assert "cold-processed skincare in Bangalore" in user
    assert "We ship from Koramangala." in user


def test_copy_prompt_injects_samples_as_few_shot():
    msgs = copy_prompt(
        platform="twitter", day_number=1, theme="t", hook="h",
        content_type="trend", voice_block="", brand_name="B",
        brand_description="desc",
        sample_content=[
            "Pluto isn't for people looking to collect options.",
            "Our feed is plans, not content to consume.",
        ],
    )
    user = msgs[1]["content"]
    assert "[1] Pluto isn't for people looking to collect options." in user
    assert "[2] Our feed is plans, not content to consume." in user


def test_copy_prompt_includes_banned_words_list():
    msgs = copy_prompt(
        platform="linkedin", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[],
    )
    user = msgs[1]["content"]
    assert "BANNED WORDS" in user
    # Spot-check: a few category samples should appear
    assert '"delve"' in user
    assert '"join the movement"' in user
    assert '"what if i told you"' in user or '"let\'s talk about"' in user


def test_copy_prompt_includes_structural_patterns():
    msgs = copy_prompt(
        platform="linkedin", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[],
    )
    user = msgs[1]["content"]
    # The static structural block is appended verbatim
    assert BANNED_STRUCTURAL_PATTERNS in user


def test_copy_prompt_forbids_day_reference_in_output():
    """Prompt must instruct LLM NOT to reference day numbers in copy."""
    msgs = copy_prompt(
        platform="instagram", day_number=17, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[],
    )
    user = msgs[1]["content"]
    assert "Do NOT reference day numbers" in user or "do not reference day" in user.lower()


def test_copy_prompt_requires_grounded_facts():
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[],
    )
    user = msgs[1]["content"]
    assert "grounded_facts" in user
    assert "brief_too_thin" in user


def test_copy_prompt_passes_additional_input_summary():
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="core brief text",
        sample_content=[],
        input_summary="supplementary blog post content",
    )
    user = msgs[1]["content"]
    assert "core brief text" in user
    assert "supplementary blog post content" in user


# ---------- regeneration_prompt ---------------------------------------------


def test_regeneration_prompt_includes_original_and_feedback():
    msgs = regeneration_prompt(
        platform="instagram",
        original_copy="Original copy that failed.",
        feedback="Too generic. Uses banned phrase 'join the movement'.",
        voice_block="",
        brand_name="B",
        brand_description="d",
        sample_content=["ex1"],
        tone="sharp",
    )
    user = msgs[1]["content"]
    assert "Original copy that failed." in user
    assert "Too generic" in user
    assert "join the movement" in user
    assert "[1] ex1" in user


def test_regeneration_prompt_includes_banned_words():
    msgs = regeneration_prompt(
        platform="twitter",
        original_copy="x", feedback="y", voice_block="", brand_name="B",
    )
    user = msgs[1]["content"]
    assert "BANNED WORDS" in user


# ---------- strategy prompt: platform coverage ------------------------------


def test_strategy_default_full_platform_coverage():
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram", "twitter", "linkedin"],
        industry="d2c", num_days=3,
    )
    user = msgs[1]["content"]
    # Default: all platforms every day
    assert "ALL of these platforms" in user
    # No "rotate" language in default
    assert "rotate" not in user.lower() or "rotate them" not in user.lower()


def test_strategy_explicit_rotation():
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram", "twitter"],
        industry="d2c", num_days=30,
        rotate_platforms=True,
    )
    user = msgs[1]["content"]
    assert "rotate" in user.lower()
    assert "ALL of these platforms" not in user


def test_strategy_num_days_enforced_in_prompt():
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram"], industry="d2c", num_days=7,
    )
    user = msgs[1]["content"]
    assert "EXACTLY 7 days" in user


# ---------- LLM factory: provider routing -----------------------------------


def test_llm_factory_resolves_per_role_providers(monkeypatch):
    from app.config import Settings
    from app.utils.llm_factory import _resolve_provider

    s = Settings(
        creator_provider="gemini",
        validator_provider="claude",
        gemini_api_key="gk",
        anthropic_api_key="ak",
    )
    assert _resolve_provider(s, "creator") == "gemini"
    assert _resolve_provider(s, "validator") == "claude"


def test_llm_factory_falls_back_to_legacy_llm_provider():
    from app.config import Settings
    from app.utils.llm_factory import _resolve_provider

    # No per-role config; legacy llm_provider should win.
    s = Settings(
        creator_provider="",
        validator_provider="",
        llm_provider="claude",
        anthropic_api_key="ak",
    )
    assert _resolve_provider(s, "creator") == "claude"
    assert _resolve_provider(s, "validator") == "claude"


def test_llm_factory_returns_right_client_class():
    from app.config import Settings
    from app.utils.llm_factory import get_llm_client
    from app.utils.anthropic_client import AnthropicClient
    from app.utils.gemini_client import GeminiClient

    s = Settings(
        creator_provider="gemini",
        validator_provider="claude",
        gemini_api_key="gk",
        anthropic_api_key="ak",
    )
    creator = get_llm_client(s, "creator")
    validator = get_llm_client(s, "validator")
    assert isinstance(creator, GeminiClient)
    assert isinstance(validator, AnthropicClient)


def test_llm_factory_falls_back_when_key_missing():
    """If creator_provider=gemini but no gemini key, fall back to claude."""
    from app.config import Settings
    from app.utils.llm_factory import get_llm_client
    from app.utils.anthropic_client import AnthropicClient

    s = Settings(
        creator_provider="gemini",
        gemini_api_key="",      # no key
        anthropic_api_key="ak",  # has this one
    )
    client = get_llm_client(s, "creator")
    assert isinstance(client, AnthropicClient)


def test_llm_factory_model_names():
    from app.config import Settings
    from app.utils.llm_factory import get_model_name

    s = Settings(
        creator_provider="gemini",
        validator_provider="claude",
        gemini_api_key="gk",
        anthropic_api_key="ak",
        gemini_model_creator="gemini-2.5-pro",
        claude_model_validator="claude-haiku-4-5-20251001",
    )
    assert get_model_name(s, "creator") == "gemini-2.5-pro"
    assert get_model_name(s, "validator") == "claude-haiku-4-5-20251001"


# ---------- Gemini client: message conversion -------------------------------


def test_gemini_to_contents_splits_system():
    from app.utils.gemini_client import GeminiClient

    messages = [
        {"role": "system", "content": "you are a writer"},
        {"role": "user", "content": "write a post"},
    ]
    system, contents = GeminiClient._to_gemini_contents(messages)
    assert system == "you are a writer"
    assert len(contents) == 1
    assert contents[0]["role"] == "user"
    assert contents[0]["parts"][0]["text"] == "write a post"


def test_gemini_merges_multiple_system_messages():
    from app.utils.gemini_client import GeminiClient

    messages = [
        {"role": "system", "content": "rule 1"},
        {"role": "system", "content": "rule 2"},
        {"role": "user", "content": "hi"},
    ]
    system, contents = GeminiClient._to_gemini_contents(messages)
    assert "rule 1" in system
    assert "rule 2" in system


def test_gemini_converts_assistant_to_model_role():
    from app.utils.gemini_client import GeminiClient

    messages = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    _, contents = GeminiClient._to_gemini_contents(messages)
    assert contents[0]["role"] == "user"
    assert contents[1]["role"] == "model"
