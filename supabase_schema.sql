
-- Schéma SQL pour migration vers Supabase (PostgreSQL)
-- Ce fichier contient les tables correspondant aux entités Firestore du projet MUN.

-- Table des Délégués
CREATE TABLE IF NOT EXISTS delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Actions (Sessions de débat)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  allow_participation BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'launched', -- launched, started, paused, completed
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Participations (Liste des orateurs)
CREATE TABLE IF NOT EXISTS participations (
  id TEXT PRIMARY KEY, -- Concaténation actionId_delegateId
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT,
  status TEXT, -- participating, passing
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Résolutions
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  is_displayed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Messages Privés
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT NOT NULL, -- privilege, general
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- État global de la session
CREATE TABLE IF NOT EXISTS session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT false,
  allow_resolutions BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Insertion de l'état initial
INSERT INTO session_state (id, is_suspended, allow_resolutions) 
VALUES ('current', false, true)
ON CONFLICT (id) DO NOTHING;
