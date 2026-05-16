-- ============================================
-- AuraSync — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── User Profiles ───────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT DEFAULT 'AuraSync User',
  resilience_score INTEGER DEFAULT 50 CHECK (resilience_score >= 0 AND resilience_score <= 100),
  current_streak INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Stress Events (Core Data) ──────────────
CREATE TABLE IF NOT EXISTS stress_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
  stress_state TEXT CHECK (stress_state IN ('CALM', 'DRIFTING', 'STRESSED', 'SPIRALING')),
  typing_cadence REAL,
  scroll_speed REAL,
  app_switch_freq REAL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  intervention_type TEXT,
  intervention_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Nudge History ──────────────────────────
CREATE TABLE IF NOT EXISTS nudge_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nudge_type TEXT NOT NULL,
  nudge_content TEXT NOT NULL,
  stress_state_at_time TEXT,
  was_opened BOOLEAN DEFAULT false,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Check-in Log ───────────────────────────
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for Performance ────────────────
CREATE INDEX idx_stress_events_user ON stress_events(user_id);
CREATE INDEX idx_stress_events_created ON stress_events(created_at);
CREATE INDEX idx_stress_events_state ON stress_events(stress_state);
CREATE INDEX idx_nudge_history_user ON nudge_history(user_id);
CREATE INDEX idx_check_ins_user ON check_ins(user_id);

-- ─── Row Level Security ─────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can read own stress events" ON stress_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stress events" ON stress_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own nudges" ON nudge_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own check-ins" ON check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check-ins" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
