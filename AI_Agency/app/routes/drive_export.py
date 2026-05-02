"""Drive delivery route — symmetric to ``POST /jobs/{id}/export/zip``.

Builds a shareable Google Drive folder for the job and stamps the job
row with ``delivery_type="drive"`` + ``delivery_url=<folder link>``.

Requires the backend to have a working Google credentials file (OAuth
Desktop app or service account) at ``settings.google_credentials_path``.
Returns 503 when credentials are missing so the UI can render a clear
"Drive not configured" state instead of a generic 500.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db
from app.dependencies import get_settings
from app.services.drive_delivery_service import deliver_to_drive

router = APIRouter()


@router.post("/jobs/{job_id}/export/drive")
async def build_job_drive(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    """Create a Drive folder deliverable for a completed job.

    Idempotent-ish: calling twice creates two folders with different
    timestamps. The job row points at the most recent one.
    """
    if not settings.google_credentials_path:
        raise HTTPException(
            status_code=503,
            detail=(
                "Drive delivery is not configured on this backend. "
                "Set GOOGLE_CREDENTIALS_PATH in .env."
            ),
        )

    try:
        result = await deliver_to_drive(
            db,
            job_id,
            credentials_path=settings.google_credentials_path,
            root_folder_id=settings.google_drive_root_folder_id or None,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:  # pragma: no cover — real Drive failures
        raise HTTPException(status_code=502, detail=f"Drive delivery failed: {e}") from e

    return JSONResponse(content=result)
