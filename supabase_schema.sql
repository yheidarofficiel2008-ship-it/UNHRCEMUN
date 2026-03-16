
-- Schéma SQL pour migration Supabase (MUN Immune UERC)

-- Table des délégués
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des actions (sessions de débat)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  allow_participation BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'launched', -- launched, started, paused, completed
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  total_elapsed_seconds INTEGER DEFAULT 0,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des participations (liste des orateurs)
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT DEFAULT 'participating', -- participating, passing
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de l'état de la session (singleton)
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion de l'état initial
INSERT INTO session_state (id, is_suspended, allow_resolutions) VALUES ('current', false, true) ON CONFLICT (id) DO NOTHING;
