
-- Schéma SQL pour EMUN UNHRC (Migration vers Supabase)

-- 1. Table des Délégués
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des Actions / Débats
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('launched', 'started', 'paused', 'completed')) DEFAULT 'launched',
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  description TEXT,
  allow_participation BOOLEAN DEFAULT true,
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des Résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_displayed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table des Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT CHECK (type IN ('privilege', 'general')) DEFAULT 'general',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. Table des Participations (Historique Stats)
CREATE TABLE participations (
  id TEXT PRIMARY KEY, -- Format: actionId_delegateId
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('participating', 'passing')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. État global de la session (Single row)
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT false,
  allow_resolutions BOOLEAN DEFAULT true,
  active_overlay JSONB DEFAULT '{"type": "none"}',
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Insertion de l'état initial
INSERT INTO session_state (id, is_suspended, allow_resolutions, active_overlay) 
VALUES ('current', false, true, '{"type": "none"}')
ON CONFLICT (id) DO NOTHING;
