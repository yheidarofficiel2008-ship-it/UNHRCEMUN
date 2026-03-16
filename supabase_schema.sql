
-- Schéma SQL pour migration vers Supabase (PostgreSQL)

-- Table pour les délégués
CREATE TABLE IF NOT EXISTS delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les actions (sessions/débats)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  status TEXT CHECK (status IN ('launched', 'started', 'paused', 'completed')),
  total_elapsed_seconds INTEGER DEFAULT 0,
  paused_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  allow_participation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les résolutions
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les messages privés
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT CHECK (type IN ('privilege', 'general')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les participations (speakers list)
CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('participating', 'passing')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(action_id, delegate_id)
);

-- Table pour l'état global de la session
CREATE TABLE IF NOT EXISTS session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  active_overlay_type TEXT DEFAULT 'none',
  active_overlay_title TEXT,
  active_overlay_vote_id TEXT,
  active_overlay_results_pour INTEGER DEFAULT 0,
  active_overlay_results_contre INTEGER DEFAULT 0,
  active_overlay_results_abstention INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
