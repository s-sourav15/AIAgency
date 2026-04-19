"""Runtime slop detection.

Checks generated copy for banned words and AI writing patterns pulled
from https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing

Two kinds of detectors:

1. Word/phrase matches against BANNED_WORDS (case-insensitive, word-aware).
2. Structural regex patterns (present-participle tails, "Despite X, Y"
   framing, em-dash overuse, etc.).

Returns a `SlopReport` with:
- total hits
- hits grouped by category
- recommended quality penalty (float, 0.0 - 1.0)
- human-readable feedback string for the regeneration prompt
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.prompts.anti_slop import BANNED_WORD_CATEGORIES


# Each hit deducts this much from ai_detection_risk. Capped at the subscore.
PENALTY_PER_HIT = 0.05
# At or above this many hits, force regeneration regardless of score.
FORCE_REGEN_HIT_THRESHOLD = 3
# Em dash cap per piece (from anti-slop instruction #3).
EM_DASH_CAP = 1


# --- Structural patterns (category: "structural") ---
# Sentence-end present-participle tail:
#   "..., highlighting something."
#   "...contributing to the broader."
_PARTICIPLE_TAIL = re.compile(
    r",\s+(?:highlighting|underscoring|emphasizing|reflecting|"
    r"contributing to|aligning with|resonating with|symbolizing|"
    r"cultivating|fostering|ensuring|showcasing)\b[^.!?\n]*[.!?](?:\s|$)",
    re.IGNORECASE,
)

# "Despite X, Y" structural formula (Wikipedia "Challenges and Future Prospects"
# tell).
_DESPITE_FORMULA = re.compile(
    r"\bdespite\s+(?:its|these|their|the)\b[^.!?\n]*[.!?]",
    re.IGNORECASE,
)

# "Not just X, but Y" construction (classic AI pattern).
# Handles "not just" and contractions like "isn't just" / "it's not just".
_NOT_JUST_BUT = re.compile(
    r"(?:\bnot\b|n't)\s+just\b[^.!?\n]*\bbut\b",
    re.IGNORECASE,
)


@dataclass
class SlopReport:
    total_hits: int = 0
    category_hits: dict[str, list[str]] = field(default_factory=dict)
    structural_hits: list[str] = field(default_factory=list)
    em_dash_count: int = 0

    @property
    def should_regen(self) -> bool:
        return self.total_hits >= FORCE_REGEN_HIT_THRESHOLD

    @property
    def penalty(self) -> float:
        """Penalty applied to the ai_detection_risk subscore (0.0 - 1.0)."""
        raw = self.total_hits * PENALTY_PER_HIT
        # Extra penalty for em-dash overuse.
        if self.em_dash_count > EM_DASH_CAP:
            raw += (self.em_dash_count - EM_DASH_CAP) * PENALTY_PER_HIT
        return min(raw, 1.0)

    def feedback(self) -> str:
        if self.total_hits == 0 and self.em_dash_count <= EM_DASH_CAP:
            return ""
        parts: list[str] = []
        for category, words in self.category_hits.items():
            if words:
                parts.append(
                    f"{category}: remove or rewrite: {', '.join(sorted(set(words)))}"
                )
        if self.structural_hits:
            parts.append(
                "structural AI tells: "
                + "; ".join(sorted(set(self.structural_hits)))
            )
        if self.em_dash_count > EM_DASH_CAP:
            parts.append(
                f"too many em dashes ({self.em_dash_count}); keep to "
                f"{EM_DASH_CAP} per piece"
            )
        return " | ".join(parts)


def _find_phrase(text: str, phrase: str) -> bool:
    """Case-insensitive, whole-word-ish phrase match.

    Uses \b on phrase boundaries so "harness" won't match "harnessing",
    but multi-word phrases with hyphens/apostrophes still work.
    """
    # Escape phrase, then wrap in word boundaries if it starts/ends with a word char.
    pattern = re.escape(phrase)
    if phrase[:1].isalnum():
        pattern = r"\b" + pattern
    if phrase[-1:].isalnum():
        pattern = pattern + r"\b"
    return re.search(pattern, text, re.IGNORECASE) is not None


def check_slop(copy: str) -> SlopReport:
    """Scan `copy` for slop. Returns a SlopReport."""
    report = SlopReport()

    if not copy:
        return report

    # 1. Word/phrase hits per category.
    for category, words in BANNED_WORD_CATEGORIES.items():
        hits = [w for w in words if _find_phrase(copy, w)]
        if hits:
            report.category_hits[category] = hits
            report.total_hits += len(hits)

    # 2. Structural pattern hits.
    if _PARTICIPLE_TAIL.search(copy):
        report.structural_hits.append("present-participle sentence tail")
        report.total_hits += 1
    if _DESPITE_FORMULA.search(copy):
        report.structural_hits.append('"Despite X, Y" formula')
        report.total_hits += 1
    if _NOT_JUST_BUT.search(copy):
        report.structural_hits.append('"not just X but Y" construction')
        report.total_hits += 1

    # 3. Em-dash count (instruction #3: max 1 per piece).
    report.em_dash_count = copy.count("—")

    return report


# Documented weights from validation.py docstring. Kept in sync.
SCORE_WEIGHTS: dict[str, float] = {
    "originality": 0.25,
    "ai_detection_risk": 0.25,
    "brand_voice_match": 0.20,
    "engagement_potential": 0.15,
    "platform_compliance": 0.10,
    "cta_present": 0.05,
}


def compute_quality_score(subscores: dict) -> float:
    """Weighted average of the six subscores. Computed in Python, not by the LLM."""
    total = 0.0
    for key, weight in SCORE_WEIGHTS.items():
        val = subscores.get(key)
        try:
            val = float(val) if val is not None else 0.0
        except (TypeError, ValueError):
            val = 0.0
        val = max(0.0, min(1.0, val))
        total += val * weight
    return round(total, 3)


def apply_slop_penalty(subscores: dict, report: SlopReport) -> dict:
    """Return a new subscores dict with ai_detection_risk penalized.

    Does not mutate the input.
    """
    updated = dict(subscores)
    try:
        current = float(updated.get("ai_detection_risk", 0.5))
    except (TypeError, ValueError):
        current = 0.5
    updated["ai_detection_risk"] = max(0.0, current - report.penalty)
    return updated
