-- Schéma SQL pour migration future vers Supabase (PostgreSQL)

-- Table des délégués
CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actions/agenda
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 15,
  time_per_delegate TEXT DEFAULT '1:00',
  allow_participation BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'launched', -- launched, started, paused, completed
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_elapsed_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participations (liée à une action)
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- participating, passing
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résolutions
CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- État global de la session
CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);