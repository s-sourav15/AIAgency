import os
import logging
from datetime import datetime

from app.utils.gdrive_client import GDriveClient
from app.utils.notion_client import NotionDelivery

logger = logging.getLogger(__name__)


def upload_images_to_drive(
    images_dir: str,
    brand_name: str,
    credentials_path: str,
    root_folder_id: str = None,
) -> dict[str, str]:
    """Upload all images from local dir to Google Drive.

    Returns mapping: {local_filename: shareable_link}
    """
    if not images_dir or not os.path.exists(images_dir):
        raise FileNotFoundError(f"No images directory at: {images_dir}")

    image_files = sorted(f for f in os.listdir(images_dir) if not f.startswith("."))
    if not image_files:
        raise FileNotFoundError(f"No image files found in: {images_dir}")

    gdrive = GDriveClient(credentials_path)
    campaign_date = datetime.now().strftime("%Y-%m-%d")
    folder_id = gdrive.ensure_folder_structure(brand_name, campaign_date, root_folder_id)

    links = {}
    errors = []
    for filename in image_files:
        filepath = os.path.join(images_dir, filename)
        try:
            result = gdrive.upload_image(filepath, folder_id)
            links[filename] = result["link"]
            logger.info(f"Uploaded {filename} -> {result['link']}")
        except Exception as e:
            error_msg = str(e)
            errors.append(error_msg)
            logger.error(f"Failed to upload {filename}: {e}")
            # If first file fails with quota error, stop early — all will fail
            if "storageQuotaExceeded" in error_msg:
                raise RuntimeError(
                    "Service account has 0 bytes storage quota. "
                    "Create OAuth2 Desktop App credentials instead:\n"
                    "  1. Google Cloud Console → APIs & Services → Credentials\n"
                    "  2. Create Credentials → OAuth Client ID → Desktop App\n"
                    "  3. Download the JSON and set GOOGLE_CREDENTIALS_PATH in .env"
                ) from e

    if not links and errors:
        raise RuntimeError(f"All {len(errors)} uploads failed. First error: {errors[0]}")

    return links


def deliver_to_notion(
    calendar_data: dict,
    brand_name: str,
    notion_token: str,
    notion_page_id: str,
    image_links: dict[str, str] = None,
) -> str:
    """Create a Notion database and populate it with content. Returns database ID."""
    notion = NotionDelivery(notion_token)
    campaign_date = datetime.now().strftime("%Y-%m-%d")
    db_id = notion.create_database(notion_page_id, brand_name, campaign_date)

    image_links = image_links or {}

    added = 0
    failed = 0
    last_error = None

    for day_data in calendar_data.get("days", []):
        day_num = day_data.get("day_number", 0)
        theme = day_data.get("theme", "")
        for piece in day_data.get("pieces", []):
            platform = piece.get("platform", "")

            # Match image filename to Drive link
            img_link = ""
            for ext in ["webp", "png", "jpg", "jpeg"]:
                filename = f"day{day_num}_{platform}.{ext}"
                if filename in image_links:
                    img_link = image_links[filename]
                    break

            copy_text = piece.get("copy_text", piece.get("copy", ""))
            try:
                notion.add_content_entry(
                    database_id=db_id,
                    day=day_num,
                    platform=platform,
                    theme=theme,
                    copy_text=copy_text,
                    hashtags=piece.get("hashtags", []),
                    quality_score=piece.get("validation_score", 0),
                    image_link=img_link,
                )
                added += 1
            except Exception as e:
                failed += 1
                last_error = str(e)
                logger.error(f"Failed to add Day {day_num}/{platform}: {e}")

    logger.info(f"Notion: {added} entries added, {failed} failed for db {db_id}")

    if added == 0 and failed > 0:
        raise RuntimeError(f"All {failed} Notion entries failed. Last error: {last_error}")

    return db_id
