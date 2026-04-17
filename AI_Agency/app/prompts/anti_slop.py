BANNED_WORDS = [
    "delve", "tapestry", "landscape", "harness", "seamlessly", "robust",
    "holistic", "leverage", "game-changing", "cutting-edge", "moreover",
    "furthermore", "it's worth noting", "in today's fast-paced world",
    "elevate", "unlock", "empower", "synergy", "paradigm", "innovative",
    "disruptive", "transformative", "revolutionize", "dive deep",
    "navigate", "foster", "nuanced", "multifaceted", "realm",
    "at the end of the day", "let's dive in", "without further ado",
    "game changer", "take it to the next level", "deep dive",
    "streamline", "optimize", "spearhead", "bolster", "illuminate",
    "facilitate", "commendable", "meticulous", "strategically",
    "comprehensive", "groundbreaking",
]

PLATFORM_CONSTRAINTS = {
    "instagram": {
        "max_chars": 2200,
        "ideal_chars": "120-150 for caption hook, up to 800 total",
        "hashtag_count": "15-25",
        "tone": "casual, relatable, visual-first",
        "rules": [
            "Start with a hook in the first line (before 'more' fold)",
            "Use line breaks for readability",
            "End with a CTA (save, share, comment, link in bio)",
            "Hashtags go at the end, separated by line breaks",
        ],
    },
    "twitter": {
        "max_chars": 280,
        "ideal_chars": "200-260",
        "tone": "punchy, opinionated, conversation-starting",
        "rules": [
            "One idea per tweet",
            "Use numbers or specific facts over vague claims",
            "Ask a question or make a bold statement",
            "No hashtag spam, max 1-2 relevant hashtags",
        ],
    },
    "linkedin": {
        "max_chars": 3000,
        "ideal_chars": "150-300",
        "tone": "professional but human, thought-leadership",
        "rules": [
            "Hook in first line (before fold)",
            "Short paragraphs (1-2 sentences)",
            "Share a specific insight or lesson",
            "End with a question to drive comments",
            "No corporate jargon",
        ],
    },
    "ads": {
        "max_chars": 125,
        "headline_chars": 40,
        "tone": "benefit-led, urgency, direct",
        "rules": [
            "Lead with the benefit, not the feature",
            "Include social proof if possible",
            "Clear CTA (Shop Now, Try Free, Learn More)",
            "Create urgency without being sleazy",
        ],
    },
    "email": {
        "subject_chars": 50,
        "preview_chars": 90,
        "body_chars": 500,
        "tone": "personal, value-first, conversational",
        "rules": [
            "Subject line: curiosity or benefit, never clickbait",
            "First line: personal, not promotional",
            "One CTA per email",
            "P.S. line for secondary message",
        ],
    },
}


def get_anti_slop_instructions() -> str:
    banned = ", ".join(f'"{w}"' for w in BANNED_WORDS[:20])
    return f"""CRITICAL WRITING CONSTRAINTS:
1. NEVER use these words/phrases: {banned}
2. Vary sentence structure. Mix short punchy sentences with longer ones. Use fragments sometimes.
3. Do NOT use em dashes (—) more than once per piece.
4. Do NOT use the rule-of-three pattern in every list. Sometimes use 2 items, sometimes 4.
5. Do NOT start with generic openings like "In today's..." or "Are you looking for..."
6. Start with a specific fact, bold claim, question, or scenario.
7. Write like a human marketer who has opinions, not a neutral AI summarizer.
8. Use contractions (don't, can't, won't) for casual platforms.
9. Avoid perfectly parallel sentence structure everywhere.
10. No excessive emoji. Max 2-3 per post on Instagram, 0-1 on LinkedIn, 0 on Twitter."""


def get_platform_prompt(platform: str) -> str:
    config = PLATFORM_CONSTRAINTS.get(platform, {})
    rules = config.get("rules", [])
    rules_text = "\n".join(f"  - {r}" for r in rules)
    return f"""PLATFORM: {platform.upper()}
Tone: {config.get('tone', 'professional')}
Max length: {config.get('max_chars', 500)} characters
Ideal length: {config.get('ideal_chars', 'concise')}
Rules:
{rules_text}"""
