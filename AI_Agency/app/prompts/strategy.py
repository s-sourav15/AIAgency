"""Strategy prompt — Block B-II fixes.

Main fix: respect the user's ``platforms`` list. Previously the prompt
said "pick 1-3 platforms, rotate naturally" which meant the LLM
dropped platforms the user actually configured. Now:

- Default: ALL configured platforms every day (full coverage).
- Opt-in rotation available via ``rotate_platforms=True`` for clients
  who want natural variation.
"""


def calendar_strategy_prompt(
    brand_name: str,
    brand_description: str,
    voice_block: str,
    input_type: str,
    input_data: str,
    platforms: list[str],
    industry: str,
    num_days: int = 30,
    rotate_platforms: bool = False,
) -> list[dict]:
    """Build the strategy prompt.

    ``rotate_platforms``: if True, the LLM is instructed to rotate
    through the platforms so not every platform appears every day.
    Default False — full coverage on every day, matching what the user
    requested.
    """
    platforms_str = ", ".join(platforms)

    if rotate_platforms:
        platform_rule = (
            "For each day, pick 1-3 platforms from the list above and "
            "rotate them so content feels natural across the calendar. "
            "Do not post to every platform every day."
        )
    else:
        platform_rule = (
            f"For each day, include ALL of these platforms: "
            f"{platforms_str}. Do NOT drop or skip platforms — the user "
            f"explicitly asked for full coverage. Each day's "
            f"\"platforms\" array must contain exactly these entries."
        )

    return [
        {
            "role": "system",
            "content": (
                f"You are a social media content strategist. You create "
                f"{num_days}-day content calendars that drive engagement "
                f"for real brands. Respond in JSON only."
            ),
        },
        {
            "role": "user",
            "content": f"""Create a {num_days}-day content calendar for "{brand_name}" in the {industry or 'general'} industry.

{voice_block}

INPUT ({input_type}):
{input_data}

CONFIGURED PLATFORMS: {platforms_str}

PLATFORM COVERAGE: {platform_rule}

Return JSON:
{{
  "days": [
    {{
      "day": 1,
      "theme": "short theme description (3-8 words)",
      "hook": "the specific angle or hook for this day's content (one sentence)",
      "content_type": "educational / promotional / engagement / behind-the-scenes / user-story / trend",
      "platforms": ["instagram", "twitter", ...]
    }}
  ]
}}

RULES:
- Mix content types: ~40% educational, ~25% promotional, ~20% engagement, ~15% behind-the-scenes.
- Never do more than 2 promotional days in a row.
- Each day's hook should be specific and interesting, not generic.
  Ground it in a real brand fact, feature, or differentiator from the
  input above. "Launch promo" is lazy; "Early-access list opens for
  Bangalore beta" is specific.
- EXACTLY {num_days} days total. The "days" array MUST have exactly
  {num_days} entries, numbered 1 to {num_days}. Do NOT generate more
  or fewer days.""",
        },
    ]
