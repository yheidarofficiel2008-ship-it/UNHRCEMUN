
-- Schéma de migration SQL pour EMUN UNHRC (Exemple de structure relationnelle correspondante)

-- Table des délégués
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actions (débats, minuteurs)
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('launched', 'started', 'paused', 'completed')) DEFAULT 'launched',
    duration_minutes INTEGER DEFAULT 15,
    time_per_delegate TEXT DEFAULT '1:00',
    description TEXT,
    allow_participation BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    total_elapsed_seconds INTEGER DEFAULT 0,
    speaking_timer_status TEXT DEFAULT 'stopped',
    speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
    speaking_timer_total_elapsed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résolutions
CREATE TABLE IF NOT EXISTS resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_country TEXT NOT NULL,
    sponsors TEXT,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages privés
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_country TEXT NOT NULL,
    type TEXT CHECK (type IN ('privilege', 'general')) DEFAULT 'general',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participations (liste des orateurs)
CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    delegate_id TEXT NOT NULL,
    country_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('participating', 'passing')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- État de la session globale
CREATE TABLE IF NOT EXISTS session_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_suspended BOOLEAN DEFAULT FALSE,
    allow_resolutions BOOLEAN DEFAULT TRUE,
    active_overlay JSONB DEFAULT '{"type": "none"}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
