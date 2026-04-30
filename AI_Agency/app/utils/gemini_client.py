"""Gemini client — thin async wrapper around google-genai.

Mirrors the shape of AnthropicClient / GroqClient so the LLM factory
can swap providers at the "creator" or "validator" role level.

The ``role`` concept matters because Block B-II splits creator and
validator across model families:
  - Creator: Gemini (sharper voice, less corporate-default)
  - Validator: Claude Haiku (different family → catches Gemini's tells)

This avoids validator-collusion bias where the same family rubber-stamps
its own slop.
"""

import asyncio
import json
import logging

import httpx

logger = logging.getLogger(__name__)


class GeminiClient:
    """Async Gemini client via the v1beta REST API.

    Using raw httpx rather than the google-genai SDK because (a) the SDK
    pulls in protobuf and grpcio which bloat our Docker image, and (b)
    we already have httpx set up for the other providers.

    API docs: https://ai.google.dev/gemini-api/docs/text-generation
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            timeout=120.0,
            headers={"Content-Type": "application/json"},
        )

    @staticmethod
    def _to_gemini_contents(messages: list[dict]) -> tuple[str, list[dict]]:
        """Convert OpenAI-style messages to Gemini's format.

        Returns (system_instruction, contents) where:
        - system_instruction is a single string (or empty) for the
          system-level prompt.
        - contents is a list of {role: user|model, parts: [{text: ...}]}.

        Gemini uses role="user" and role="model" (not "assistant"), and
        expects system prompts as a top-level system_instruction param
        rather than inline in the conversation.
        """
        system_parts: list[str] = []
        contents: list[dict] = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_parts.append(content)
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}],
            })
        return "\n\n".join(system_parts), contents

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> str:
        system_instruction, contents = self._to_gemini_contents(messages)

        generation_config: dict = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        # Gemini 2.5 Pro has "thinking" mode on by default, which burns
        # the maxOutputTokens budget on internal reasoning and leaves
        # zero tokens for the actual response. Observed in Pluto test:
        # all 9 copy-gen calls returned empty content with
        # finishReason=MAX_TOKENS.
        #
        # We don't need chain-of-thought for short-form copy generation,
        # so we explicitly set thinkingBudget=0 on Pro. Other models
        # ignore this field.
        if "2.5-pro" in model or "2.5-flash" in model:
            generation_config["thinkingConfig"] = {"thinkingBudget": 0}

        payload: dict = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}],
            }

        url = (
            f"{self.BASE_URL}/models/{model}:generateContent"
            f"?key={self.api_key}"
        )

        for attempt in range(3):
            try:
                resp = await self.client.post(url, json=payload)
                if resp.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning(
                        "Gemini rate limited, waiting %ss (attempt %d)...",
                        wait, attempt + 1,
                    )
                    await asyncio.sleep(wait)
                    continue
                if resp.status_code in (500, 502, 503):
                    wait = 5 * (attempt + 1)
                    logger.warning(
                        "Gemini %d, waiting %ss...", resp.status_code, wait,
                    )
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    # Sometimes safety filters nuke the output.
                    block_reason = (
                        data.get("promptFeedback", {}).get("blockReason")
                    )
                    if block_reason:
                        raise RuntimeError(
                            f"Gemini blocked response: {block_reason}"
                        )
                    raise RuntimeError(f"Gemini returned no candidates: {data}")
                candidate = candidates[0]
                parts = candidate.get("content", {}).get("parts", [])
                if not parts:
                    finish_reason = candidate.get("finishReason", "UNKNOWN")
                    if finish_reason == "MAX_TOKENS":
                        raise RuntimeError(
                            f"Gemini hit MAX_TOKENS with empty output "
                            f"(model={model}, max_tokens={max_tokens}). "
                            f"This usually means Pro's thinking mode "
                            f"consumed the token budget. Increase "
                            f"max_tokens or disable thinking."
                        )
                    raise RuntimeError(
                        f"Gemini returned no parts (finishReason={finish_reason}): {candidate}"
                    )
                return parts[0].get("text", "")
            except httpx.HTTPStatusError as e:
                if attempt == 2:
                    raise
                logger.warning(
                    "Gemini API error (attempt %d): %s", attempt + 1, e,
                )
                await asyncio.sleep(2 ** attempt)

        raise RuntimeError("Gemini: exhausted retries")

    async def chat_json(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict:
        content = await self.chat(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=True,
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Gemini in JSON mode usually returns clean JSON but strip
            # any stray markdown fences defensively.
            if "```json" in content:
                content = content.split("```json", 1)[1].split("```", 1)[0]
            elif "```" in content:
                content = content.split("```", 1)[1].split("```", 1)[0]
            return json.loads(content.strip())

    async def close(self):
        await self.client.aclose()
