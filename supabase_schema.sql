
-- Schéma SQL complet pour l'application Immune UERC

-- Table des Délégués
CREATE TABLE IF NOT EXISTS delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Actions (Débats)
CREATE TABLE IF NOT EXISTS actions (
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
  speaking_timer_status TEXT CHECK (speaking_timer_status IN ('started', 'stopped')) DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMPTZ,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Résolutions
CREATE TABLE IF NOT EXISTS resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  is_displayed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des Messages Privés
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT CHECK (type IN ('privilege', 'general')) DEFAULT 'general',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Table des Participations (Liste des orateurs)
CREATE TABLE IF NOT EXISTS participations (
  id TEXT PRIMARY KEY, -- Concaténation action_id + delegate_id
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('participating', 'passing')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table de l'état global de la session
CREATE TABLE IF NOT EXISTS session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT false,
  allow_resolutions BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_resolutions_is_displayed ON resolutions(is_displayed);
CREATE INDEX IF NOT EXISTS idx_resolutions_proposing_country ON resolutions(proposing_country);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_participations_action ON participations(action_id, updated_at);
