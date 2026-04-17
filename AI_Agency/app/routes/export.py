from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.export_service import export_csv, export_json

router = APIRouter()


@router.get("/content/{brand_id}/export")
async def export_content(
    brand_id: UUID,
    format: str = Query("json", regex="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
):
    if format == "csv":
        csv_data = await export_csv(db, brand_id)
        return PlainTextResponse(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={brand_id}_content.csv"},
        )
    else:
        data = await export_json(db, brand_id)
        return JSONResponse(content=data)
