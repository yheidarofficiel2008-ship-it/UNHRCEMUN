-- Schéma SQL pour migration Supabase (référence uniquement)

CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  time_per_delegate TEXT,
  description TEXT,
  allow_participation BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'launched', -- launched, started, paused, completed
  total_elapsed_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  country_name TEXT,
  status TEXT NOT NULL, -- participating, passing
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposing_country TEXT NOT NULL,
  sponsors TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_state (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_suspended BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);