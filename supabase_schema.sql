
-- Schéma SQL pour migration Supabase (MUN HR Council)

-- Table des délégués
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actions/débats
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  time_per_delegate TEXT DEFAULT '1:00',
  description TEXT,
  allow_participation BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'launched', -- 'launched', 'started', 'paused', 'completed'
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_elapsed_seconds INTEGER DEFAULT 0,
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participations (liste des orateurs)
CREATE TABLE participations (
  id TEXT PRIMARY KEY, -- Concaténation action_id + delegate_id
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'participating', 'passing'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages privés à la présidence
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT NOT NULL, -- 'privilege', 'general'
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- État global de la session
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion initiale de l'état
INSERT INTO session_state (id, is_suspended, allow_resolutions) VALUES ('current', FALSE, TRUE) ON CONFLICT DO NOTHING;
