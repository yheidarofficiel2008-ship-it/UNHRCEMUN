-- Schéma SQL pour Immune UERC (Simulation MUN)

-- 1. Table des Délégués (Pays)
CREATE TABLE delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Actions (Agenda)
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    time_per_delegate TEXT DEFAULT '1:00',
    allow_participation BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'launched', -- launched, started, paused, completed
    total_elapsed_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Participations (Liste des orateurs)
CREATE TABLE participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    status TEXT DEFAULT 'participating', -- participating, passing
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Résolutions
CREATE TABLE resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_country TEXT NOT NULL,
    sponsors TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. État Global de la Session
CREATE TABLE session_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_suspended BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX idx_participations_action ON participations(action_id);
CREATE INDEX idx_resolutions_displayed ON resolutions(is_displayed) WHERE is_displayed = TRUE;
