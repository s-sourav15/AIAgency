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

BRAND_NAME = "PlutoApp"

BRAND_DESCRIPTION = """
Pluto is a social discovery app that understands your social comfort, energy levels, and the personalities you want to connect with, then matches you with the right people and real-world experiences.

Unlike existing apps that keep you scrolling, Pluto gently nudges you from screen to scene—building a social media platform for real experiences instead of endless content consumption.

Psych-based matching: We match on social comfort, energy level, and personality—not just interests and location.

Experience-first design: Your feed is plans, scenes, and reflections, not just content to consume.

Screen to scene philosophy: The app's core purpose is to get you offline and into meaningful real-world experiences.

Your personal orbit: Track your connections, experiences, and social patterns over time.

Two Connections, Full Attention: No more juggling fifteen half-hearted conversations. Connect with two people at a time and give each one a real chance.

Verified and Safe: Aadhaar-based identity verification on every profile. SOS emergency contacts for when you're heading out to meet someone. Safety isn't an afterthought.
"""

TONE = "playful, warm, witty, Gen-Z friendly, anti-corporate, real-talk"
INDUSTRY = "social discovery"
COLORS = ["#6C5CE7", "#A29BFE", "#FFEAA7", "#FFFFFF"]
FONTS = ["Inter", "Poppins"]

# Paste 2-5 examples of your brand's existing content/writing style
SAMPLE_CONTENT = [
    "Made in India, Made for India: Whether you're in Delhi, Mumbai, Bangalore, or anywhere in between, Pluto understands what meaningful connection looks like here. Not imported. Not translated. Built from the ground up.",
    "Pluto isn't for people looking to collect options. It's for people ready to actually meet someone. If that's you, welcome.",
    "Unlike existing event and meetup apps that mostly match on location and interest, Pluto understands how you like to socialize—your comfort, energy and personality—and then nudges you from screen to scene, making it the first social media truly built around experiences.",
    "Existing apps either help you swipe on profiles or browse events, but very few understand how you actually feel—your social comfort and energy—before suggesting what to do.",
    "Pluto is building social media for experiences: it learns your orbit—comfort, energy, people, and scenes—and gently nudges you from screen to scene, instead of trapping you in infinite scroll.",
]

# This is the seed text the AI uses to generate content
CONTENT_BRIEF = """
We live in a world where reality is perceived through reels and photos online. This has created three major challenges: Rising urban isolation—despite being digitally hyperconnected, people feel increasingly lonely and disconnected from real human interaction. Digital platform addiction—users are trapped in endless scrolling, consuming content rather than creating experiences. Consumer culture dominance—the majority of platform users are passive consumers rather than active curators of their own lives.

We experience this ourselves—the disconnect between our online personas and our real-world experiences.

That's why we created Pluto – Find Your Orbit.

Pluto is a social discovery app that understands your social comfort, energy levels, and the personalities you want to connect with, then matches you with the right people and real-world experiences. Unlike existing apps that keep you scrolling, Pluto gently nudges you from screen to scene—building a social media platform for real experiences instead of endless content consumption.

Psych-based matching: We match on social comfort, energy level, and personality—not just interests and location. Experience-first design: Your feed is plans, scenes, and reflections, not just content to consume. Screen to scene philosophy: The app's core purpose is to get you offline and into meaningful real-world experiences. Your personal orbit: Track your connections, experiences, and social patterns over time.

India's "experience economy" is growing rapidly, with offline experiences becoming social currency for young urban users. Screen fatigue is real, and people are actively seeking authentic connections and meaningful activities. The timing is perfect: users want tools that help them reclaim real life, not more platforms that trap them online.

No competitor has claimed "social comfort + energy matching" combined with "screen to scene" positioning. The model works across life stages, cities, and demographic segments. Pluto is Meetup for the short-form, mobile-native generation—focusing on personal comfort, micro-plans, and an experience-style feed instead of large formal groups.

Pluto avoids the dating-first framing, focusing on safe, comfort-aligned social experiences and anti-catfishing/over-optimized profile culture. Every profile is verified through Aadhaar-based identity checks. Built-in SOS features let you alert your emergency contacts instantly.

Launch with curated events offering incentives—free vouchers, exclusive experiences—to build the initial user base. Machine learning models improve matching accuracy over time based on user behavior and feedback. Track "scenes completed" as the key success metric—measure actual offline experiences, not just app engagement.
"""

# Which platforms to generate content for
PLATFORMS = ["instagram", "twitter", "linkedin"]

# (Optional) Reference images for visual style extraction.
# The model analyzes ALL images together to understand your overall visual theme.
# Add 2-5 representative brand images (social posts, ads, product shots, etc.)
BRAND_ILLUSTRATIONS = [
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-00.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-06.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-11.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-13.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-16.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-18.jpg",
    "/Users/soumyasourav/Downloads/Telegram Desktop/photo_2026-03-10_22-02-21.jpg"
    # "/path/to/another/brand_image.png",
    # "/path/to/social_post_screenshot.jpg",
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
