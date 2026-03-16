
-- Schéma SQL pour Immune UERC MUN Platform

-- Table des délégués
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actions (Débats)
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  allow_participation BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'launched' CHECK (status IN ('launched', 'started', 'paused', 'completed')),
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  speaking_timer_status TEXT DEFAULT 'stopped' CHECK (speaking_timer_status IN ('started', 'stopped')),
  speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
  speaking_timer_total_elapsed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_displayed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages privés à la présidence
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_country TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('privilege', 'general')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- État global de la session
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  allow_resolutions BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participations (Liste des orateurs par action)
CREATE TABLE participations (
  id TEXT PRIMARY KEY, -- format: actionId_delegateId
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('participating', 'passing')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rôles Président
CREATE TABLE roles_president (
  uid TEXT PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'president',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser l'affichage multiple des résolutions
CREATE INDEX idx_resolutions_is_displayed ON resolutions(is_displayed) WHERE is_displayed = true;
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = false;
