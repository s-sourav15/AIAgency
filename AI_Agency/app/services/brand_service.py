import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.brand import Brand
from app.schemas.brand import BrandCreate
from app.prompts.brand_voice import voice_extraction_prompt

logger = logging.getLogger(__name__)


async def create_brand(db: AsyncSession, data: BrandCreate) -> Brand:
    brand = Brand(
        name=data.name,
        colors=data.colors,
        fonts=data.fonts,
        tone=data.tone,
        industry=data.industry,
        sample_content=data.sample_content,
        description=data.description,
        email=data.email,
    )
    db.add(brand)
    await db.flush()
    return brand


async def get_brand(db: AsyncSession, brand_id: UUID) -> Brand | None:
    result = await db.execute(select(Brand).where(Brand.id == str(brand_id)))
    return result.scalar_one_or_none()


async def list_brands(db: AsyncSession) -> list[Brand]:
    result = await db.execute(select(Brand).order_by(Brand.created_at.desc()))
    return list(result.scalars().all())


async def extract_voice_profile(
    db: AsyncSession, brand_id: UUID, llm_client, model: str
) -> dict | None:
    brand = await get_brand(db, brand_id)
    if not brand or not brand.sample_content:
        return None

    messages = voice_extraction_prompt(brand.name, brand.sample_content)
    try:
        profile = await llm_client.chat_json(model=model, messages=messages, temperature=0.3)
        brand.voice_profile = profile
        await db.commit()
        logger.info(f"Voice profile extracted for brand {brand.name}")
        return profile
    except Exception as e:
        logger.error(f"Voice extraction failed for {brand.name}: {e}")
        return None
