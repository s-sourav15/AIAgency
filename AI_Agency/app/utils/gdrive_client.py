import json
import logging
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def _get_credentials(credentials_path: str):
    """Get credentials — supports both service account and OAuth2 Desktop App."""
    with open(credentials_path) as f:
        creds_data = json.load(f)

    # Service account credentials
    if creds_data.get("type") == "service_account":
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(
            credentials_path, scopes=SCOPES
        )
        logger.info(f"Using service account: {creds.service_account_email}")
        return creds

    # OAuth2 Desktop App credentials
    if "installed" not in creds_data and "web" not in creds_data:
        raise ValueError(
            "Unrecognized credentials format. Expected either:\n"
            "  - OAuth2 Desktop App JSON (has 'installed' key)\n"
            "  - Service Account JSON (has 'type': 'service_account')\n\n"
            "To create OAuth2 Desktop App credentials:\n"
            "  1. Google Cloud Console → APIs & Services → Credentials\n"
            "  2. Create Credentials → OAuth Client ID → Desktop App\n"
            "  3. Download the JSON and set GOOGLE_CREDENTIALS_PATH in .env"
        )

    token_path = os.path.join(os.path.dirname(credentials_path), "gdrive_token.json")
    creds = None

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "w") as f:
            f.write(creds.to_json())

    return creds


class GDriveClient:
    def __init__(self, credentials_path: str):
        creds = _get_credentials(credentials_path)
        self.service = build("drive", "v3", credentials=creds)

    def create_folder(self, name: str, parent_id: str = None) -> str:
        """Create a folder in Drive, return folder ID."""
        metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]
        folder = self.service.files().create(
            body=metadata, fields="id"
        ).execute()
        return folder["id"]

    def upload_image(self, file_path: str, folder_id: str) -> dict:
        """Upload an image file, return {id, link}."""
        filename = os.path.basename(file_path)
        ext = filename.rsplit(".", 1)[-1].lower()
        mime_map = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "webp": "image/webp",
        }
        mime_type = mime_map.get(ext, "image/png")

        metadata = {"name": filename, "parents": [folder_id]}
        media = MediaFileUpload(file_path, mimetype=mime_type)
        file = self.service.files().create(
            body=metadata, media_body=media, fields="id,webViewLink"
        ).execute()

        # Make shareable
        self.service.permissions().create(
            fileId=file["id"],
            body={"type": "anyone", "role": "reader"},
        ).execute()

        return {"id": file["id"], "link": file.get("webViewLink", "")}

    def ensure_folder_structure(
        self, brand_name: str, campaign_date: str, root_folder_id: str = None
    ) -> str:
        """Create Brand Name / Campaign Date folder structure, return folder ID."""
        brand_folder_id = self.create_folder(brand_name, parent_id=root_folder_id)
        date_folder_id = self.create_folder(campaign_date, parent_id=brand_folder_id)
        return date_folder_id
