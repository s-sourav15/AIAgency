def calendar_strategy_prompt(
    brand_name: str,
    brand_description: str,
    voice_block: str,
    input_type: str,
    input_data: str,
    platforms: list[str],
    industry: str,
    num_days: int = 30,
) -> list[dict]:
    platforms_str = ", ".join(platforms)
    return [
        {
            "role": "system",
            "content": f"You are a social media content strategist for Indian D2C brands. You create {num_days}-day content calendars that drive engagement. Respond in JSON only.",
        },
        {
            "role": "user",
            "content": f"""Create a {num_days}-day content calendar for "{brand_name}" in the {industry or 'general'} industry.

{voice_block}

INPUT ({input_type}):
{input_data}

PLATFORMS: {platforms_str}

Create a content calendar. For each day, pick 1-3 platforms (not all platforms every day — rotate them naturally).

Return JSON:
{{
  "days": [
    {{
      "day": 1,
      "theme": "short theme description",
      "hook": "the specific angle or hook for this day's content",
      "content_type": "educational / promotional / engagement / behind-the-scenes / user-story / trend",
      "platforms": ["instagram", "twitter"]
    }},
    ...
  ]
}}

RULES:
- Mix content types: ~40% educational, ~25% promotional, ~20% engagement, ~15% behind-the-scenes
- Never do more than 2 promotional days in a row
- Include Indian festival/cultural moments if relevant (check current month)
- Weekend content should be lighter/more casual
- Each day's hook should be specific and interesting, not generic
- Vary which platforms appear each day — don't post on ALL platforms every single day
- EXACTLY {num_days} days total. The "days" array MUST have exactly {num_days} entries, numbered 1 to {num_days}. Do NOT generate more or fewer days.""",
        },
    ]
