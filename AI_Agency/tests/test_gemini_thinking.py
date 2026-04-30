"""Tests for Gemini thinking-mode disabling and MAX_TOKENS error handling.

Background: Gemini 2.5 Pro spends its maxOutputTokens budget on internal
reasoning before emitting the actual response, yielding empty output
with finishReason=MAX_TOKENS. We disable thinking via
``thinkingConfig.thinkingBudget=0`` on 2.5-series models.
"""

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.utils.gemini_client import GeminiClient


def _mock_response(status_code: int, payload: dict) -> httpx.Response:
    request = httpx.Request("POST", "https://example.com")
    return httpx.Response(
        status_code=status_code,
        content=json.dumps(payload).encode(),
        headers={"content-type": "application/json"},
        request=request,
    )


# ---------- thinkingConfig injection ----------


@pytest.mark.asyncio
async def test_thinking_disabled_for_gemini_2_5_pro():
    client = GeminiClient("fake-key")
    captured_payload = {}

    async def fake_post(url, json=None):
        captured_payload["value"] = json
        return _mock_response(200, {
            "candidates": [
                {"content": {"parts": [{"text": "hi"}]}}
            ]
        })

    with patch.object(client.client, "post", side_effect=fake_post):
        out = await client.chat(
            model="gemini-2.5-pro",
            messages=[{"role": "user", "content": "hi"}],
        )

    assert out == "hi"
    cfg = captured_payload["value"]["generationConfig"]
    assert "thinkingConfig" in cfg
    assert cfg["thinkingConfig"]["thinkingBudget"] == 0

    await client.close()


@pytest.mark.asyncio
async def test_thinking_disabled_for_gemini_2_5_flash():
    client = GeminiClient("fake-key")
    captured_payload = {}

    async def fake_post(url, json=None):
        captured_payload["value"] = json
        return _mock_response(200, {
            "candidates": [
                {"content": {"parts": [{"text": "hi"}]}}
            ]
        })

    with patch.object(client.client, "post", side_effect=fake_post):
        await client.chat(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": "hi"}],
        )

    cfg = captured_payload["value"]["generationConfig"]
    assert cfg["thinkingConfig"]["thinkingBudget"] == 0

    await client.close()


@pytest.mark.asyncio
async def test_thinking_not_set_for_older_gemini_models():
    """1.5 and earlier don't support thinkingConfig. Don't send it."""
    client = GeminiClient("fake-key")
    captured_payload = {}

    async def fake_post(url, json=None):
        captured_payload["value"] = json
        return _mock_response(200, {
            "candidates": [
                {"content": {"parts": [{"text": "hi"}]}}
            ]
        })

    with patch.object(client.client, "post", side_effect=fake_post):
        await client.chat(
            model="gemini-1.5-pro",
            messages=[{"role": "user", "content": "hi"}],
        )

    cfg = captured_payload["value"]["generationConfig"]
    assert "thinkingConfig" not in cfg

    await client.close()


# ---------- MAX_TOKENS empty-output error message ----------


@pytest.mark.asyncio
async def test_max_tokens_empty_output_raises_actionable_error():
    """When Gemini returns empty parts with finishReason=MAX_TOKENS, the
    error message should be diagnostic (tells user to bump max_tokens
    or disable thinking)."""
    client = GeminiClient("fake-key")

    async def fake_post(url, json=None):
        return _mock_response(200, {
            "candidates": [
                {
                    "content": {"role": "model"},  # no 'parts' key
                    "finishReason": "MAX_TOKENS",
                    "index": 0,
                }
            ]
        })

    with patch.object(client.client, "post", side_effect=fake_post):
        with pytest.raises(RuntimeError, match="MAX_TOKENS"):
            await client.chat(
                model="gemini-2.5-pro",
                messages=[{"role": "user", "content": "x"}],
                max_tokens=1024,
            )

    await client.close()


@pytest.mark.asyncio
async def test_non_max_tokens_empty_output_still_raises():
    """Empty parts with a different finishReason should still raise,
    with the reason surfaced for debugging."""
    client = GeminiClient("fake-key")

    async def fake_post(url, json=None):
        return _mock_response(200, {
            "candidates": [
                {
                    "content": {"role": "model"},
                    "finishReason": "SAFETY",
                    "index": 0,
                }
            ]
        })

    with patch.object(client.client, "post", side_effect=fake_post):
        with pytest.raises(RuntimeError, match="SAFETY"):
            await client.chat(
                model="gemini-2.5-flash",
                messages=[{"role": "user", "content": "x"}],
            )

    await client.close()


# ---------- Config defaults ----------


def test_default_gemini_creator_model_is_flash():
    """Block B-II default changed from Pro → Flash after MAX_TOKENS
    bug surfaced in Pluto pipeline run."""
    from app.config import Settings
    s = Settings(
        # Need to ensure no .env overrides leak in
        gemini_api_key="test",
        gemini_model_creator="",  # let the default apply
    )
    # Pull the class default directly since Settings() reads from env.
    assert Settings.model_fields["gemini_model_creator"].default == "gemini-2.5-flash"
