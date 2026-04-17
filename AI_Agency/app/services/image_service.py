import asyncio
import logging
import os
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import Settings
from app.models.brand import Brand
from app.models.content_piece import ContentPiece
from app.utils.replicate_client import ReplicateClient

logger = logging.getLogger(__name__)

PLATFORM_ASPECT = {
    "instagram": "1:1",
    "twitter": "16:9",
    "linkedin": "16:9",
    "ads": "9:16",
    "email": "16:9",
}


def _build_image_prompt(
    copy: str,
    platform: str,
    brand_name: str,
    brand_description: str,
    colors: list,
    visual_style: dict | None = None,
) -> str:
    """Turn content copy into an image generation prompt."""
    color_str = ", ".join(colors[:3]) if colors else "vibrant purple and gold"
    copy_snippet = copy[:200].replace('"', "").replace("\n", " ")

    # Use extracted visual style if available
    if visual_style and visual_style.get("style_prompt"):
        style_block = visual_style["style_prompt"]
        art_style = visual_style.get("art_style", "illustration")
        mood = visual_style.get("mood", "modern")
        return (
            f"{art_style} style visual for {platform} post. "
            f"Brand: {brand_name}. Color palette: {color_str}. "
            f"Context: {copy_snippet}. "
            f"Mood: {mood}. "
            f"{style_block} "
            f"No text, no watermarks, no logos. High quality, 4K."
        )

    # Default prompt
    return (
        f"Modern illustration style social media visual for {platform}. "
        f"Brand: {brand_name} — {brand_description[:100]}. "
        f"Color palette: {color_str}. "
        f"Context: {copy_snippet}. "
        f"Style: clean illustration, trendy Gen-Z aesthetic, no text overlays, "
        f"bold colors, flat design with depth, Indian urban setting. "
        f"High quality, 4K, professional social media content."
    )


async def _download_image(url: str, save_path: str) -> bool:
    """Download image from URL and save locally."""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(resp.content)
            return True
    except Exception as e:
        logger.error(f"Failed to download image: {e}")
        return False


async def generate_images_for_job(
    job_id: UUID,
    session_factory: async_sessionmaker,
    settings: Settings,
):
    """Generate one image per content piece using FLUX, sequentially to avoid rate limits."""
    if not settings.replicate_api_token:
        logger.info("No Replicate token — skipping image generation")
        return

    replicate = ReplicateClient(settings.replicate_api_token)

    try:
        async with session_factory() as db:
            result = await db.execute(
                select(ContentPiece).where(ContentPiece.job_id == job_id)
            )
            pieces = list(result.scalars().all())
            if not pieces:
                return

            brand = await db.get(Brand, pieces[0].brand_id)
            brand_name = brand.name
            brand_desc = brand.description or ""
            colors = brand.colors or []
            visual_style = brand.visual_style

        # Create output directory
        safe_name = brand_name.lower().replace(" ", "_")
        images_dir = os.path.join("output", safe_name, "images")
        os.makedirs(images_dir, exist_ok=True)

        generated = 0
        failed = 0

        for piece in pieces:
            prompt = _build_image_prompt(
                piece.copy, piece.platform, brand_name, brand_desc, colors,
                visual_style=visual_style,
            )

            # Retry with backoff for rate limits
            image_url = None
            for attempt in range(3):
                image_url = await replicate.generate_image(
                    prompt=prompt,
                    aspect_ratio=PLATFORM_ASPECT.get(piece.platform, "1:1"),
                )
                if image_url:
                    break
                if attempt < 2:
                    wait = (attempt + 1) * 10  # 10s, 20s backoff
                    logger.info(f"Rate limited, waiting {wait}s before retry...")
                    await asyncio.sleep(wait)

            if image_url:
                # Download image locally before Replicate URL expires
                ext = image_url.rsplit(".", 1)[-1].split("?")[0] if "." in image_url else "webp"
                filename = f"day{piece.day_number}_{piece.platform}.{ext}"
                local_path = os.path.join(images_dir, filename)

                downloaded = await _download_image(image_url, local_path)

                async with session_factory() as db:
                    p = await db.get(ContentPiece, piece.id)
                    if p:
                        p.image_urls = [local_path if downloaded else image_url]
                        await db.commit()
                generated += 1
                logger.info(f"Image {generated}/{len(pieces)} saved: {filename}")
            else:
                failed += 1
                logger.warning(f"Image gen failed for piece {piece.id} after 3 attempts")

            # Delay between requests to avoid rate limits
            await asyncio.sleep(5)

        logger.info(f"Job {job_id}: images done — {generated} generated, {failed} failed")
    except Exception as e:
        logger.error(f"Image generation error for job {job_id}: {e}", exc_info=True)
        raise  # Let pipeline see the failure
    finally:
        await replicate.close()
