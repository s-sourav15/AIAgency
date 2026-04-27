from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.export_service import (
    build_zip_archive,
    export_csv,
    export_json,
    zip_size_bytes,
)

router = APIRouter()


@router.get("/content/{brand_id}/export")
async def export_content(
    brand_id: UUID,
    format: str = Query("json", pattern="^(csv|json)$"),
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


@router.post("/jobs/{job_id}/export/zip")
async def build_job_zip(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Build a downloadable ZIP archive for a completed job.

    Packages CSV + JSON + calendar.json + images/ into one zipfile,
    stores it under ``output/_zips/``, and stamps the job row with
    ``delivery_type=zip`` and the file path. Returns the path, piece
    count, and size so the client can decide how to present it.

    Idempotent-ish: calling this twice produces two zip files with
    different timestamps. The job row points at the most recent one.
    """
    try:
        zip_path, piece_count = await build_zip_archive(db, job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    return JSONResponse(content={
        "job_id": str(job_id),
        "delivery_type": "zip",
        "delivery_url": zip_path,
        "size_bytes": zip_size_bytes(zip_path),
        "piece_count": piece_count,
    })


@router.get("/jobs/{job_id}/delivery")
async def get_job_delivery(
    job_id: UUID,
    download: bool = Query(False, description="If true, stream the zip bytes"),
    db: AsyncSession = Depends(get_db),
):
    """Return delivery metadata for a job, or stream the ZIP if ?download=true.

    If the job has no delivery yet (never exported), returns 404.
    """
    from app.models.generation_job import GenerationJob

    job = await db.get(GenerationJob, str(job_id))
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if not job.delivery_type or not job.delivery_url:
        raise HTTPException(
            status_code=404,
            detail="Job has no delivery yet. POST /jobs/{id}/export/zip first.",
        )

    if download and job.delivery_type == "zip":
        import os
        if not os.path.isfile(job.delivery_url):
            raise HTTPException(
                status_code=410,
                detail="Delivery file no longer exists on disk. Re-export.",
            )
        filename = os.path.basename(job.delivery_url)
        return FileResponse(
            job.delivery_url,
            media_type="application/zip",
            filename=filename,
        )

    return JSONResponse(content={
        "job_id": str(job_id),
        "delivery_type": job.delivery_type,
        "delivery_url": job.delivery_url,
        "delivered_at": job.delivered_at.isoformat() if job.delivered_at else None,
        "size_bytes": zip_size_bytes(job.delivery_url) if job.delivery_type == "zip" else None,
    })
