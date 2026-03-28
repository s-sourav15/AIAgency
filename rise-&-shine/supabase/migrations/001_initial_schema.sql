-- ============================================================
-- Rise & Shine — Initial Schema Migration
-- Run in Supabase SQL Editor (new project)
-- ============================================================

-- ========================
-- ENUMS
-- ========================

CREATE TYPE focus_category AS ENUM ('career', 'wellness', 'creativity', 'mindfulness');

CREATE TYPE alarm_sound AS ENUM (
  'birds_chirping',
  'ocean_waves',
  'forest_mist',
  'gentle_piano',
  'morning_bells',
  'sunrise_chime',
  'silent',
  'custom'
);

CREATE TYPE day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- ========================
-- TABLES
-- ========================

-- 1. profiles (1:1 with auth.users)
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name         TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  vision_image_url  TEXT,
  vision_quote      TEXT DEFAULT '',
  settings          JSONB NOT NULL DEFAULT '{
    "theme": "light",
    "notifications_enabled": true,
    "snooze_duration_minutes": 9
  }'::jsonb,
  ai_content_cache  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. alarms
CREATE TABLE alarms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_of_day       TIME NOT NULL,
  days              day_of_week[] NOT NULL DEFAULT '{}',
  sound             alarm_sound NOT NULL DEFAULT 'birds_chirping',
  custom_sound_path TEXT,
  custom_sound_duration_secs SMALLINT,
  focus             focus_category NOT NULL DEFAULT 'wellness',
  enabled           BOOLEAN NOT NULL DEFAULT true,
  wake_image_url    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

-- 3. task_templates
CREATE TABLE task_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  subtext     TEXT DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'checkmark',
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- 4. daily_completions
CREATE TABLE daily_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  task_id         UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, completed_date, task_id)
);

ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

-- 5. vision_presets (system content)
CREATE TABLE vision_presets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  quote       TEXT NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE vision_presets ENABLE ROW LEVEL SECURITY;

-- 6. daily_content (affirmations, insights, quotes)
CREATE TABLE daily_content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_date  DATE,
  category      focus_category,
  content_type  TEXT NOT NULL CHECK (content_type IN ('affirmation', 'insight', 'quote')),
  body          TEXT NOT NULL,
  attribution   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;

-- ========================
-- INDEXES
-- ========================

CREATE INDEX idx_alarms_user_id ON alarms (user_id);

CREATE INDEX idx_task_templates_user_active ON task_templates (user_id, is_active)
  WHERE is_active = true;

CREATE INDEX idx_daily_completions_user_date ON daily_completions (user_id, completed_date);

CREATE INDEX idx_daily_completions_user_date_task ON daily_completions (user_id, completed_date, task_id);

CREATE INDEX idx_daily_content_date_type ON daily_content (content_date, content_type);

CREATE INDEX idx_vision_presets_sort ON vision_presets (sort_order)
  WHERE is_active = true;

-- ========================
-- RLS POLICIES
-- ========================

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- alarms
CREATE POLICY "Users can view own alarms"
  ON alarms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alarms"
  ON alarms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alarms"
  ON alarms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alarms"
  ON alarms FOR DELETE
  USING (auth.uid() = user_id);

-- task_templates
CREATE POLICY "Users can view own tasks"
  ON task_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON task_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON task_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON task_templates FOR DELETE
  USING (auth.uid() = user_id);

-- daily_completions
CREATE POLICY "Users can view own completions"
  ON daily_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON daily_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON daily_completions FOR DELETE
  USING (auth.uid() = user_id);

-- vision_presets (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view presets"
  ON vision_presets FOR SELECT
  USING (auth.role() = 'authenticated');

-- daily_content (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view content"
  ON daily_content FOR SELECT
  USING (auth.role() = 'authenticated');

-- ========================
-- TRIGGERS: updated_at
-- ========================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_alarms_updated_at
  BEFORE UPDATE ON alarms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- AUTH TRIGGER: auto-provision on signup
-- ========================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, user_name, vision_quote)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Friend'),
    'Every sunrise is an invitation to brighten someone''s day.'
  );

  -- Seed default morning ritual tasks
  INSERT INTO task_templates (user_id, text, subtext, icon, sort_order) VALUES
    (NEW.id, 'Drink water',       'Hydration is key',           'drop.fill',   1),
    (NEW.id, '3 Gratitude items', 'Write them in your journal', 'pencil.line', 2),
    (NEW.id, 'Deep breathing',    '3 sets of 5 breaths',        'wind',        3);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ========================
-- FUNCTIONS: streak & completion
-- ========================

-- Get current streak, streak level, and longest streak
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak  INT,
  streak_level    INT,
  longest_streak  INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_running_streak INT := 0;
  v_prev_date DATE;
  v_active_task_count INT;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO v_active_task_count
  FROM task_templates
  WHERE user_id = p_user_id AND is_active = true;

  IF v_active_task_count = 0 THEN
    current_streak := 0;
    streak_level := 1;
    longest_streak := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  FOR rec IN
    SELECT dc.completed_date, COUNT(DISTINCT dc.task_id) AS tasks_done
    FROM daily_completions dc
    JOIN task_templates tt ON tt.id = dc.task_id AND tt.is_active = true
    WHERE dc.user_id = p_user_id
    GROUP BY dc.completed_date
    HAVING COUNT(DISTINCT dc.task_id) >= v_active_task_count
    ORDER BY dc.completed_date DESC
  LOOP
    IF v_prev_date IS NULL THEN
      IF rec.completed_date = CURRENT_DATE OR rec.completed_date = CURRENT_DATE - 1 THEN
        v_running_streak := 1;
      ELSE
        v_running_streak := 0;
        v_current_streak := 0;
      END IF;
    ELSE
      IF v_prev_date - rec.completed_date = 1 THEN
        v_running_streak := v_running_streak + 1;
      ELSE
        IF v_current_streak = 0 THEN
          v_current_streak := v_running_streak;
        END IF;
        IF v_running_streak > v_longest_streak THEN
          v_longest_streak := v_running_streak;
        END IF;
        v_running_streak := 1;
      END IF;
    END IF;

    v_prev_date := rec.completed_date;
  END LOOP;

  IF v_current_streak = 0 THEN
    v_current_streak := v_running_streak;
  END IF;
  IF v_running_streak > v_longest_streak THEN
    v_longest_streak := v_running_streak;
  END IF;

  current_streak := v_current_streak;
  longest_streak := v_longest_streak;
  streak_level := GREATEST(1, (v_current_streak / 7) + 1);
  RETURN NEXT;
  RETURN;
END;
$$;

-- Get today's task completion rate
CREATE OR REPLACE FUNCTION get_today_completion_rate(p_user_id UUID)
RETURNS TABLE (
  total_tasks     INT,
  completed_tasks INT,
  completion_pct  INT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    (SELECT COUNT(*)::INT FROM task_templates WHERE user_id = p_user_id AND is_active = true) AS total_tasks,
    (SELECT COUNT(*)::INT FROM daily_completions dc
     JOIN task_templates tt ON tt.id = dc.task_id AND tt.is_active = true
     WHERE dc.user_id = p_user_id AND dc.completed_date = CURRENT_DATE) AS completed_tasks,
    CASE
      WHEN (SELECT COUNT(*) FROM task_templates WHERE user_id = p_user_id AND is_active = true) = 0 THEN 0
      ELSE (
        (SELECT COUNT(*)::INT FROM daily_completions dc
         JOIN task_templates tt ON tt.id = dc.task_id AND tt.is_active = true
         WHERE dc.user_id = p_user_id AND dc.completed_date = CURRENT_DATE) * 100 /
        (SELECT COUNT(*)::INT FROM task_templates WHERE user_id = p_user_id AND is_active = true)
      )
    END AS completion_pct;
$$;

-- Get daily content with evergreen fallback
CREATE OR REPLACE FUNCTION get_daily_content(p_focus focus_category DEFAULT NULL)
RETURNS TABLE (
  id           UUID,
  content_type TEXT,
  body         TEXT,
  attribution  TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  (
    SELECT dc.id, dc.content_type, dc.body, dc.attribution
    FROM daily_content dc
    WHERE dc.content_date = CURRENT_DATE
      AND (dc.category = p_focus OR dc.category IS NULL)
    ORDER BY dc.content_type
  )
  UNION ALL
  (
    SELECT dc.id, dc.content_type, dc.body, dc.attribution
    FROM daily_content dc
    WHERE dc.content_date IS NULL
      AND (dc.category = p_focus OR dc.category IS NULL)
    ORDER BY random()
    LIMIT 3
  )
  LIMIT 3;
$$;

-- ========================
-- SEED DATA
-- ========================

-- Vision board presets
INSERT INTO vision_presets (name, image_url, quote, sort_order) VALUES
  ('UPSC',       'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=1000&auto=format&fit=crop', 'LBSNAA: The ultimate destination.', 1),
  ('Dream Home', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop', 'Building my dream home, one day at a time.', 2),
  ('Travel',     'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop', 'The world is my classroom.', 3),
  ('Fitness',    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop', 'Stronger every single day.', 4);

-- Evergreen daily content
INSERT INTO daily_content (content_type, body, attribution, category) VALUES
  ('affirmation', 'Today is a gift, and I am exactly where I need to be to grow.', 'Mindful Reminder', NULL),
  ('affirmation', 'I am capable of achieving everything I set my mind to today.', 'Morning Wisdom', 'career'),
  ('affirmation', 'My body is strong, my mind is clear, and my spirit is at peace.', 'Wellness Journal', 'wellness'),
  ('affirmation', 'I create beauty in the world through my unique perspective.', 'Creative Spirit', 'creativity'),
  ('affirmation', 'I am present in this moment, and this moment is enough.', 'Mindful Reminder', 'mindfulness'),
  ('insight',     'Exposure to natural light within 30 minutes of waking resets your circadian rhythm.', 'Wellness Guide', 'wellness'),
  ('insight',     'Writing down 3 things you''re grateful for each morning rewires your brain for positivity.', 'Neuroscience Today', 'mindfulness'),
  ('insight',     'A 2-minute morning review of your goals increases daily achievement rates by 42%.', 'Productivity Research', 'career'),
  ('insight',     'Morning creativity peaks 30 minutes after waking, before analytical thinking takes over.', 'Creative Flow Institute', 'creativity'),
  ('quote',       'The sun is a daily reminder that we too can rise again from the darkness, that we too can shine our own light.', NULL, NULL),
  ('quote',       'The way you start your day determines the way you live your life.', NULL, NULL),
  ('quote',       'Every morning brings new potential, but if you dwell on the misfortunes of the day before, you tend to overlook tremendous opportunities.', 'Harvey Mackay', NULL);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase Dashboard or via API)
--
-- Create these 3 buckets manually in Storage settings:
--   1. ringtones     — private, 10MB file limit, allowed: audio/*
--   2. alarm-images  — private, 5MB file limit, allowed: image/*
--   3. avatars       — private, 5MB file limit, allowed: image/*
--
-- Storage RLS policies (add via Dashboard > Storage > Policies):
--   Each bucket: users can only access files under their own uid/ prefix
--   SELECT: (bucket_id = '<bucket>' AND auth.uid()::text = (storage.foldername(name))[1])
--   INSERT: (bucket_id = '<bucket>' AND auth.uid()::text = (storage.foldername(name))[1])
--   DELETE: (bucket_id = '<bucket>' AND auth.uid()::text = (storage.foldername(name))[1])
-- ============================================================
