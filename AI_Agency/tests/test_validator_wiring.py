"""Regression: validator_service must propagate brand context to regen.

The Block B-II PR added brand_description / brand_sample_content / brand_tone
loading in the outer validate_job function, but the inner
_validate_and_regen didn't receive them. Call sites inside the regen
path referenced ``brand_description`` as a free variable, causing
``NameError: name 'brand_description' is not defined`` for every piece
that tripped a regen attempt.

This test locks the function signatures so the wiring stays connected.
"""

import inspect

from app.services.validator_service import _validate_and_regen, validate_job


def test_validate_and_regen_accepts_brand_context_kwargs():
    """The regen helper must take brand_description, brand_sample_content,
    and brand_tone — these get passed to regeneration_prompt and raising
    NameError from inside the helper is the exact failure we are
    preventing."""
    sig = inspect.signature(_validate_and_regen)
    params = set(sig.parameters.keys())

    for required in (
        "brand_description",
        "brand_sample_content",
        "brand_tone",
    ):
        assert required in params, (
            f"_validate_and_regen missing '{required}' parameter — "
            f"this is the Block B-II plumbing regression."
        )


def test_validate_and_regen_signature_complete():
    """Full signature for _validate_and_regen as of Block B-II."""
    sig = inspect.signature(_validate_and_regen)
    params = list(sig.parameters.keys())

    # Note: "piece_id" must be first (keyword-or-positional), rest are
    # threaded from validate_job's context.
    expected = {
        "piece_id",
        "brand_name",
        "voice_profile",
        "brand_description",
        "brand_sample_content",
        "brand_tone",
        "session_factory",
        "llm",
        "settings",
    }
    assert set(params) == expected, f"signature drift: {set(params)} vs {expected}"


def test_validate_job_loads_all_brand_context():
    """validate_job must materialise all fields _validate_and_regen expects.

    We can't easily execute validate_job without a DB, but we can confirm
    the inner closure references match the outer variable names by
    grepping the source — cheap but catches the class of bug that
    happened in PR #10.
    """
    source = inspect.getsource(validate_job)
    # These locals must be assigned in validate_job before calling
    # the inner helper.
    for var in ("brand_description", "brand_sample_content", "brand_tone"):
        assert f"{var} = brand" in source or f"{var} =" in source, (
            f"validate_job doesn't appear to assign '{var}' — "
            f"_validate_and_regen will fail at runtime."
        )
        # And pass through to the helper
        assert f"{var}={var}" in source, (
            f"validate_job doesn't pass '{var}' to _validate_and_regen."
        )
