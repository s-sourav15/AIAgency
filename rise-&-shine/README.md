# Rise & Shine

A mindful morning ritual app that combines smart alarms with daily affirmations, wellness tasks, and personalized motivation to help you start your day with purpose.

Rise & Shine is not just an alarm — it's a daily motivating engine. Each alarm is tied to a personal goal, shows a custom wake-up image, plays your chosen ringtone, and leads into a morning ritual of tasks, affirmations, and streaks.

**Platforms:** iOS (primary), Android (planned)
**Storage:** Local-only (no backend, no accounts)
**Monetization:** Free, no ads. Goal is user base, not revenue.

---

## Project Structure

```
rise-&-shine/
├── src/                                  # Web prototype (design reference)
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   └── index.css
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # Complete database schema
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

---

## App Screens

| Screen | Description |
|--------|-------------|
| **Alarms** | List of alarms with enable/disable toggles, repeat-day pills, and sound labels |
| **Feed** | Vision board, daily affirmation, streak counter, task completion ring, morning tasks, wellness insight |
| **Profile** | User info, vision board editor (with presets), stats, settings |
| **New Alarm** | Time picker, repeat-day selector, wake-up focus (Career/Wellness/Creativity/Mindfulness), sound picker |
| **Wake Up** | Full-screen immersive experience — per-alarm background image, clock, motivational quote, dismiss/snooze, quick insights |
| **Motivate** | Choose a focus category for daily reflections |

---

## Core Concepts

### Focus Categories
Every alarm and motivation session is tied to one of four categories:
- **Career** — Ambition, focus, and professional growth
- **Wellness** — Physical energy and holistic balance
- **Creativity** — Imagination and expressive flow
- **Mindfulness** — Inner peace and intentional awareness

### Vision Board
Users set a background image and motivational quote that appears on the Feed screen. This is their long-term goal visualization (e.g., LBSNAA for UPSC aspirants, a dream home, a travel destination). System-provided presets are available. Preset images are self-hosted in Supabase Storage (not external URLs) to avoid third-party dependency risks.

### Per-Alarm Wake Images
Each alarm can have its own background image, separate from the vision board. When the alarm fires, the wake-up screen displays that alarm's specific image — so a 6 AM weekday alarm might show a career goal, while a weekend alarm shows a personal one.

### Custom Ringtones
Users can upload their own audio files as alarm sounds, in addition to the built-in preset sounds (Birds Chirping, Ocean Waves, Forest Mist, etc.).

**Platform constraints on custom audio:**
- **iOS:** Notification sounds are capped at **30 seconds**. Uploaded audio is converted to `.caf` format and trimmed to 30s by the app. The full file stays in Supabase Storage, but the iOS-compatible version is cached locally.
- **Android:** `AlarmManager` + `MediaPlayer` can play full-length audio with no duration cap. The app downloads and caches the audio file from Supabase Storage on first use.

The `custom_sound_duration_secs` column on the `alarms` table tracks the original file duration so the UI can warn users if their ringtone exceeds 30s on iOS.

### Morning Tasks
A customizable set of morning ritual tasks (default: Drink water, 3 Gratitude items, Deep breathing). Users can add, remove, reorder, or disable tasks. Completing all tasks for the day counts toward the streak.

### Streaks & Gamification
- **Day Streak** — consecutive days of completing all morning tasks
- **Streak Level** — advances every 7 days of streak
- **Completion Rate** — percentage of tasks done today
- Badges are derived from streak milestones on the client (not stored in DB)

### AI-Powered Content (Gemini)
Daily affirmations and insights use a **hybrid** approach:

| Layer | Source | When |
|-------|--------|------|
| **Primary** | Gemini API (`gemini-2.0-flash-lite`) | Generates a personalized affirmation each morning based on focus category, current streak, user name, and vision quote |
| **Fallback** | Bundled content JSON | Used when offline, API failure, or already called today |

**Rate limiting strategy (no auth needed):**
- The app calls Gemini **once per calendar day**, on first open
- Response is cached locally (keyed by date) — if cache exists for today, no API call
- This is a natural rate limit: 1 call/device/day. Even with 10,000 users = 10,000 calls/day, well within Gemini free tier
- API key is embedded in the app binary — acceptable for a free app with this call pattern
- If abuse ever becomes a concern: add a thin Cloud Function proxy with per-device-ID throttling (future, not now)

The app ships with ~100 bundled content entries (batch-generated with Gemini, ~25 per focus category). These are the offline fallback pool and ensure the app works without any network connectivity.

---

## Onboarding Flow (First-Time User)

1. **Welcome screen** — app intro, no sign-up needed
2. **"What's your name?"** — stored locally
3. **"What drives you?"** — Pick a focus category (sets default focus for first alarm)
4. **"Set your vision"** — Pick a preset or upload custom image + quote
5. **"Set your first alarm"** — Time, days, sound. Notification permission is requested here with context: *"Rise & Shine needs notifications to wake you up."*
6. **Land on Feed** — Profile, first alarm, and vision board are all configured

All data is saved to local storage at the end of onboarding.

---

## Platform Architecture

### iOS (Primary — Swift/SwiftUI)

#### Alarm Reliability

iOS aggressively kills background processes. The alarm system works as follows:

1. **Alarm scheduling** uses `UNUserNotificationCenter` with `.calendar` triggers. Local notifications fire reliably even when the app is killed — Apple guarantees delivery.
2. **Custom audio** plays as a notification sound (30-second cap, `.caf`/`.wav`/`.aiff` format).
3. **Wake-up screen** — the notification includes a rich notification with the alarm's wake image as an attachment. When the user taps the notification, the app opens to the full-screen Wake Up experience.
4. **Snooze** — schedules another local notification N minutes out (configurable via `settings.snooze_duration_minutes`).

**What this means architecturally:**
- The app does NOT attempt to launch itself or run background audio loops
- The full immersive wake-up experience requires a user tap on the notification
- The notification itself (sound + image + text) is the primary alarm — the in-app screen is the secondary experience
- **Critical Alert entitlement** — apply to Apple for this. If granted, alarms play even in Do Not Disturb mode. Not guaranteed, but worth applying for health/wellness category

**Key iOS frameworks:**
- `UNUserNotificationCenter` — alarm scheduling and delivery
- `AVFoundation` — audio format conversion (uploaded MP3/M4A → 30s `.caf`)
- `HealthKit` — sleep duration data for wake-up screen
- `CoreLocation` + weather API — sunrise/weather data
- Supabase Swift SDK — auth, database, storage

#### Notification Permission Handling
- Request on onboarding step 5 (first alarm setup), with motivating context
- If denied: persistent banner on Alarms screen — *"Notifications are off — your alarms won't ring"*
- Deep-link to iOS Settings from the banner

### Android (Planned — Kotlin/Jetpack Compose)

#### Alarm Reliability

Android has significantly more flexibility for alarms than iOS.

1. **Alarm scheduling** uses `AlarmManager.setAlarmClock()` — this is the highest-priority alarm API. It survives Doze mode, app kills, and device reboots (with a `BOOT_COMPLETED` receiver to reschedule).
2. **Custom audio** — `AlarmManager` fires a `BroadcastReceiver` which starts a foreground `Service` that plays audio via `MediaPlayer`. No duration cap. Full-length ringtones supported.
3. **Wake-up screen** — the foreground service launches a full-screen `Activity` with `FLAG_SHOW_WHEN_LOCKED` + `FLAG_TURN_SCREEN_ON`. The immersive wake-up experience shows immediately on the lock screen, no user tap required. This is a significant UX advantage over iOS.
4. **Snooze** — reschedule via `AlarmManager.setAlarmClock()`.

**What this means architecturally:**
- Android can show the full immersive wake-up screen automatically (no notification tap needed)
- Custom ringtones play at full length
- Alarms survive device reboots via `BOOT_COMPLETED` broadcast receiver
- The app needs `SCHEDULE_EXACT_ALARM` permission (Android 12+) — requested at runtime, explain why in onboarding

**Key Android components:**

| Component | Purpose |
|-----------|---------|
| `AlarmManager.setAlarmClock()` | Exact alarm scheduling, Doze-immune |
| `BroadcastReceiver` (alarm) | Receives alarm trigger, starts foreground service |
| `BroadcastReceiver` (boot) | Reschedules all alarms after device reboot |
| Foreground `Service` | Plays ringtone audio via `MediaPlayer`, shows ongoing notification |
| Full-screen `Activity` | Wake-up screen with `SHOW_WHEN_LOCKED` + `TURN_SCREEN_ON` flags |
| `NotificationChannel` | High-importance channel for alarm notifications |
| Supabase Kotlin SDK | Auth, database, storage |

**Required permissions:**
- `SCHEDULE_EXACT_ALARM` — exact alarm firing (Android 12+)
- `RECEIVE_BOOT_COMPLETED` — reschedule alarms after reboot
- `FOREGROUND_SERVICE` — play audio in foreground
- `USE_FULL_SCREEN_INTENT` — show activity on lock screen
- `POST_NOTIFICATIONS` — notification display (Android 13+)
- `WAKE_LOCK` — keep device awake during alarm

#### Notification Permission Handling (Android 13+)
- Request `POST_NOTIFICATIONS` during onboarding step 5
- Request `SCHEDULE_EXACT_ALARM` at the same time, with context: *"Rise & Shine needs this to ring your alarm at the exact time you set"*
- If either is denied: banner on Alarms screen with deep-link to Android Settings

### Platform Comparison

| Capability | iOS | Android |
|------------|-----|---------|
| Alarm fires when app is killed | Yes (local notification) | Yes (AlarmManager) |
| Alarm survives device reboot | Yes (iOS reschedules automatically) | Yes (BOOT_COMPLETED receiver) |
| Full-screen wake-up without user tap | No (requires notification tap) | Yes (full-screen intent) |
| Custom ringtone duration | 30 seconds max | Unlimited |
| Alarm in Do Not Disturb | Only with Critical Alert entitlement | Yes (alarm channel bypasses DND) |
| Background audio playback | Not possible | Foreground service with MediaPlayer |
| Health data integration | HealthKit | Health Connect API |

---

## Offline Behavior

The app is **offline-first** for all alarm and morning ritual functionality. Supabase is for sync, not real-time operation.

| Feature | Offline behavior |
|---------|-----------------|
| **Alarm firing** | Fully offline — local notifications (iOS) / AlarmManager (Android) |
| **Custom ringtones** | Cached locally on first download from Supabase Storage |
| **Wake-up images** | Cached locally on first download |
| **Morning tasks** | `task_templates` cached locally. Completions queued and synced when online |
| **Daily content** | Falls back to cached Gemini response for today, or random pick from locally cached `daily_content` pool |
| **Streaks** | Calculated from local completion data. Synced to server when online |
| **Vision board** | Image and quote cached locally |
| **Profile changes** | Queued and synced when connectivity returns |

---

## Tech Stack

### Web Prototype
- React 19 + TypeScript
- Vite (dev server + build)
- Tailwind CSS v4 (Material Design 3 inspired theme)
- Motion (Framer Motion) for page transitions
- Lucide React for icons

### Data Storage (Local-Only)
- No backend server, no user accounts, no authentication
- All data stored on-device — SwiftData (iOS) / Room (Android)
- Images and audio stored in app Documents directory
- Daily content pool bundled as JSON asset (~100 entries)
- Gemini API called directly from client (1 call/day, cached locally)

### iOS
- Swift + SwiftUI
- SwiftData for persistence
- UNUserNotificationCenter for alarms
- AVFoundation for audio conversion (30s .caf)
- HealthKit for sleep data
- Google Generative AI Swift SDK

### Android
- Kotlin + Jetpack Compose
- Room database for persistence
- AlarmManager + foreground Service for alarms
- MediaPlayer for audio playback (no duration cap)
- Health Connect API for sleep data
- Google Generative AI Kotlin SDK

---

## Data Models (Local Storage)

All data is stored on-device. No server, no accounts.

```
Profile (singleton)
    │
    ├──1:N──► Alarm
    │
    ├──1:N──► TaskTemplate
    │              │
    │              │ referenced by
    │              ▼
    └──1:N──► DailyCompletion
```

### Models

#### `Profile` (singleton — one per device)

| Field | Type | Description |
|-------|------|-------------|
| userName | String | Display name |
| profileImagePath | String? | Local file path for avatar |
| visionImagePath | String? | Vision board background image (local path) |
| visionQuote | String | Vision board motivation text |
| theme | String | "light" / "dark" |
| notificationsEnabled | Bool | |
| snoozeDurationMinutes | Int | Default 9 |
| aiContentCache | [String: CachedContent] | Gemini responses keyed by date string |
| longestStreak | Int | Updated when current streak exceeds it |
| createdAt | Date | |

#### `Alarm`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | |
| timeOfDay | Date (time component only) | 24-hour, display format handled by platform |
| days | [DayOfWeek] | Empty = one-time alarm |
| sound | AlarmSound enum | Preset identifier or `.custom` |
| customSoundPath | String? | Local file path when sound = `.custom` |
| customSoundDurationSecs | Int? | Original file duration (for iOS 30s warning) |
| focus | FocusCategory enum | career / wellness / creativity / mindfulness |
| enabled | Bool | |
| wakeImagePath | String? | Per-alarm background image (local path) |
| createdAt | Date | |

#### `TaskTemplate`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | |
| text | String | e.g. "Drink water" |
| subtext | String | e.g. "Hydration is key" |
| icon | String | SF Symbols (iOS) / Material Icons (Android) |
| sortOrder | Int | Display order |
| isActive | Bool | Soft-disable without deleting |

#### `DailyCompletion`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | |
| completedDate | Date (date component only) | |
| task | TaskTemplate (reference) | |
| completedAt | Date | |
| **Unique constraint** | | (completedDate, task) — one completion per task per day |

### Enums

| Enum | Values |
|------|--------|
| FocusCategory | career, wellness, creativity, mindfulness |
| AlarmSound | birdChirping, oceanWaves, forestMist, gentlePiano, morningBells, sunriseChime, silent, custom |
| DayOfWeek | mon, tue, wed, thu, fri, sat, sun |

### Bundled Assets

| Asset | Format | Description |
|-------|--------|-------------|
| Preset sounds (7) | .caf (iOS) / .ogg (Android) | Built-in alarm sounds |
| Vision presets (4) | .jpg | UPSC/LBSNAA, Dream Home, Travel, Fitness — bundled in app, not external URLs |
| Content pool | .json | ~100 entries: affirmations, insights, quotes across all 4 focus categories |

### Streak Calculation (client-side)

```
currentStreak = count consecutive days backwards from today (or yesterday)
               where ALL active tasks have a DailyCompletion record

streakLevel   = floor(currentStreak / 7) + 1

completionRate = completedToday / totalActiveTasks * 100
```

### File Storage

| Directory | Contents |
|-----------|----------|
| Documents/ringtones/ | User-uploaded custom alarm sounds (converted to .caf on iOS) |
| Documents/images/alarms/ | Per-alarm wake-up background images |
| Documents/images/vision/ | Vision board image |
| Documents/images/avatar/ | Profile photo |

---

## External Data (fetched at display time, not stored)

| Data | Source |
|------|--------|
| Weather | Weather API (at alarm time) |
| Sleep duration | HealthKit (iOS) / Health Connect (Android) |
| Sunlight exposure | Location + weather API |

---

## Setup

### Web Prototype (development reference)

```bash
npm install
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local
npm run dev
```

### iOS Development
1. Create Xcode project (SwiftUI, iOS 17+)
2. Add SwiftData models matching the data models above
3. Bundle preset assets (sounds, vision images, content JSON)
4. Add Gemini Swift SDK and configure API key
5. See `TODO.md` for full implementation checklist

### Android Development
1. Create Android Studio project (Kotlin, Jetpack Compose, min SDK 26)
2. Add Room database with matching entity definitions
3. Bundle same preset assets
4. Add Gemini Kotlin SDK and configure API key
5. See `TODO.md` for full implementation checklist

---

## Infrastructure

- **No server required** — all data on-device, Gemini API called directly from client
- The Supabase migration (`supabase/migrations/001_initial_schema.sql`) is preserved for future use if cross-device sync is ever needed
- Privacy policy is simple: no data collected, no accounts, everything stays on the user's device

## License

Private project.
