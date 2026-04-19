"""Tests for the slop detection layer.

Examples are pulled from (or paraphrased from) the real Wikipedia field guide
at https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing so we know
these are patterns that genuinely fire on AI-generated prose.
"""

from app.utils.slop_check import (
    FORCE_REGEN_HIT_THRESHOLD,
    SCORE_WEIGHTS,
    apply_slop_penalty,
    check_slop,
    compute_quality_score,
)


# ---------- Clean copy should be... clean. ----------

def test_clean_copy_no_hits():
    copy = (
        "Our new launch: a 3-in-1 body wash. ₹399. Ships in 2 days. "
        "Buy it, try it, tell us if it works."
    )
    report = check_slop(copy)
    assert report.total_hits == 0
    assert report.em_dash_count == 0
    assert report.should_regen is False
    assert report.penalty == 0.0
    assert report.feedback() == ""


# ---------- Word-level banned list ----------

def test_core_ai_vocab_fires():
    copy = "We harness cutting-edge tech to leverage innovative solutions."
    report = check_slop(copy)
    assert report.total_hits >= 4  # harness, cutting-edge, leverage, innovative
    assert "core_ai_vocab" in report.category_hits
    assert report.should_regen is True


def test_word_boundary_does_not_match_substrings():
    # "harness" should not match "harnessing" (participle form is already caught
    # separately by the structural regex, not by the word list).
    copy = "Her approach to the problem was methodical and effective."
    report = check_slop(copy)
    # None of "harness", "harnessing" variants, etc. should fire.
    assert report.category_hits.get("core_ai_vocab", []) == []


# ---------- Significance puffery (Wikipedia WP:AILEGACY) ----------

def test_significance_puffery_fires():
    copy = (
        "The launch of our skincare line stands as a testament to our commitment. "
        "It marks a pivotal moment in Indian D2C beauty."
    )
    report = check_slop(copy)
    assert "significance_puffery" in report.category_hits
    assert report.total_hits >= 2


# ---------- Promotional / travel-guide tone (WP:AIPUFFERY) ----------

def test_promotional_puffery_fires():
    copy = (
        "Nestled in the heart of Mumbai, our boutique boasts a rich history "
        "and a diverse array of handcrafted pieces."
    )
    report = check_slop(copy)
    assert "promotional_puffery" in report.category_hits
    assert report.total_hits >= 3


# ---------- Structural: present-participle tail ----------

def test_participle_tail_detected():
    copy = (
        "The brand launched a new line this month, "
        "highlighting the importance of sustainable materials."
    )
    report = check_slop(copy)
    assert any("present-participle" in h for h in report.structural_hits)


def test_participle_tail_multiple_verbs():
    copy = "We shipped the update, underscoring our dedication to users."
    report = check_slop(copy)
    assert any("present-participle" in h for h in report.structural_hits)


# ---------- Structural: "Despite X, Y" ----------

def test_despite_formula_detected():
    copy = "Despite these challenges, the team continued to ship."
    report = check_slop(copy)
    assert any("Despite" in h for h in report.structural_hits)


# ---------- Structural: "not just X, but Y" ----------

def test_not_just_but_detected():
    copy = "This isn't just a moisturizer but a daily ritual for your skin."
    report = check_slop(copy)
    assert any("not just" in h for h in report.structural_hits)


# ---------- Em dashes ----------

def test_em_dashes_counted():
    copy = "One — two — three — four."
    report = check_slop(copy)
    assert report.em_dash_count == 3
    # penalty should include excess em dashes beyond cap
    assert report.penalty > 0.0


def test_single_em_dash_no_penalty():
    copy = "Good copy — with exactly one dash."
    report = check_slop(copy)
    assert report.em_dash_count == 1
    assert report.penalty == 0.0


# ---------- Force-regen threshold ----------

def test_force_regen_at_threshold():
    # Construct copy hitting >= 3 banned terms.
    copy = (
        "We leverage innovative tech to harness the cutting-edge landscape."
    )
    report = check_slop(copy)
    assert report.total_hits >= FORCE_REGEN_HIT_THRESHOLD
    assert report.should_regen is True


def test_no_regen_below_threshold():
    copy = "We use good tech. Works well. Customers like it."
    report = check_slop(copy)
    assert report.total_hits < FORCE_REGEN_HIT_THRESHOLD
    assert report.should_regen is False


# ---------- Weighted scoring ----------

def test_compute_quality_score_weights_sum_to_1():
    assert abs(sum(SCORE_WEIGHTS.values()) - 1.0) < 1e-9


def test_compute_quality_score_perfect():
    subs = {k: 1.0 for k in SCORE_WEIGHTS}
    assert compute_quality_score(subs) == 1.0


def test_compute_quality_score_zero():
    subs = {k: 0.0 for k in SCORE_WEIGHTS}
    assert compute_quality_score(subs) == 0.0


def test_compute_quality_score_clamps_bad_values():
    subs = {k: 1.0 for k in SCORE_WEIGHTS}
    subs["originality"] = 99.0  # out of range
    subs["ai_detection_risk"] = "not a number"
    score = compute_quality_score(subs)
    # originality clamps to 1.0; ai_detection_risk coerces to 0.0
    expected = (
        1.0 * 0.25      # originality clamped
        + 0.0 * 0.25    # ai_detection_risk coerced
        + 1.0 * 0.20
        + 1.0 * 0.15
        + 1.0 * 0.10
        + 1.0 * 0.05
    )
    assert abs(score - round(expected, 3)) < 1e-9


def test_compute_quality_score_handles_missing_keys():
    subs: dict = {}
    assert compute_quality_score(subs) == 0.0


# ---------- apply_slop_penalty ----------

def test_apply_slop_penalty_reduces_ai_detection_risk():
    subs = {
        "brand_voice_match": 0.9,
        "platform_compliance": 0.9,
        "engagement_potential": 0.9,
        "cta_present": 0.9,
        "originality": 0.9,
        "ai_detection_risk": 1.0,
    }
    copy = "We harness cutting-edge tech to leverage innovative solutions."
    report = check_slop(copy)
    penalized = apply_slop_penalty(subs, report)
    assert penalized["ai_detection_risk"] < 1.0
    # Other subs untouched.
    assert penalized["brand_voice_match"] == 0.9
    # Input not mutated.
    assert subs["ai_detection_risk"] == 1.0


def test_apply_slop_penalty_floors_at_zero():
    subs = {"ai_detection_risk": 0.1}
    # Create a massive hit count by stacking banned phrases.
    copy = (
        "delve tapestry landscape harness seamlessly robust holistic leverage "
        "game-changing cutting-edge moreover furthermore elevate unlock empower"
    )
    report = check_slop(copy)
    penalized = apply_slop_penalty(subs, report)
    assert penalized["ai_detection_risk"] == 0.0


# ---------- Feedback text ----------

def test_feedback_string_lists_categories():
    copy = (
        "Nestled in the heart of Mumbai, we harness cutting-edge tech, "
        "highlighting our commitment to quality."
    )
    report = check_slop(copy)
    feedback = report.feedback()
    assert "core_ai_vocab" in feedback or "promotional_puffery" in feedback
    assert len(feedback) > 0
