def voice_extraction_prompt(brand_name: str, sample_content: list[str]) -> list[dict]:
    samples = "\n---\n".join(sample_content)
    return [
        {
            "role": "system",
            "content": "You are a brand voice analyst. Analyze content samples and extract a detailed voice profile. Respond in JSON only.",
        },
        {
            "role": "user",
            "content": f"""Analyze these content samples from the brand "{brand_name}" and extract a voice profile.

CONTENT SAMPLES:
{samples}

Return a JSON object with these keys:
{{
  "tone_words": ["3-5 adjectives describing the tone, e.g. warm, confident, playful"],
  "vocabulary_style": "description of word choice patterns — formal/casual, technical/simple, etc.",
  "sentence_style": "description of sentence patterns — short/long, questions/statements, etc.",
  "emoji_usage": "none / minimal / moderate / heavy",
  "cta_style": "how they typically ask users to take action",
  "personality_traits": ["3-5 personality traits the brand projects"],
  "avoids": ["things this brand would never say or do"],
  "example_phrases": ["3-5 phrases that capture the brand's voice"]
}}""",
        },
    ]


def voice_injection_block(brand_name: str, voice_profile: dict) -> str:
    if not voice_profile:
        return f"Brand: {brand_name}. Write in a professional, approachable tone."

    tone = ", ".join(voice_profile.get("tone_words", ["professional"]))
    vocab = voice_profile.get("vocabulary_style", "")
    sentence = voice_profile.get("sentence_style", "")
    emoji = voice_profile.get("emoji_usage", "minimal")
    cta = voice_profile.get("cta_style", "")
    avoids = ", ".join(voice_profile.get("avoids", []))
    examples = "\n  ".join(voice_profile.get("example_phrases", []))

    return f"""BRAND VOICE — {brand_name}:
Tone: {tone}
Vocabulary: {vocab}
Sentence style: {sentence}
Emoji usage: {emoji}
CTA style: {cta}
Avoids: {avoids}
Example phrases that capture the voice:
  {examples}
Write EXACTLY in this voice. Match the tone and patterns above."""
