-- Schéma SQL pour migration vers Supabase (PostgreSQL)
-- Application : Immune UERC - MUN HR Council

-- 1. Table des Délégués (Pays)
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Actions (Débats)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('launched', 'started', 'paused', 'completed')) DEFAULT 'launched',
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  allow_participation BOOLEAN DEFAULT TRUE,
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Participations (Liste des orateurs)
CREATE TABLE participations (
  id TEXT PRIMARY KEY, -- Combiné action_id + delegate_id
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('participating', 'passing')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Messages Privés
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT CHECK (type IN ('privilege', 'general')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des Paramètres de Session
CREATE TABLE session_state (
  key TEXT PRIMARY KEY, -- 'current'
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Initialisation des paramètres
INSERT INTO session_state (key, is_suspended, allow_resolutions) VALUES ('current', FALSE, TRUE) ON CONFLICT DO NOTHING;