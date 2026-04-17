import base64
import logging
import json

import httpx

logger = logging.getLogger(__name__)


def _encode_image(image_path: str) -> tuple[str, str]:
    """Read and base64-encode an image. Returns (base64_data, mime_type)."""
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    ext = image_path.rsplit(".", 1)[-1].lower()
    mime = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }.get(ext, "image/png")

    return data, mime


async def extract_visual_style(image_paths: str | list[str], openai_api_key: str) -> dict:
    """Analyze one or more brand reference images and extract a unified visual style.

    Accepts a single path (str) or a list of paths.
    All images are sent in a single request so the model can identify
    the overall visual theme across the set.
    """
    # Normalize to list
    if isinstance(image_paths, str):
        image_paths = [image_paths]

    # Build content blocks: text prompt + all images
    content_blocks = [
        {
            "type": "text",
            "text": (
                f"You are analyzing {len(image_paths)} brand reference image(s). "
                "Look at ALL images together and extract the UNIFIED visual style — "
                "the common theme, mood, color palette, and artistic approach across the set.\n\n"
                "Return JSON with these fields:\n"
                "- art_style: the dominant art style across all images (e.g. 'flat illustration', 'photorealistic', '3D render', 'watercolor', 'minimalist graphic')\n"
                "- color_palette: list of dominant colors as hex codes (merged across all images)\n"
                "- mood: the overall mood (e.g. 'warm and cozy', 'energetic', 'professional', 'playful')\n"
                "- composition: common composition patterns (e.g. 'centered subject', 'rule of thirds', 'flat lay')\n"
                "- textures: (e.g. 'smooth gradients', 'grainy', 'matte')\n"
                "- lighting: (e.g. 'soft natural light', 'studio lighting', 'golden hour')\n"
                "- visual_elements: list of recurring visual elements seen across the images\n"
                "- style_prompt: a 2-3 sentence description that could be used as a FLUX image generation prompt suffix to replicate this exact visual style. Be specific and detailed.\n"
                "Return ONLY valid JSON, no markdown."
            ),
        },
    ]

    for path in image_paths:
        data, mime = _encode_image(path)
        content_blocks.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{data}"},
        })

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": content_blocks}],
                "max_tokens": 700,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]

        # Parse JSON from response
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse visual style JSON: {content[:200]}")
            return {"style_prompt": content}
