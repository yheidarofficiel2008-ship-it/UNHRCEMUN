
-- Schéma SQL pour migration vers Supabase (Immune UERC - MUN)

-- 1. Table des Délégués (Pays)
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Actions (Agenda/Débats)
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    time_per_delegate TEXT DEFAULT '1:00',
    allow_participation BOOLEAN DEFAULT TRUE,
    status TEXT CHECK (status IN ('launched', 'started', 'paused', 'completed')) DEFAULT 'launched',
    total_elapsed_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    speaking_timer_status TEXT DEFAULT 'stopped',
    speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
    speaking_timer_total_elapsed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Participations (Liste des orateurs)
CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('participating', 'passing')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Résolutions
CREATE TABLE IF NOT EXISTS resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_country TEXT NOT NULL,
    sponsors TEXT,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table d'État Global de Session
CREATE TABLE IF NOT EXISTS session_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_suspended BOOLEAN DEFAULT FALSE,
    allow_resolutions BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolutions_is_displayed ON resolutions(is_displayed) WHERE is_displayed = TRUE;
