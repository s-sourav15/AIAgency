from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db
from app import database
from app.dependencies import get_settings
from app.schemas.brand import BrandCreate, BrandResponse
from app.services import brand_service
from app.utils.llm_factory import get_llm_client, get_model_name

router = APIRouter()


@router.post("/brands", response_model=BrandResponse)
async def create_brand(
    data: BrandCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    brand = await brand_service.create_brand(db, data)
    await db.flush()

    # Extract voice profile in background if samples provided
    if data.sample_content:
        llm = get_llm_client(settings, role="creator")

        async def extract_voice():
            async with database.async_session_factory() as bg_db:
                await brand_service.extract_voice_profile(
                    bg_db, brand.id, llm, get_model_name(settings, "creator")
                )
            await llm.close()

        background_tasks.add_task(extract_voice)

    return brand


@router.get("/brands", response_model=list[BrandResponse])
async def list_brands(db: AsyncSession = Depends(get_db)):
    return await brand_service.list_brands(db)


@router.get("/brands/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    brand = await brand_service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.put("/brands/{brand_id}/visual-style")
async def update_visual_style(
    brand_id: UUID,
    visual_style: dict,
    db: AsyncSession = Depends(get_db),
):
    brand = await brand_service.get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    brand.visual_style = visual_style
    await db.commit()
    return {"status": "ok"}
