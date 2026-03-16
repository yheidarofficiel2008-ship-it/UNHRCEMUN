
-- Schéma SQL pour migration vers Supabase (PostgreSQL)
-- Application: Immune UERC - MUN Management

-- 1. Table des Délégués (Pays)
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Actions (Agenda/Débats)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  time_per_delegate TEXT DEFAULT '1:00',
  status TEXT NOT NULL DEFAULT 'launched', -- 'launched', 'started', 'paused', 'completed'
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  allow_participation BOOLEAN DEFAULT TRUE,
  
  -- Chronomètre Orateur
  speaking_timer_status TEXT DEFAULT 'stopped',
  speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Participations (Liste des Orateurs)
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'participating', 'passing'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table d'État de la Session (Singleton)
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des Rôles (Président)
CREATE TABLE president_roles (
  user_id UUID PRIMARY KEY, -- UID Firebase Auth
  email TEXT NOT NULL,
  role TEXT DEFAULT 'president',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX idx_resolutions_displayed ON resolutions(is_displayed);
CREATE INDEX idx_participations_action ON participations(action_id);
CREATE INDEX idx_actions_created ON actions(created_at DESC);
