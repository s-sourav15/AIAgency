from app.prompts.anti_slop import BANNED_WORDS


def scoring_prompt(
    copy: str,
    platform: str,
    brand_name: str,
    voice_profile: dict,
) -> list[dict]:
    tone_words = ", ".join(voice_profile.get("tone_words", ["professional"])) if voice_profile else "professional"
    banned_sample = ", ".join(f'"{w}"' for w in BANNED_WORDS[:15])

    return [
        {
            "role": "system",
            "content": "You are a content quality validator. Score content strictly and give specific, actionable feedback. Respond in JSON only.",
        },
        {
            "role": "user",
            "content": f"""Score this {platform} post for brand "{brand_name}".

Expected brand tone: {tone_words}
Banned words (AI slop indicators): {banned_sample}

CONTENT TO VALIDATE:
{copy}

Score each dimension from 0.0 to 1.0:

1. brand_voice_match: Does this sound like {brand_name}? Does it match the expected tone ({tone_words})?
2. platform_compliance: Is it the right length, format, and style for {platform}?
3. engagement_potential: Would this stop someone mid-scroll? Is the hook strong?
4. cta_present: Is there a clear, natural call-to-action?
5. originality: Does this feel fresh and specific, or generic and templated?
6. ai_detection_risk: How likely is this to be flagged as AI-generated? (1.0 = undetectable, 0.0 = obviously AI)

Return JSON:
{{
  "brand_voice_match": 0.0,
  "platform_compliance": 0.0,
  "engagement_potential": 0.0,
  "cta_present": 0.0,
  "originality": 0.0,
  "ai_detection_risk": 0.0,
  "quality_score": 0.0,
  "feedback": "specific issues to fix if score < 0.8. Be precise: quote the problematic text and suggest the fix."
}}

quality_score = weighted average: originality (0.25) + ai_detection_risk (0.25) + brand_voice_match (0.2) + engagement_potential (0.15) + platform_compliance (0.1) + cta_present (0.05)

Be strict. Real-world content that a human marketer would approve is 0.8+. Generic AI output should score 0.4-0.6.""",
        },
    ]
