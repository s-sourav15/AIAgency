# Delivery — ZIP vs Drive

How Utsuk hands a completed 30-day calendar back to the client.

Every generation job ends with a "deliverable" — the packaged output a
brand owner actually uses. There are two delivery modes, and the pipeline
picks based on `DELIVERY_MODE` in your `.env`.

## Modes

| Mode      | What the client gets                                   | When to use                                |
| --------- | ------------------------------------------------------ | ------------------------------------------ |
| `zip`     | Local ZIP file — CSV + JSON + `calendar.json` + images | Dev / self-hosted / no Google account      |
| `drive`   | Shareable Google Drive folder + Google Doc             | Demos, real clients, "agency-feel" output  |
| `both`    | Builds ZIP first, then uploads to Drive                | Production — Drive for UX, ZIP for backup  |

Set via `DELIVERY_MODE=drive` (or `zip` / `both`) in the backend env.
Default is `zip`.

## What a Drive delivery looks like

```
Utsuk Deliveries /
  └── Pluto /
        └── 2026-05-02 0642 UTC /                 ← shareable folder
              ├── Pluto — 30-Day Content Calendar ← Google Doc
              ├── content.csv                      ← Buffer/Hootsuite
              ├── content.json                     ← raw data
              ├── calendar.json                    ← strategy + themes
              └── images /
                    ├── day1_instagram.webp
                    ├── day2_twitter.webp
                    └── ...
```

The folder is set to "anyone with the link can view" — the job row gets
stamped with that URL and the frontend renders an **Open in Drive**
button on the status page.

## Setup — service account (recommended for server-side)

1. Google Cloud Console → create a project (or reuse one)
2. Enable the **Google Drive API**
3. Credentials → Create credentials → Service account
4. Download the JSON key file
5. Copy the service account email (ends in `@<project>.iam.gserviceaccount.com`)
6. On your own Google Drive, create a folder ("Utsuk Deliveries" or
   anything) and **share it with the service account email** as Editor.
   Copy the folder ID from the URL.
7. Put it in `.env`:

   ```sh
   GOOGLE_CREDENTIALS_PATH=/abs/path/to/service-account.json
   GOOGLE_DRIVE_ROOT_FOLDER_ID=1aBcDeFgH...          # optional; if unset
                                                     # we create our own
                                                     # root on first run
   DELIVERY_MODE=drive                               # or "both"
   ```

> ⚠️ **Service accounts have 0 bytes of their own Drive storage.** They
> can only write into folders a human owner has shared with them. Hence
> step 6 — mandatory.

## Setup — OAuth Desktop App (easier for local dev)

If you don't want to deal with the service account dance:

1. Google Cloud Console → Credentials → OAuth Client ID → Desktop App
2. Download the JSON, save as `google-oauth.json` in your repo root
   (gitignored by default)
3. Set `GOOGLE_CREDENTIALS_PATH=/abs/path/google-oauth.json`
4. First time you trigger a delivery, a browser window opens asking
   you to authorize the app. After that, a token is cached at
   `google-oauth_token.json` next to the credentials file.

This runs under your personal Drive quota, which is fine for demos
and early clients.

## Triggering a delivery

Two ways:

**Automatic** — the pipeline calls `_auto_deliver` after a job
completes, using whatever `DELIVERY_MODE` is set to. No manual action.

**Manual** — client clicks a button on `/dashboard/jobs/{id}` which
POSTs to one of:

- `POST /api/jobs/{job_id}/export/zip`   → build ZIP now
- `POST /api/jobs/{job_id}/export/drive` → upload to Drive now

These are idempotent in the loose sense — each call creates a fresh
timestamped deliverable and the job row points at the most recent one.

## Troubleshooting

**"Service account has 0 bytes storage quota"**
You skipped step 6 above. Share a parent folder with the service
account and set `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

**503 "Drive delivery is not configured"**
`GOOGLE_CREDENTIALS_PATH` is empty or points at a missing file. The
pipeline silently falls back to ZIP in this case; the explicit 503
is only returned when a client calls `/export/drive` directly.

**Folder is private even though the code says "anyone with link"**
Some Workspace domains block external sharing via admin policy. Use
a personal Google account for the credentials, or ask the Workspace
admin to allow link sharing.

## Cost

- Drive API calls are free up to generous quotas (1B/day per project)
- Storage uses the credentials-owner's Drive quota (15GB free personal,
  or whatever the service-account-parent-folder owner has)
- No AWS / no compute cost beyond the job itself
