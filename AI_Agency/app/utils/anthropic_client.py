import json
import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)


class AnthropicClient:
    BASE_URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            timeout=120.0,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
        )

    def _separate_system(self, messages: list[dict]) -> tuple[str, list[dict]]:
        """Extract system messages from the messages list.

        Claude API requires system as a top-level param, not in the messages array.
        """
        system_parts = []
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_parts.append(msg["content"])
            else:
                user_messages.append(msg)
        return "\n\n".join(system_parts), user_messages

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> str:
        system_prompt, clean_messages = self._separate_system(messages)

        if json_mode:
            system_prompt += (
                "\n\nIMPORTANT: Respond with valid JSON only. "
                "No markdown code fences, no explanation, just the JSON object."
            )
            if clean_messages and clean_messages[-1]["role"] == "user":
                clean_messages[-1] = dict(clean_messages[-1])
                clean_messages[-1]["content"] += "\n\nRespond with ONLY valid JSON."

        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": clean_messages,
        }
        if system_prompt:
            payload["system"] = system_prompt

        for attempt in range(3):
            try:
                resp = await self.client.post(self.BASE_URL, json=payload)
                if resp.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning(f"Claude rate limited, waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                if resp.status_code == 529:
                    wait = 5 * (attempt + 1)
                    logger.warning(f"Claude overloaded, waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                data = resp.json()
                return data["content"][0]["text"]
            except httpx.HTTPStatusError as e:
                if attempt == 2:
                    raise
                logger.warning(f"Claude API error (attempt {attempt + 1}): {e}")
                await asyncio.sleep(2 ** attempt)

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
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())

    async def close(self):
        await self.client.aclose()
