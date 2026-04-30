"""Tests for the strategy-schema coercion + strictness fix.

Covers the bug found in Pluto pipeline run:
- Gemini returned ``platforms: [{"platform": "instagram", "post_copy": ...}]``
  instead of ``platforms: ["instagram", ...]``.
- Downstream code treated each dict as a string → produced 0 pieces.
- Fix: prompt now explicitly forbids dict-shaped platforms + downstream
  coerces dicts → strings defensively + fails loudly on empty calendar.
"""

import asyncio
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.base import Base
from app.models.brand import Brand
from app.models.generation_job import GenerationJob
from app.prompts.strategy import calendar_strategy_prompt
from app.services.creator_service import _strategy_step


# ---------- Prompt strictness ----------


def test_strategy_prompt_forbids_post_copy():
    """Prompt must tell the LLM not to write copy at the strategy step."""
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram"], industry="d2c", num_days=1,
    )
    user = msgs[1]["content"]
    # Either phrasing should match the instruction.
    assert "Do NOT write the actual post copy" in user or "only planning" in user.lower()


def test_strategy_prompt_specifies_platforms_as_strings():
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram"], industry="d2c", num_days=1,
    )
    user = msgs[1]["content"]
    assert "array of STRINGS" in user or "array of STRING platform names" in user
    # Also should explicitly ban the object-shaped form as an anti-example
    assert "NOT an array of objects" in user


def test_strategy_prompt_bans_per_post_content_fields():
    msgs = calendar_strategy_prompt(
        brand_name="B", brand_description="d", voice_block="",
        input_type="text", input_data="seed",
        platforms=["instagram"], industry="d2c", num_days=1,
    )
    user = msgs[1]["content"]
    # Explicit list of things the strategy step should NOT emit
    assert "post_copy" in user
    assert "creative_suggestion" in user


# ---------- Defensive coercion in _strategy_step ----------


class _FakeLLM:
    """Tiny LLM stub so we can drive _strategy_step with a canned response."""

    def __init__(self, canned_response):
        self.canned = canned_response
        self.calls = 0

    async def chat_json(self, **kwargs):
        self.calls += 1
        return self.canned

    async def close(self):
        pass


@pytest_asyncio.fixture
async def session_factory_with_job():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as db:
        brand = Brand(
            id=str(uuid4()),
            name="Acme",
            description="A test brand",
            sample_content=[],
        )
        db.add(brand)
        await db.flush()
        job = GenerationJob(
            id=str(uuid4()),
            brand_id=brand.id,
            input_type="text",
            input_data="seed",
            status="pending",
            platforms=["instagram", "twitter"],
            num_days=2,
        )
        db.add(job)
        await db.commit()
        job_id = job.id

    yield factory, job_id
    await engine.dispose()


class _FakeSettings:
    """Minimal settings stand-in for get_model_name call."""
    creator_provider = "gemini"
    validator_provider = "claude"
    llm_provider = "gemini"
    gemini_api_key = "fake"
    gemini_model_creator = "gemini-2.5-pro"
    gemini_model_validator = "gemini-2.5-flash"
    anthropic_api_key = ""
    claude_model_creator = ""
    claude_model_validator = ""
    groq_api_key = ""
    groq_model_creator = ""
    groq_model_validator = ""


@pytest.mark.asyncio
async def test_strategy_coerces_dict_platforms_to_strings(session_factory_with_job):
    """If LLM returns platforms as dicts (Gemini over-helpfulness), coerce to strings."""
    factory, job_id = session_factory_with_job

    # Simulate Gemini's over-rich response shape
    canned = {
        "days": [
            {
                "day": 1,
                "theme": "kickoff",
                "hook": "test hook",
                "content_type": "educational",
                "platforms": [
                    {"platform": "instagram", "post_copy": "don't care"},
                    {"platform": "twitter", "post_copy": "also don't care"},
                ],
            },
        ]
    }
    llm = _FakeLLM(canned)

    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())

    assert len(calendar) == 1
    day = calendar[0]
    # Coercion happened: platforms is now a list of strings.
    assert day["platforms"] == ["instagram", "twitter"]
    assert all(isinstance(p, str) for p in day["platforms"])


@pytest.mark.asyncio
async def test_strategy_string_platforms_passthrough(session_factory_with_job):
    """Correct-shape response (strings) should pass through untouched."""
    factory, job_id = session_factory_with_job

    canned = {
        "days": [
            {
                "day": 1,
                "theme": "x",
                "hook": "y",
                "content_type": "educational",
                "platforms": ["instagram", "twitter"],
            }
        ]
    }
    llm = _FakeLLM(canned)

    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())
    assert calendar[0]["platforms"] == ["instagram", "twitter"]


@pytest.mark.asyncio
async def test_strategy_empty_calendar_fails_loudly(session_factory_with_job):
    """Empty ``days`` must mark job failed, not silently proceed."""
    factory, job_id = session_factory_with_job

    llm = _FakeLLM({"days": []})

    with pytest.raises(RuntimeError, match="empty calendar"):
        await _strategy_step(job_id, factory, llm, _FakeSettings())

    # Job row should be marked failed
    async with factory() as db:
        job = await db.get(GenerationJob, job_id)
        assert job.status == "failed"
        assert "empty" in (job.error_message or "").lower()


@pytest.mark.asyncio
async def test_strategy_no_days_key_fails_loudly(session_factory_with_job):
    """Response with no ``days`` key at all should also fail loudly."""
    factory, job_id = session_factory_with_job

    llm = _FakeLLM({"some_other_key": "garbage"})

    with pytest.raises(RuntimeError, match="empty calendar"):
        await _strategy_step(job_id, factory, llm, _FakeSettings())


@pytest.mark.asyncio
async def test_strategy_partial_dict_with_name_field(session_factory_with_job):
    """Some LLMs use ``name`` instead of ``platform`` — accept either."""
    factory, job_id = session_factory_with_job

    canned = {
        "days": [
            {
                "day": 1,
                "theme": "x", "hook": "y", "content_type": "educational",
                "platforms": [
                    {"name": "instagram"},
                    {"name": "twitter"},
                ],
            }
        ]
    }
    llm = _FakeLLM(canned)
    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())
    assert calendar[0]["platforms"] == ["instagram", "twitter"]


@pytest.mark.asyncio
async def test_strategy_mixed_good_bad_entries(session_factory_with_job):
    """Dict platforms missing ``platform`` or ``name`` should be dropped silently."""
    factory, job_id = session_factory_with_job

    canned = {
        "days": [
            {
                "day": 1,
                "theme": "x", "hook": "y", "content_type": "educational",
                "platforms": [
                    {"platform": "instagram", "post_copy": "ok"},
                    {"weird_key": "no platform name here"},  # dropped
                    {"platform": "TWITTER"},                 # kept, lowercased
                ],
            }
        ]
    }
    llm = _FakeLLM(canned)
    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())
    assert calendar[0]["platforms"] == ["instagram", "twitter"]


@pytest.mark.asyncio
async def test_strategy_coerces_dict_keyed_platforms(session_factory_with_job):
    """Third Gemini shape: platforms as a dict keyed by platform name.

    Real example captured from debug_gemini.py run:
      "platforms": {
        "instagram": {"post_type": "Carousel", "content": "..."},
        "twitter":   {"post_type": "Tweet", "content": "..."},
        "linkedin":  {"post_type": "Poll", "content": "..."},
      }
    """
    factory, job_id = session_factory_with_job

    canned = {
        "days": [
            {
                "day": 1,
                "theme": "x", "hook": "y", "content_type": "engagement",
                "platforms": {
                    "instagram": {
                        "post_type": "Carousel Post",
                        "content": "emoji weekend plan prompt",
                        "cta": "Comment with your emojis.",
                    },
                    "twitter": {
                        "post_type": "Tweet",
                        "content": "wrong answers only",
                        "cta": "Reply with something funny.",
                    },
                    "LINKEDIN": {
                        "post_type": "Poll",
                        "content": "what builds real bonds?",
                    },
                },
            }
        ]
    }
    llm = _FakeLLM(canned)
    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())
    # All three keys coerced to lowercase strings, dicts discarded.
    assert set(calendar[0]["platforms"]) == {"instagram", "twitter", "linkedin"}
    assert all(isinstance(p, str) for p in calendar[0]["platforms"])


@pytest.mark.asyncio
async def test_strategy_null_platforms_defaults_empty(session_factory_with_job):
    """None / null platforms should default to [] and not crash downstream."""
    factory, job_id = session_factory_with_job

    canned = {
        "days": [
            {
                "day": 1, "theme": "x", "hook": "y",
                "content_type": "educational",
                "platforms": None,
            }
        ]
    }
    llm = _FakeLLM(canned)
    calendar = await _strategy_step(job_id, factory, llm, _FakeSettings())
    assert calendar[0]["platforms"] == []
