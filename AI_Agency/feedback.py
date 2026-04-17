"""
Feedback Runner
===============
1. Fill in the FEEDBACK section below (text, images, or both)
2. Run: python feedback.py
3. Revised files saved to output/{BRAND_NAME}/

The server must be running (for voice profile + DB sync).
"""

import asyncio
import csv
import json
import os
import sys

import httpx

BASE_URL = "http://localhost:8000/api"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INPUT — Fill in your feedback
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND_NAME = "PlutoApp"  # must match run.py

# ── TEXT FEEDBACK ─────────────────────────────────────────────────

# Global text feedback — appended to EVERY piece being regenerated.
GLOBAL_TEXT_FEEDBACK = """
"""

# Per-piece text feedback: {day: {platform: "feedback"}}
# Leave "" or omit a platform to skip.
TEXT_FEEDBACK = {
    1: {
        "instagram": "Too long. Cut to 3 lines max. Open with a bolder hook.",
        "linkedin": "Needs to mention Aadhaar verification for trust/safety angle.",
        "twitter": "",  # blank = skip
    },
    # 2: {
    #     "instagram": "Add a question at the end to drive comments.",
    # },
}

# ── IMAGE FEEDBACK ────────────────────────────────────────────────

# Global image feedback — appended to EVERY image being regenerated.
# Use this for style-wide changes (e.g. "warmer tones", "no abstract shapes").
GLOBAL_IMAGE_FEEDBACK = """
"""

# Per-piece image feedback: {day: {platform: "feedback"}}
# Describe what to change about the image.
IMAGE_FEEDBACK = {
    # 1
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # 
    # . "linkedin": "Needs a more professional look. Office setting, clean lines.",
    # },
}

# ── REGENERATE ALL ────────────────────────────────────────────────

# Set True to regenerate ALL text using GLOBAL_TEXT_FEEDBACK
REGENERATE_ALL_TEXT = False

# Set True to regenerate ALL images using GLOBAL_IMAGE_FEEDBACK
REGENERATE_ALL_IMAGES = False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# END OF INPUT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLATFORM_ASPECT = {
    "instagram": "1:1",
    "twitter": "16:9",
    "linkedin": "16:9",
    "ads": "9:16",
    "email": "16:9",
}


def _build_image_prompt(
    copy: str,
    platform: str,
    brand_name: str,
    brand_description: str,
    colors: list,
    visual_style: dict | None,
    feedback: str,
) -> str:
    """Build a FLUX image prompt incorporating feedback."""
    color_str = ", ".join(colors[:3]) if colors else "vibrant purple and gold"
    copy_snippet = copy[:200].replace('"', "").replace("\n", " ")

    if visual_style and visual_style.get("style_prompt"):
        style_block = visual_style["style_prompt"]
        art_style = visual_style.get("art_style", "illustration")
        mood = visual_style.get("mood", "modern")
        base = (
            f"{art_style} style visual for {platform} post. "
            f"Brand: {brand_name}. Color palette: {color_str}. "
            f"Context: {copy_snippet}. Mood: {mood}. "
            f"{style_block} "
        )
    else:
        base = (
            f"Modern illustration style social media visual for {platform}. "
            f"Brand: {brand_name} — {brand_description[:100]}. "
            f"Color palette: {color_str}. "
            f"Context: {copy_snippet}. "
            f"Style: clean illustration, trendy Gen-Z aesthetic, bold colors, "
            f"flat design with depth, Indian urban setting. "
        )

    # Inject feedback as priority instructions
    base += f"IMPORTANT ADJUSTMENTS: {feedback}. "
    base += "No text, no watermarks, no logos. High quality, 4K."
    return base


async def _download_image(url: str, save_path: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            with open(save_path, "wb") as f:
                f.write(resp.content)
            return True
    except Exception as e:
        print(f"  [warn] Image download failed: {e}")
        return False


async def run_feedback():
    # ── Load calendar ──────────────────────────────────────────────
    out_dir = os.path.join("output", BRAND_NAME.lower().replace(" ", "_"))
    cal_path = os.path.join(out_dir, "calendar.json")
    images_dir = os.path.join(out_dir, "images")

    if not os.path.exists(cal_path):
        print(f"No calendar found at {cal_path}. Run run.py first.")
        sys.exit(1)

    with open(cal_path) as f:
        calendar = json.load(f)

    brand_id = calendar["brand_id"]

    # ── Check server ───────────────────────────────────────────────
    try:
        httpx.get("http://localhost:8000/health", timeout=5)
    except Exception:
        print("Server not running. Start it first:")
        print("  cd AI_Agency && source venv/bin/activate && uvicorn main:app --port 8000")
        sys.exit(1)

    # ── Load brand data ────────────────────────────────────────────
    r = httpx.get(f"{BASE_URL}/brands/{brand_id}", timeout=10)
    r.raise_for_status()
    brand_data = r.json()
    brand_name = brand_data["name"]
    brand_description = brand_data.get("description") or ""
    colors = brand_data.get("colors") or []
    visual_style = brand_data.get("visual_style")
    voice_profile = brand_data.get("voice_profile") or {}

    # ── Set up LLM + Replicate ─────────────────────────────────────
    from app.config import Settings
    from app.utils.llm_factory import get_llm_client, get_model_name
    from app.prompts.copy_generation import regeneration_prompt
    from app.prompts.brand_voice import voice_injection_block

    settings = Settings()
    llm = get_llm_client(settings, role="creator")
    model = get_model_name(settings, role="creator")
    voice_block = voice_injection_block(brand_name, voice_profile)

    # Replicate client for image regen
    replicate = None
    if settings.replicate_api_token:
        from app.utils.replicate_client import ReplicateClient
        replicate = ReplicateClient(settings.replicate_api_token)

    print(f"\n{'='*60}")
    print(f"  Feedback Runner — {brand_name}")
    print(f"  Model: {model}")
    if replicate:
        print(f"  Images: FLUX via Replicate")
    else:
        print(f"  Images: skipped (no REPLICATE_API_TOKEN)")
    print(f"{'='*60}\n")

    text_modified = 0
    images_modified = 0

    try:
        for day_data in calendar["days"]:
            day_num = day_data["day_number"]

            for piece in day_data["pieces"]:
                platform = piece["platform"]

                # ── TEXT FEEDBACK ─────────────────────────────────
                text_fb = _resolve_feedback(
                    day_num, platform,
                    GLOBAL_TEXT_FEEDBACK, TEXT_FEEDBACK, REGENERATE_ALL_TEXT,
                )

                if text_fb:
                    original = piece.get("copy", piece.get("copy_text", ""))

                    print(f"Day {day_num} — {platform.upper()} [TEXT]")
                    print(f"  Original : {original[:120].replace(chr(10), ' ')}...")
                    print(f"  Feedback : {text_fb[:120]}")

                    messages = regeneration_prompt(
                        platform=platform,
                        original_copy=original,
                        feedback=text_fb,
                        voice_block=voice_block,
                        brand_name=brand_name,
                    )
                    result = await llm.chat_json(
                        model=model,
                        messages=messages,
                        temperature=0.8,
                        max_tokens=1024,
                    )

                    new_copy = result.get("copy", original)
                    new_hashtags = result.get("hashtags", piece.get("hashtags", []))

                    print(f"  Revised  : {new_copy[:120].replace(chr(10), ' ')}...")
                    print()

                    piece["copy"] = new_copy
                    piece["copy_text"] = new_copy
                    piece["hashtags"] = new_hashtags
                    piece.setdefault("feedback_history", []).append({
                        "type": "text",
                        "feedback": text_fb,
                        "original": original,
                    })

                    # Sync to DB
                    _sync_piece_to_db(piece.get("id"), {"copy": new_copy, "hashtags": new_hashtags})
                    text_modified += 1

                # ── IMAGE FEEDBACK ────────────────────────────────
                image_fb = _resolve_feedback(
                    day_num, platform,
                    GLOBAL_IMAGE_FEEDBACK, IMAGE_FEEDBACK, REGENERATE_ALL_IMAGES,
                )

                if image_fb and replicate:
                    copy_for_prompt = piece.get("copy", piece.get("copy_text", ""))

                    print(f"Day {day_num} — {platform.upper()} [IMAGE]")
                    print(f"  Feedback : {image_fb[:120]}")

                    prompt = _build_image_prompt(
                        copy=copy_for_prompt,
                        platform=platform,
                        brand_name=brand_name,
                        brand_description=brand_description,
                        colors=colors,
                        visual_style=visual_style,
                        feedback=image_fb,
                    )
                    print(f"  Prompt   : {prompt[:120]}...")

                    aspect = PLATFORM_ASPECT.get(platform, "1:1")
                    image_url = None
                    for attempt in range(3):
                        image_url = await replicate.generate_image(
                            prompt=prompt,
                            aspect_ratio=aspect,
                        )
                        if image_url:
                            break
                        if attempt < 2:
                            wait = (attempt + 1) * 10
                            print(f"  Retrying in {wait}s...")
                            await asyncio.sleep(wait)

                    if image_url:
                        os.makedirs(images_dir, exist_ok=True)
                        ext = image_url.rsplit(".", 1)[-1].split("?")[0] if "." in image_url else "webp"
                        filename = f"day{day_num}_{platform}.{ext}"
                        local_path = os.path.join(images_dir, filename)

                        if await _download_image(image_url, local_path):
                            piece["image_urls"] = [local_path]
                            print(f"  Saved    : {local_path}")
                        else:
                            piece["image_urls"] = [image_url]
                            print(f"  URL      : {image_url[:80]}...")

                        piece.setdefault("feedback_history", []).append({
                            "type": "image",
                            "feedback": image_fb,
                            "prompt": prompt,
                        })
                        images_modified += 1
                        await asyncio.sleep(5)  # rate limit between images
                    else:
                        print(f"  FAILED after 3 attempts")

                    print()

                elif image_fb and not replicate:
                    print(f"Day {day_num} — {platform.upper()} [IMAGE] skipped — no REPLICATE_API_TOKEN in .env")

    finally:
        await llm.close()
        if replicate:
            await replicate.close()

    total = text_modified + images_modified
    if total == 0:
        print("No pieces were regenerated.")
        print("  → Add feedback to TEXT_FEEDBACK / IMAGE_FEEDBACK,")
        print("    or set REGENERATE_ALL_TEXT / REGENERATE_ALL_IMAGES = True.")
        return

    # ── Save revised outputs ───────────────────────────────────────
    revised_cal = os.path.join(out_dir, "calendar_revised.json")
    with open(revised_cal, "w") as f:
        json.dump(calendar, f, indent=2)

    revised_csv = os.path.join(out_dir, "content_revised.csv")
    _write_csv(calendar, revised_csv)

    print(f"\n{'='*60}")
    print(f"  {text_modified} text piece(s) regenerated")
    print(f"  {images_modified} image(s) regenerated")
    print(f"  Calendar : {revised_cal}")
    print(f"  CSV      : {revised_csv}")
    print(f"{'='*60}\n")


def _resolve_feedback(
    day_num: int,
    platform: str,
    global_fb: str,
    per_piece_fb: dict,
    regenerate_all: bool,
) -> str | None:
    """Return combined feedback string, or None if no feedback for this piece."""
    if regenerate_all:
        combined = global_fb.strip()
        return combined if combined else None

    piece_fb = per_piece_fb.get(day_num, {}).get(platform, "").strip()
    if not piece_fb:
        return None

    parts = [p for p in [global_fb.strip(), piece_fb] if p]
    return "\n".join(parts)


def _sync_piece_to_db(piece_id: str | None, update: dict):
    """Best-effort sync updated piece back to server DB."""
    if not piece_id:
        return
    try:
        httpx.patch(
            f"{BASE_URL}/content/pieces/{piece_id}",
            json=update,
            timeout=10,
        )
    except Exception as e:
        print(f"  [warn] DB sync failed for {piece_id}: {e}")


def _write_csv(calendar: dict, path: str):
    rows = []
    for day_data in calendar.get("days", []):
        day_num = day_data["day_number"]
        theme = day_data.get("theme", "")
        for piece in day_data.get("pieces", []):
            copy = piece.get("copy", piece.get("copy_text", ""))
            hashtags = " ".join(f"#{h}" for h in piece.get("hashtags", []))
            image = ""
            urls = piece.get("image_urls", [])
            if urls:
                image = urls[0]
            feedback = ""
            history = piece.get("feedback_history", [])
            if history:
                feedback = history[-1].get("feedback", "")
            rows.append({
                "day": day_num,
                "theme": theme,
                "platform": piece.get("platform", ""),
                "copy": copy,
                "hashtags": hashtags,
                "image": image,
                "quality_score": piece.get("validation_score", ""),
                "feedback_applied": feedback,
            })

    if not rows:
        return

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    asyncio.run(run_feedback())
