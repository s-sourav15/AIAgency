"""Copy generation prompts — Block B-II rewrite.

Philosophy: the LLM is writing FOR a specific brand, not in a generic
voice inspired by a brand. Three mechanisms enforce this:

1. Full banned-word list injected (not truncated) so the LLM sees every
   trap we care about.
2. SAMPLE_CONTENT goes in verbatim as few-shot examples — "write so this
   slots into that list and nobody can tell."
3. Output JSON requires a `grounded_facts` array — the LLM must name
   which specific brand facts it used. If it can't, it returns
   `brief_too_thin` and we reject the piece upstream.

See PR #10 for full context.
"""

from app.prompts.anti_slop import (
    BANNED_WORDS,
    PLATFORM_CONSTRAINTS,
    get_platform_prompt,
)


# ----- Static prompt sections ------------------------------------------------

CREATOR_SYSTEM_PROMPT = """You are a social media copywriter writing FOR a specific brand.

Your job is to write copy that sounds exactly like the brand already \
sounds. Not like an AI "in the voice of" the brand — like the brand's \
founder wrote it at 11pm.

Rules of the game:

1. GROUND EVERY POST IN SPECIFIC BRAND FACTS.
   Every post must reference at least one concrete product feature, \
stated value, or differentiator from the brand brief. No abstract \
think-piece content. If you cannot name a specific thing the brand \
does or believes, rewrite.

2. NEVER INVENT STATISTICS.
   No "1 in 5 users", no "studies show", no "research finds" unless \
the source is in the brief. Hallucinated numbers are an instant \
rejection.

3. EACH POST IS STANDALONE.
   Do not reference "day 1 of 30", "this 29-day series", "stay tuned \
for more". The reader sees ONE post. Act like it.

4. NO AI OPENERS.
   Never start with: "We've all been there...", "What if I told \
you...", "Did you know...", "In today's fast-paced world...", \
"Let's talk about...", "Picture this...". Start with a fact, a \
claim, a specific observation, or a question that makes the \
reader stop scrolling.

5. NO GENERIC CTAS.
   Banned: "join the movement", "break the cycle", "let's start a \
conversation", "drop a comment below". Every CTA must be specific \
to what this post is about.

6. PLATFORM-NATIVE VOICE.
   - Instagram: visual-first, line breaks between thoughts, one \
clear hook in the first line before the "more" fold. Hashtags at \
the end.
   - Twitter/X: one idea. Punchy. 200-260 chars ideal. Hashtags only \
if they are actually functional. Never more than 2.
   - LinkedIn: story hook in first 2 lines, short paragraphs, one \
specific insight, end with a question that invites opinion (not \
consensus).
   - Ads: benefit-led first line. Social proof if available. One \
specific CTA. No mood pieces.
   - Email: first line is a real thing you would write to a friend, \
not "Hi [Name], I hope this finds you well".

7. MATCH THE BRAND'S ACTUAL EXISTING VOICE.
   The brand has example posts in the user message. Those examples \
ARE the target. Read them. Notice how they start sentences. Notice \
what they do NOT say. Write something that could slot into that \
list and nobody could tell it was not written by the same person.

Output: JSON only."""


BANNED_STRUCTURAL_PATTERNS = """Banned structural patterns:
- Rule of three (X, Y, and Z) more than once per piece.
- "Not just X, but Y" / "It is not X, it is Y".
- "Despite..., ..." framing.
- Rhetorical question immediately answered by the next sentence.
- Em dashes (—) more than once per piece.
- Sentences ending in -ing participles ("...highlighting", \
"...underscoring", "...contributing to", "...reflecting")."""


def _format_samples(sample_content: list[str]) -> str:
    """Format SAMPLE_CONTENT as a numbered list for the few-shot block."""
    if not sample_content:
        return "(no example posts provided for this brand)"
    # Filter first so the rendered numbers are contiguous (nicer for the LLM).
    cleaned = [s.strip() for s in sample_content if s and s.strip()]
    if not cleaned:
        return "(no example posts provided)"
    return "\n\n".join(f"[{i}] {s}" for i, s in enumerate(cleaned, 1))


def _banned_words_block(limit: int | None = None) -> str:
    """Render the banned-words list. ``limit=None`` means full list."""
    words = BANNED_WORDS if limit is None else BANNED_WORDS[:limit]
    return ", ".join(f'"{w}"' for w in words)


# ----- Public prompt builders ------------------------------------------------

def _tone_directive(tone: str) -> str:
    """Build the top-of-prompt tone directive.

    TONE is the single most important voice signal the founder gives us.
    It was previously buried mid-prompt as a metadata label, which the
    LLM weighted lightly and mixed with the voice_block's 10 lines of
    extracted profile. Now it's promoted to prompt position #2 (right
    after BRAND) and written as a prescriptive instruction with a
    concrete fail-state for the LLM to self-check against.
    """
    if not tone or not tone.strip():
        return ""
    cleaned = tone.strip()
    return f"""REQUIRED TONE (match EVERY sentence to these words):
  {cleaned}

  Every sentence you write must plausibly belong in a brand that is
  these things. Before moving on from a sentence, test it:
  - If it could be from a Deloitte report, a McKinsey deck, or a
    corporate wellness blog, rewrite it.
  - If it sounds like a WhatsApp message from a smart, slightly
    chaotic friend who deeply cares about the product, you are
    on track.
  Tone is NOT decoration. It is the instruction. Other rules below
  are secondary."""


def copy_prompt(
    platform: str,
    day_number: int,
    theme: str,
    hook: str,
    content_type: str,
    voice_block: str,
    brand_name: str,
    brand_description: str,
    sample_content: list[str],
    tone: str = "",
    industry: str = "",
    input_summary: str = "",
) -> list[dict]:
    """Build the creator prompt for a single piece of content.

    ``sample_content`` goes in VERBATIM as few-shot examples. This is the
    single biggest driver of voice fidelity — more impactful than any
    voice_profile extraction.

    ``tone`` is the second-most-important signal and is promoted to
    top-of-prompt + system prompt. See _tone_directive.
    """
    platform_rules = get_platform_prompt(platform)
    samples_block = _format_samples(sample_content or [])
    banned_words = _banned_words_block()
    tone_directive = _tone_directive(tone)

    brief_block = (brand_description or "").strip()
    if input_summary and input_summary.strip():
        brief_block = f"{brief_block}\n\n--- ADDITIONAL INPUT ---\n{input_summary.strip()}"

    # System prompt gets an inline tone reminder so the persona itself
    # inherits the vibe, not just the task layer.
    if tone_directive:
        system_msg = (
            CREATOR_SYSTEM_PROMPT
            + f"\n\n---\n\nYou are writing for a brand whose tone is: "
            + f"{tone.strip()}\n\nEverything you produce must embody "
            + f"that tone in every sentence. It is not a label on the "
            + f"output; it is the voice of the output."
        )
    else:
        system_msg = CREATOR_SYSTEM_PROMPT

    # Build the user message. TONE directive goes right under BRAND —
    # position #2 in the prompt, before brief, samples, anything else.
    user_msg_parts = [f"BRAND: {brand_name}"]
    if tone_directive:
        user_msg_parts.append(tone_directive)
    user_msg_parts.extend([
        f"BRAND BRIEF (source of truth — every fact must come from here):\n{brief_block}",
        f"BRAND'S ACTUAL EXISTING POSTS (your target voice — write like these):\n{samples_block}",
        f"INDUSTRY: {industry or '(not specified)'}",
        voice_block,
        platform_rules,
        f"""TODAY'S BRIEF:
Platform: {platform}
Content type: {content_type}
Theme: {theme}
Angle / hook direction: {hook}""",
        f"BANNED WORDS (automatic rejection if any appear):\n{banned_words}",
        BANNED_STRUCTURAL_PATTERNS,
        f"""Write the post. Return JSON:
{{
  "copy": "the full post copy, ready to publish",
  "hashtags": ["lowercase", "no-hash-prefix", "3-10 items"],
  "cta": "the specific call-to-action used (one short sentence)",
  "format": "caption / thread / carousel_text / ad_copy / email_snippet",
  "hook_used": "one sentence describing what hook or angle you took",
  "grounded_facts": ["specific brand fact 1 used in the post", "specific brand fact 2 used"]
}}

The grounded_facts array must have at least 1 entry. If the brief is \
too thin to ground the post in a specific fact, return:
{{"error": "brief_too_thin", "reason": "what was missing"}}

Do NOT reference day numbers ({day_number}) or series positioning in \
the output. The reader sees ONE post.""",
    ])
    user_msg = "\n\n".join(user_msg_parts)

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def regeneration_prompt(
    platform: str,
    original_copy: str,
    feedback: str,
    voice_block: str,
    brand_name: str,
    brand_description: str = "",
    sample_content: list[str] | None = None,
    tone: str = "",
) -> list[dict]:
    """Rewrite a piece that failed validation. Include specific feedback."""
    platform_rules = get_platform_prompt(platform)
    samples_block = _format_samples(sample_content or [])
    banned_words = _banned_words_block()
    tone_directive = _tone_directive(tone)

    parts = [f"BRAND: {brand_name}"]
    if tone_directive:
        parts.append(tone_directive)
    parts.extend([
        f"BRAND BRIEF:\n{brand_description or '(none provided)'}",
        f"BRAND'S ACTUAL EXISTING POSTS (target voice — write like these):\n{samples_block}",
        voice_block,
        platform_rules,
        f"ORIGINAL COPY (rejected):\n{original_copy}",
        f"WHY IT WAS REJECTED (fix every one of these):\n{feedback}",
        f"BANNED WORDS (re-check — do not use any):\n{banned_words}",
        BANNED_STRUCTURAL_PATTERNS,
        """Rewrite. Return JSON:
{
  "copy": "the rewritten post",
  "hashtags": ["updated", "hashtags"],
  "cta": "the call-to-action",
  "format": "same format as original",
  "hook_used": "what hook or angle you took this time",
  "grounded_facts": ["specific brand fact(s) used"]
}

Ground the new post in concrete brand facts from the brief. Match the \
voice of the example posts above.""",
    ])
    user_msg = "\n\n".join(parts)

    system_msg = (
        "You are rewriting a social media post that failed quality "
        "review. Fix every specific issue listed. Stay grounded in the "
        "brand brief. Respond in JSON only."
    )
    if tone_directive:
        system_msg += (
            f"\n\nThe brand tone is: {tone.strip()}. Every sentence "
            f"of your rewrite must embody that tone."
        )

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


# Re-export PLATFORM_CONSTRAINTS for backwards compat with older imports.
__all__ = [
    "CREATOR_SYSTEM_PROMPT",
    "BANNED_STRUCTURAL_PATTERNS",
    "copy_prompt",
    "regeneration_prompt",
    "PLATFORM_CONSTRAINTS",
]
