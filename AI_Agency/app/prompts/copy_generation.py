from app.prompts.anti_slop import get_anti_slop_instructions, get_platform_prompt


def copy_prompt(
    platform: str,
    day_number: int,
    theme: str,
    hook: str,
    content_type: str,
    voice_block: str,
    brand_name: str,
    input_summary: str,
) -> list[dict]:
    anti_slop = get_anti_slop_instructions()
    platform_rules = get_platform_prompt(platform)

    return [
        {
            "role": "system",
            "content": f"You are a {platform} content writer for Indian brands. You write copy that stops the scroll. Never write generic AI-sounding content. Respond in JSON only.",
        },
        {
            "role": "user",
            "content": f"""{voice_block}

{platform_rules}

{anti_slop}

DAY {day_number} BRIEF:
Theme: {theme}
Hook angle: {hook}
Content type: {content_type}
Source material: {input_summary}

Write the {platform} post for this day. Return JSON:
{{
  "copy": "the actual post text, ready to publish",
  "hashtags": ["relevant", "hashtags", "if applicable"],
  "cta": "the call-to-action used",
  "format": "caption / thread / carousel_text / ad_copy / email_snippet"
}}

REMEMBER:
- Write for {brand_name}, in their exact voice
- This is day {day_number} of 30 — make it feel like part of a natural sequence, not repetitive
- The copy should feel like a real human marketer wrote it while having coffee, not an AI""",
        },
    ]


def regeneration_prompt(
    platform: str,
    original_copy: str,
    feedback: str,
    voice_block: str,
    brand_name: str,
) -> list[dict]:
    anti_slop = get_anti_slop_instructions()
    platform_rules = get_platform_prompt(platform)

    return [
        {
            "role": "system",
            "content": f"You are rewriting a {platform} post that didn't meet quality standards. Fix the specific issues. Respond in JSON only.",
        },
        {
            "role": "user",
            "content": f"""{voice_block}

{platform_rules}

{anti_slop}

ORIGINAL COPY:
{original_copy}

QUALITY FEEDBACK (fix these issues):
{feedback}

Rewrite the copy fixing all issues above. Return JSON:
{{
  "copy": "the rewritten post text",
  "hashtags": ["updated", "hashtags"],
  "cta": "the call-to-action",
  "format": "same format as original"
}}

Write for {brand_name}. Make it sound human, not AI-polished.""",
        },
    ]
