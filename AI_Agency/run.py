"""
AI Content Engine — Runner Script
==================================
Edit the INPUT section below, then run:
    python run.py

It will:
1. Create your brand + extract voice profile
2. Generate N days of content (copy + images)
3. Validate quality with LLM scoring loop
4. Show results + export to CSV/JSON
"""

import asyncio
import httpx
import time
import json
import sys
import os

BASE_URL = "http://localhost:8000/api"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INPUT — Edit this section
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND_NAME = "YourBrand"

BRAND_DESCRIPTION = """
A 1-2 paragraph description of your brand: what you make, who it's for, what makes it different.
Be specific. Use concrete words. Avoid marketing-speak.
Example: "A direct-to-consumer skincare line for Indian urban women in their 20s-30s. Cold-processed, ayurveda-inspired, priced between mass-market and luxury. Ships from Bangalore."
"""

TONE = "conversational, confident, anti-corporate"
INDUSTRY = "d2c"
COLORS = ["#000000", "#FFFFFF"]
FONTS = ["Inter"]

# Paste 2-5 examples of your brand's existing content/writing style
SAMPLE_CONTENT = [
    "Example post 1 — paste a real caption or tweet from your brand here.",
    "Example post 2 — another real example of how your brand writes.",
    "Example post 3 — one more, ideally from a different platform or tone.",
]

# This is the seed text the AI uses to generate content.
# Paste a blog post, product description, brand story, or positioning doc.
CONTENT_BRIEF = """
Paste your brand's seed content here: a blog post, product description, brand story,
positioning doc, or anything else that captures what you want to talk about.

The AI uses this as source material for the 30-day calendar. More specificity → better output.
Aim for 200-800 words of your actual brand voice.
"""

# Which platforms to generate content for
PLATFORMS = ["instagram", "twitter", "linkedin"]

# (Optional) Reference images for visual style extraction.
# The model analyzes ALL images together to understand your overall visual theme.
# Add 2-5 representative brand images (social posts, ads, product shots, etc.)
# Paths can be absolute or relative to this script.
BRAND_ILLUSTRATIONS = [
    # "/absolute/path/to/brand_image_1.jpg",
    # "/absolute/path/to/brand_image_2.jpg",
    # "relative/path/to/brand_image_3.png",
]

# How many days of content to generate
NUM_DAYS = 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# END OF INPUT — Don't edit below this line
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def main():
    # Check server
    try:
        httpx.get("http://localhost:8000/health", timeout=5)
    except Exception:
        print("Server not running. Start it first:")
        print("  cd AI_Agency && source venv/bin/activate && uvicorn main:app --port 8000")
        sys.exit(1)

    client = httpx.Client(base_url=BASE_URL, timeout=30)

    print(f"\n{'='*60}")
    print(f"  AI Content Engine")
    print(f"  Brand: {BRAND_NAME}")
    print(f"  Days: {NUM_DAYS}")
    print(f"  Platforms: {', '.join(PLATFORMS)}")
    print(f"{'='*60}\n")

    # Step 1: Create brand
    print("[1/7] Creating brand...")
    brand_data = {
        "name": BRAND_NAME,
        "colors": COLORS,
        "fonts": FONTS,
        "tone": TONE,
        "industry": INDUSTRY,
        "description": BRAND_DESCRIPTION.strip(),
        "sample_content": SAMPLE_CONTENT,
    }
    r = client.post("/brands", json=brand_data)
    r.raise_for_status()
    brand = r.json()
    brand_id = brand["id"]
    print(f"       Brand created: {brand_id}")

    # Step 1b: Extract visual style from reference images
    valid_images = [p for p in BRAND_ILLUSTRATIONS if p and os.path.exists(p)]
    if valid_images:
        print(f"[1b/7] Analyzing {len(valid_images)} reference image(s) for visual style...")
        try:
            from app.config import Settings
            from app.utils.vision_client import extract_visual_style
            settings = Settings()
            visual_style = asyncio.run(extract_visual_style(valid_images, settings.openai_api_key))
            import httpx as hx
            hx.put(
                f"http://localhost:8000/api/brands/{brand_id}/visual-style",
                json=visual_style,
                timeout=30,
            )
            print(f"       Visual style: {visual_style.get('art_style', 'extracted')}, mood: {visual_style.get('mood', 'N/A')}")
        except Exception as e:
            print(f"       Visual style extraction failed: {e}, continuing with defaults.")
    elif BRAND_ILLUSTRATIONS:
        missing = [p for p in BRAND_ILLUSTRATIONS if p and not os.path.exists(p)]
        if missing:
            print(f"       Warning: image(s) not found: {', '.join(missing)}")

    # Step 2: Wait for voice extraction
    print("[2/7] Extracting brand voice profile...")
    for i in range(20):
        time.sleep(3)
        r = client.get(f"/brands/{brand_id}")
        r.raise_for_status()
        b = r.json()
        if b["voice_profile"]:
            vp = b["voice_profile"]
            tone_words = vp.get("tone_words", [])
            print(f"       Voice: {', '.join(str(t) for t in tone_words[:5])}")
            break
        sys.stdout.write(".")
        sys.stdout.flush()
    else:
        print("\n       Voice extraction timed out, continuing anyway.")

    # Step 3: Generate content
    print(f"[3/7] Generating {NUM_DAYS}-day content calendar...")
    gen_data = {
        "brand_id": brand_id,
        "input_type": "text",
        "input_data": CONTENT_BRIEF.strip(),
        "platforms": PLATFORMS,
        "num_days": NUM_DAYS,
    }
    r = client.post("/generate", json=gen_data)
    r.raise_for_status()
    job = r.json()
    job_id = job["id"]
    print(f"       Job started: {job_id}")

    # Poll for completion
    status_labels = {
        "pending": "queued...",
        "strategizing": f"planning {NUM_DAYS}-day calendar...",
        "creating": "writing copy for each platform...",
        "validating": "LLM quality check + regeneration...",
        "generating_images": "generating images with FLUX...",
        "completed": "done!",
        "failed": "FAILED",
    }
    last_status = ""
    for i in range(120):  # 10 min max (images take longer)
        time.sleep(5)
        r = client.get(f"/jobs/{job_id}")
        r.raise_for_status()
        j = r.json()
        status = j["status"]
        if status != last_status:
            print(f"       {status_labels.get(status, status)}")
            last_status = status
        if status in ("completed", "failed"):
            if status == "failed":
                print(f"       Error: {j.get('error_message', 'unknown')}")
                sys.exit(1)
            break
    else:
        print("       Timed out waiting for generation.")
        sys.exit(1)

    # Step 4: Show results
    print(f"[4/7] Fetching results...\n")

    r = client.get(f"/jobs/{job_id}/stats")
    r.raise_for_status()
    stats = r.json()
    print(f"{'='*60}")
    print(f"  RESULTS")
    print(f"  Total pieces:  {stats['total_pieces']}")
    print(f"  Validated:     {stats['validated_pieces']}")
    print(f"  Avg quality:   {stats['average_quality_score']:.2f}")
    print(f"  Regenerations: {stats['total_regenerations']}")
    print(f"{'='*60}\n")

    # Calendar
    r = client.get(f"/content/{brand_id}/calendar")
    r.raise_for_status()
    cal = r.json()

    images_count = 0
    for day in cal["days"]:
        print(f"--- Day {day['day_number']} | {day.get('theme', '')} ---")
        for p in day["pieces"]:
            copy = p.get("copy_text", p.get("copy", ""))
            score = p.get("validation_score")
            score_str = f"{score:.2f}" if score else "N/A"
            imgs = p.get("image_urls", [])
            img_str = f" | img: {imgs[0][:60]}..." if imgs else ""
            if imgs:
                images_count += 1
            print(f"  [{p['platform']}] (score: {score_str}){img_str}")
            print(f"  {copy[:200]}")
            tags = p.get("hashtags", [])
            if tags:
                print(f"  {' '.join('#'+str(t) for t in tags[:5])}")
            print()

    if images_count:
        print(f"  Images generated: {images_count}")

    # Step 5: Export
    print(f"[5/7] Exporting...\n")

    # Output dir: output/{brand_name}/
    out_dir = os.path.join("output", BRAND_NAME.lower().replace(" ", "_"))
    os.makedirs(out_dir, exist_ok=True)

    # CSV
    r = httpx.get(f"http://localhost:8000/api/content/{brand_id}/export?format=csv", timeout=30)
    r.raise_for_status()
    csv_path = os.path.join(out_dir, "content.csv")
    with open(csv_path, "w") as f:
        f.write(r.text)
    print(f"  CSV:      {csv_path}")

    # JSON
    r = httpx.get(f"http://localhost:8000/api/content/{brand_id}/export?format=json", timeout=30)
    r.raise_for_status()
    json_path = os.path.join(out_dir, "content.json")
    with open(json_path, "w") as f:
        json.dump(r.json(), f, indent=2)
    print(f"  JSON:     {json_path}")

    # Full calendar with metadata
    cal_path = os.path.join(out_dir, "calendar.json")
    with open(cal_path, "w") as f:
        json.dump(cal, f, indent=2)
    print(f"  Calendar: {cal_path}")

    # Count images
    images_dir = os.path.join(out_dir, "images")
    if os.path.exists(images_dir):
        img_files = [f for f in os.listdir(images_dir) if not f.startswith(".")]
        print(f"  Images:   {images_dir}/ ({len(img_files)} files)")
    else:
        print(f"  Images:   none")

    # Step 6: Deliver to Google Drive + Notion
    from app.config import Settings as _Settings
    _settings = _Settings()

    image_links = {}

    # 6a: Upload images to Google Drive
    if _settings.google_credentials_path and os.path.exists(_settings.google_credentials_path):
        print(f"[6/7] Uploading images to Google Drive...")
        try:
            from app.services.delivery_service import upload_images_to_drive
            image_links = upload_images_to_drive(
                images_dir=images_dir,
                brand_name=BRAND_NAME,
                credentials_path=_settings.google_credentials_path,
                root_folder_id=_settings.google_drive_root_folder_id or None,
            )
            print(f"       Uploaded {len(image_links)} images to Drive")
            for fname, link in image_links.items():
                print(f"         {fname} → {link[:60]}...")
        except Exception as e:
            print(f"       Drive upload failed: {e}")
    else:
        print(f"[6/7] Skipping Google Drive (no credentials configured)")

    # 6b: Deliver to Notion
    if _settings.notion_token and _settings.notion_page_id:
        print(f"[7/7] Creating Notion content database...")
        try:
            from app.services.delivery_service import deliver_to_notion
            db_id = deliver_to_notion(
                calendar_data=cal,
                brand_name=BRAND_NAME,
                notion_token=_settings.notion_token,
                notion_page_id=_settings.notion_page_id,
                image_links=image_links,
            )
            print(f"       Notion database created: {db_id}")
        except Exception as e:
            print(f"       Notion delivery failed: {e}")
    else:
        print(f"[7/7] Skipping Notion (no token configured)")

    print(f"\nDone! {NUM_DAYS}-day content calendar exported to: {out_dir}/")


if __name__ == "__main__":
    main()
