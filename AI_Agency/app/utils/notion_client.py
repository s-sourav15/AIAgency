import logging
import time
from datetime import datetime

from notion_client import Client

logger = logging.getLogger(__name__)


EXTRA_PROPERTIES = {
    "Day": {"number": {}},
    "Platform": {
        "select": {
            "options": [
                {"name": "instagram", "color": "pink"},
                {"name": "twitter", "color": "blue"},
                {"name": "linkedin", "color": "default"},
                {"name": "ads", "color": "orange"},
                {"name": "email", "color": "green"},
            ]
        }
    },
    "Theme": {"rich_text": {}},
    "Copy": {"rich_text": {}},
    "Hashtags": {"rich_text": {}},
    "Quality Score": {"number": {"format": "percent"}},
    "Image": {"url": {}},
    "Status": {
        "select": {
            "options": [
                {"name": "Draft", "color": "gray"},
                {"name": "Ready", "color": "green"},
                {"name": "Published", "color": "blue"},
            ]
        }
    },
}


class NotionDelivery:
    def __init__(self, token: str):
        self.client = Client(auth=token)

    def create_database(self, parent_page_id: str, brand_name: str, campaign_date: str) -> str:
        """Create a Notion database for this campaign. Returns database ID."""
        # Step 1: Create database with title property only
        response = self.client.databases.create(
            parent={"type": "page_id", "page_id": parent_page_id},
            title=[{"type": "text", "text": {"content": f"{brand_name} — {campaign_date}"}}],
            properties={"Name": {"title": {}}},
        )
        db_id = response["id"]
        logger.info(f"Notion database created: {db_id}")

        # Step 2: Add all other properties via update
        self.client.databases.update(
            database_id=db_id,
            properties=EXTRA_PROPERTIES,
        )

        # Step 3: Verify
        db = self.client.databases.retrieve(database_id=db_id)
        props = list(db.get("properties", {}).keys())
        logger.info(f"Notion database properties: {props}")

        expected = set(EXTRA_PROPERTIES.keys()) | {"Name"}
        missing = expected - set(props)
        if missing:
            raise RuntimeError(f"Notion database missing properties after update: {missing}")

        return db_id

    def add_content_entry(
        self,
        database_id: str,
        day: int,
        platform: str,
        theme: str,
        copy_text: str,
        hashtags: list[str],
        quality_score: float,
        image_link: str = "",
    ):
        """Add one content piece as a row in the Notion database."""
        # Notion rich_text has a 2000-char limit per block
        copy_truncated = copy_text[:2000] if copy_text else ""
        hashtags_str = " ".join(f"#{h}" for h in hashtags)[:2000] if hashtags else ""

        properties = {
            "Name": {"title": [{"text": {"content": f"Day {day} — {platform.capitalize()}"}}]},
            "Day": {"number": day},
            "Platform": {"select": {"name": platform}},
            "Theme": {"rich_text": [{"text": {"content": theme or ""}}]},
            "Copy": {"rich_text": [{"text": {"content": copy_truncated}}]},
            "Hashtags": {"rich_text": [{"text": {"content": hashtags_str}}]},
            "Quality Score": {"number": quality_score or 0},
            "Status": {"select": {"name": "Ready" if (quality_score or 0) >= 0.8 else "Draft"}},
        }
        if image_link:
            properties["Image"] = {"url": image_link}

        self.client.pages.create(
            parent={"database_id": database_id},
            properties=properties,
        )

        # Small delay to avoid Notion rate limits (3 req/s)
        time.sleep(0.4)
