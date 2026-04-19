"""Tests for the CORS config parser in main.py."""

import importlib
import sys


def _reload_main():
    # Clear cached module so Settings() re-reads env.
    if "main" in sys.modules:
        del sys.modules["main"]
    # Also reload app.config so Settings picks up fresh env.
    for mod in list(sys.modules):
        if mod == "app.config":
            del sys.modules[mod]
    return importlib.import_module("main")


def test_parse_allowed_origins_defaults():
    from main import _parse_allowed_origins

    out = _parse_allowed_origins("http://localhost:3000,http://localhost:8000")
    assert out == ["http://localhost:3000", "http://localhost:8000"]


def test_parse_allowed_origins_strips_whitespace():
    from main import _parse_allowed_origins

    out = _parse_allowed_origins(" http://a.com ,  http://b.com")
    assert out == ["http://a.com", "http://b.com"]


def test_parse_allowed_origins_drops_empty():
    from main import _parse_allowed_origins

    out = _parse_allowed_origins(",,http://a.com,,")
    assert out == ["http://a.com"]


def test_parse_allowed_origins_drops_wildcard():
    """Wildcard must never appear in the final list because we use credentials=True."""
    from main import _parse_allowed_origins

    assert _parse_allowed_origins("*") == []
    assert _parse_allowed_origins("*,http://a.com") == ["http://a.com"]


def test_parse_allowed_origins_empty_input():
    from main import _parse_allowed_origins

    assert _parse_allowed_origins("") == []
    assert _parse_allowed_origins(None) == []


def test_cors_middleware_has_non_wildcard_origins(monkeypatch):
    """Smoke test: when we import main, the CORS middleware isn't wildcard."""
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://example.com,http://foo.com")
    main = _reload_main()

    # Find the CORSMiddleware in the app's middleware stack.
    cors_mw = None
    for mw in main.app.user_middleware:
        if mw.cls.__name__ == "CORSMiddleware":
            cors_mw = mw
            break
    assert cors_mw is not None
    # kwargs for CORSMiddleware should include allow_origins with our parsed list.
    origins = cors_mw.kwargs.get("allow_origins")
    assert origins is not None
    assert "*" not in origins
    assert "http://example.com" in origins
    assert "http://foo.com" in origins


def test_image_helpers_are_importable():
    """After the rename, both new public names must be importable."""
    from app.services.image_service import build_image_prompt, download_image

    assert callable(build_image_prompt)
    assert callable(download_image)


def test_image_helpers_backwards_compatible_aliases():
    """Legacy _-prefixed names should still resolve to the new functions."""
    from app.services import image_service

    assert image_service._build_image_prompt is image_service.build_image_prompt
    assert image_service._download_image is image_service.download_image


def test_build_image_prompt_includes_feedback_when_given():
    from app.services.image_service import build_image_prompt

    prompt = build_image_prompt(
        copy="Hello world",
        platform="instagram",
        brand_name="Test",
        brand_description="A test brand",
        colors=["#fff"],
        visual_style=None,
        feedback="warmer tones, no people",
    )
    assert "warmer tones" in prompt
    assert "IMPORTANT ADJUSTMENTS" in prompt


def test_build_image_prompt_no_feedback_clause_when_omitted():
    from app.services.image_service import build_image_prompt

    prompt = build_image_prompt(
        copy="Hello world",
        platform="instagram",
        brand_name="Test",
        brand_description="A test brand",
        colors=["#fff"],
        visual_style=None,
    )
    assert "IMPORTANT ADJUSTMENTS" not in prompt
