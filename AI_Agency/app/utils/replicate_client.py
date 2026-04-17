import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)


class ReplicateClient:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.client = httpx.AsyncClient(
            timeout=120.0,
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
        )

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        model: str = "black-forest-labs/flux-2-pro",
    ) -> str | None:
        payload = {
            "input": {
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "num_outputs": 1,
            },
        }
        try:
            resp = await self.client.post(
                f"https://api.replicate.com/v1/models/{model}/predictions",
                json=payload,
            )
            if resp.status_code == 429:
                logger.warning("Replicate rate limited (429)")
                return None
            if resp.status_code != 200 and resp.status_code != 201:
                logger.error(f"Replicate error {resp.status_code}: {resp.text[:200]}")
                return None

            prediction = resp.json()

            # If "Prefer: wait" worked, output is already available
            if prediction.get("status") == "succeeded":
                output = prediction.get("output")
                return output[0] if isinstance(output, list) else output

            # Otherwise poll until complete
            get_url = prediction.get("urls", {}).get("get")
            if not get_url:
                logger.error(f"No poll URL in response: {prediction}")
                return None

            for _ in range(60):
                await asyncio.sleep(2)
                poll = await self.client.get(get_url)
                if poll.status_code != 200:
                    continue
                result = poll.json()
                if result["status"] == "succeeded":
                    output = result["output"]
                    return output[0] if isinstance(output, list) else output
                if result["status"] == "failed":
                    logger.error(f"Replicate prediction failed: {result.get('error')}")
                    return None
            logger.error("Replicate timed out after 120s")
            return None
        except Exception as e:
            logger.error(f"Replicate error: {e}")
            return None

    async def close(self):
        await self.client.aclose()
