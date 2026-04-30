"""Tests for the tone-promotion fix.

Background: founders set ``TONE = "playful, warm, witty, ..."`` in run.py
expecting the LLM to actually write in that tone. Previously this got
buried mid-prompt as ``BRAND TONE WORDS: {tone}`` — metadata label, not
prescriptive instruction. LLM weighted it lightly, output came out
corporate.

Fix: promote tone to top-of-prompt directive + system-prompt injection,
with concrete fail-state examples the LLM can self-check against.
"""

from app.prompts.copy_generation import (
    CREATOR_SYSTEM_PROMPT,
    _tone_directive,
    copy_prompt,
    regeneration_prompt,
)


# ---------- _tone_directive helper ----------


def test_tone_directive_empty_returns_empty():
    assert _tone_directive("") == ""
    assert _tone_directive("   ") == ""
    assert _tone_directive(None or "") == ""


def test_tone_directive_includes_tone_text():
    out = _tone_directive("playful, warm, witty")
    assert "playful, warm, witty" in out


def test_tone_directive_is_prescriptive_not_descriptive():
    """The directive must tell the LLM to WRITE in that tone, not just
    acknowledge it as metadata."""
    out = _tone_directive("sharp, direct")
    assert "match EVERY sentence" in out or "match every sentence" in out.lower()


def test_tone_directive_includes_concrete_fail_state():
    """Must give the LLM tangible things to self-check against. A
    'Deloitte report' or similar anchor is the target."""
    out = _tone_directive("playful, warm")
    # At least one of the concrete fail references should be present.
    lower = out.lower()
    assert any(
        anchor in lower
        for anchor in ("deloitte", "mckinsey", "corporate wellness")
    )


def test_tone_directive_includes_success_anchor():
    """Must also give a concrete positive target."""
    out = _tone_directive("playful, warm")
    lower = out.lower()
    assert "whatsapp" in lower or "friend" in lower


# ---------- Prompt positioning ----------


def test_tone_appears_before_brief_in_user_prompt():
    """Tone directive must come BEFORE the brand brief so the LLM sees
    it as a core instruction, not mid-prompt metadata."""
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="Pluto",
        brand_description="A social discovery app for Indian cities.",
        sample_content=["sample one"],
        tone="playful, warm, witty",
    )
    user = msgs[1]["content"]
    # Find positions of each marker in the prompt.
    tone_pos = user.find("REQUIRED TONE")
    brief_pos = user.find("BRAND BRIEF")
    banned_pos = user.find("BANNED WORDS")
    assert tone_pos != -1, "tone directive missing from prompt"
    assert brief_pos != -1, "brief missing from prompt"
    assert tone_pos < brief_pos, (
        f"tone (pos {tone_pos}) must precede brief (pos {brief_pos})"
    )
    # Tone also precedes banned words block.
    assert tone_pos < banned_pos


def test_tone_appears_in_system_prompt():
    """The system prompt gets a tone reminder so the persona itself
    inherits the vibe."""
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="Pluto",
        brand_description="d", sample_content=[],
        tone="playful, warm, witty",
    )
    system = msgs[0]["content"]
    # System prompt should now contain the tone string.
    assert "playful, warm, witty" in system
    # Core persona still present.
    assert CREATOR_SYSTEM_PROMPT in system


def test_no_tone_means_no_tone_directive():
    """Empty tone → no REQUIRED TONE block polluting the prompt."""
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[], tone="",
    )
    user = msgs[1]["content"]
    assert "REQUIRED TONE" not in user
    # System prompt unchanged when no tone.
    system = msgs[0]["content"]
    assert system == CREATOR_SYSTEM_PROMPT


def test_old_metadata_label_removed():
    """Old ``BRAND TONE WORDS: ...`` label should be gone; the new
    directive doesn't use that phrasing."""
    msgs = copy_prompt(
        platform="instagram", day_number=1, theme="t", hook="h",
        content_type="educational", voice_block="", brand_name="B",
        brand_description="d", sample_content=[], tone="playful",
    )
    user = msgs[1]["content"]
    assert "BRAND TONE WORDS:" not in user


# ---------- regeneration_prompt also gets the treatment ----------


def test_regeneration_prompt_promotes_tone_too():
    msgs = regeneration_prompt(
        platform="twitter",
        original_copy="bad original copy",
        feedback="too corporate",
        voice_block="",
        brand_name="Pluto",
        brand_description="d",
        sample_content=["sample one"],
        tone="playful, warm",
    )
    user = msgs[1]["content"]
    system = msgs[0]["content"]

    # Tone directive present in user message, before brief and banned words.
    assert "REQUIRED TONE" in user
    assert user.find("REQUIRED TONE") < user.find("BRAND BRIEF")
    assert user.find("REQUIRED TONE") < user.find("BANNED WORDS")

    # Tone echoed in system prompt.
    assert "playful, warm" in system


def test_regeneration_prompt_no_tone_no_directive():
    msgs = regeneration_prompt(
        platform="twitter",
        original_copy="bad", feedback="reasons",
        voice_block="", brand_name="B",
    )
    user = msgs[1]["content"]
    assert "REQUIRED TONE" not in user
