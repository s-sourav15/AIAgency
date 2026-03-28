# Rise & Shine — TODO

## Architecture Decision
- **Local-only storage** — no backend, no auth, no Supabase
- **Free app** — no accounts, no sign-in, anyone downloads and uses it
- **Gemini API** — single daily call for personalized content, client-side rate limited
- **Platforms** — iOS first, Android second

---

## Phase 1: iOS Prototype (for personal use)

### Project Setup
- [ ] Create Xcode project (SwiftUI, iOS 17+ minimum)
- [ ] Set up SwiftData models (Alarm, TaskTemplate, DailyCompletion, Profile)
- [ ] Bundle default content JSON (~100 affirmations/insights/quotes across all 4 focus categories)
- [ ] Add Gemini Swift SDK (`google-generative-ai` package)

### Data Layer
- [ ] **Profile** — single record in SwiftData: user_name, vision_image (local file path), vision_quote, settings (theme, snooze duration), ai_content_cache (date-keyed)
- [ ] **Alarms** — SwiftData model: time_of_day, days (array), sound (enum or custom file path), custom_sound_duration_secs, focus category, enabled, wake_image (local file path)
- [ ] **Task Templates** — SwiftData model: text, subtext, icon (SF Symbol name), sort_order, is_active
- [ ] **Daily Completions** — SwiftData model: completed_date, task reference, completed_at. Unique on (date, task)
- [ ] Seed 3 default tasks on first launch: Drink water, 3 Gratitude items, Deep breathing

### Alarm System
- [ ] Schedule alarms via `UNUserNotificationCenter` with `.calendar` trigger
- [ ] Custom audio: convert uploaded files to 30s `.caf` using AVFoundation, store in Documents/
- [ ] Notification includes rich content: wake image as attachment, motivational text
- [ ] Snooze: schedule follow-up notification (configurable duration from settings)
- [ ] Reschedule all enabled alarms when app returns to foreground (handles edge cases)
- [ ] Request notification permission during first alarm setup with motivating context

### Screens (match web prototype design)
- [ ] **Alarms Screen** — list of alarms, toggle switches, FAB to add new alarm
- [ ] **Feed Screen** — vision board card, daily affirmation, streak + completion ring, morning tasks, morning insight
- [ ] **Profile Screen** — name, avatar, vision board editor, preset picker, stats, settings
- [ ] **New Alarm Screen** — time picker, day selector, focus category picker, sound picker (preset + custom upload), wake image picker
- [ ] **Wake Up Screen** — full-screen immersive: alarm's wake image background, clock, quote, dismiss/snooze, quick insights (weather, sleep from HealthKit)
- [ ] **Motivate Screen** — focus category selection for daily reflections
- [ ] Bottom tab navigation (Alarms / Feed / Profile)
- [ ] Screen transitions with matched animation from web prototype

### Onboarding (first launch only)
- [ ] "What's your name?" → store locally
- [ ] "What drives you?" → pick default focus category
- [ ] "Set your vision" → pick preset or camera/gallery image + custom quote
- [ ] "Set your first alarm" → time, days, sound → triggers notification permission request
- [ ] Land on Feed

### Gemini Integration
- [ ] Use `gemini-2.0-flash-lite` (cheapest model)
- [ ] Single API call per day — on first app open of the day
- [ ] Prompt: generate personalized affirmation + insight based on: focus category, current streak, user name, vision quote
- [ ] Cache response locally (SwiftData, keyed by date) — never call twice for same date
- [ ] Client-side rate limit: max 1 call per calendar day, enforced by checking cache before calling
- [ ] Fallback: if API call fails (offline, quota, error), pick random entry from bundled content JSON
- [ ] API key embedded in app binary — acceptable for free non-commercial app with natural 1-call/day limit
- [ ] If abuse ever becomes a concern (far future): add a thin Cloud Function proxy with per-device-ID throttling

### Streak & Completion Logic
- [ ] `currentStreak`: count consecutive days (backwards from today/yesterday) where all active tasks were completed
- [ ] `streakLevel`: floor(currentStreak / 7) + 1
- [ ] `longestStreak`: track in Profile record, update when current exceeds it
- [ ] `completionRate`: completed today / total active tasks * 100
- [ ] All calculated from SwiftData queries — no server needed

### Vision Board Presets
- [ ] Bundle 4 preset images in app assets (not external URLs): UPSC/LBSNAA, Dream Home, Travel, Fitness
- [ ] Each preset has a name, bundled image, and default quote
- [ ] User can also pick from camera/photo library

### Custom Ringtones
- [ ] File picker for audio (mp3, m4a, wav)
- [ ] Convert to `.caf` format, trim to 30 seconds via AVFoundation
- [ ] Store converted file in Documents/ringtones/
- [ ] Show duration warning in UI if original file > 30s: "Your ringtone will be trimmed to 30 seconds on iOS"
- [ ] Preset sounds bundled as app assets

---

## Phase 2: Polish & App Store Release

- [ ] App icon and launch screen
- [ ] Dark mode support
- [ ] Haptic feedback on interactions
- [ ] Widget: today's affirmation + streak count (WidgetKit)
- [ ] HealthKit integration: show sleep duration on wake-up screen
- [ ] Weather API integration: show weather on wake-up screen
- [ ] Critical Alert entitlement application to Apple (alarms play in DND)
- [ ] App Store screenshots, description, keywords
- [ ] Privacy policy (no data collected, no accounts, everything on-device)
- [ ] TestFlight beta testing
- [ ] Submit to App Store

---

## Phase 3: Android Version

### Project Setup
- [ ] Create Android project (Kotlin + Jetpack Compose, min SDK 26 / Android 8.0)
- [ ] Set up Room database (same models as iOS SwiftData)
- [ ] Bundle same default content JSON
- [ ] Add Gemini Kotlin SDK (`generativeai`)

### Alarm System (Android advantages over iOS)
- [ ] `AlarmManager.setAlarmClock()` — exact alarms, survives Doze mode
- [ ] `BroadcastReceiver` for alarm trigger → starts foreground Service
- [ ] Foreground Service plays ringtone via `MediaPlayer` — **no duration cap** (full-length audio)
- [ ] Full-screen Activity with `SHOW_WHEN_LOCKED` + `TURN_SCREEN_ON` — wake-up screen shows on lock screen without user tap
- [ ] `BOOT_COMPLETED` receiver to reschedule all alarms after device reboot
- [ ] Required permissions: `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`, `USE_FULL_SCREEN_INTENT`, `POST_NOTIFICATIONS` (Android 13+), `WAKE_LOCK`

### Screens
- [ ] Port all 6 screens from iOS to Jetpack Compose
- [ ] Material 3 theming (already matches the web prototype's design tokens)
- [ ] Navigation with Compose Navigation
- [ ] Same onboarding flow as iOS

### Gemini Integration
- [ ] Same logic as iOS: 1 call/day, cache in Room, fallback to bundled JSON
- [ ] Same model: `gemini-2.0-flash-lite`

### Custom Ringtones (Android)
- [ ] File picker for audio files
- [ ] No format conversion needed — MediaPlayer handles mp3/m4a/wav/ogg natively
- [ ] No duration limit — full file plays
- [ ] Store in app internal storage

### Play Store Release
- [ ] App icon, screenshots, store listing
- [ ] Privacy policy (same as iOS — no data collected)
- [ ] Closed testing track → open beta → production
- [ ] Submit to Play Store

---

## Phase 4: Future Ideas (only if the app works and has users)

- [ ] Add Supabase backend for cross-device sync + cloud backup (schema already designed in `supabase/migrations/`)
- [ ] Optional accounts (Apple/Google sign-in) for sync — app remains fully functional without sign-in
- [ ] Community presets: users share vision board presets
- [ ] Guided morning audio routines (meditation, stretching)
- [ ] Integrations: Spotify alarm sounds, Apple Music
- [ ] Localization (Hindi, other Indian languages — key for UPSC audience)
- [ ] Open-source the app