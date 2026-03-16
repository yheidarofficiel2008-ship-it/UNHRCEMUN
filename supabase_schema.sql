
-- Migration for Immune UERC (MUN HR Council)

-- 1. Table Delegates
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Actions (Agenda Items)
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    time_per_delegate TEXT DEFAULT '01:00',
    allow_participation BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL CHECK (status IN ('launched', 'started', 'paused', 'completed')),
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    total_elapsed_seconds INTEGER DEFAULT 0,
    speaking_timer_status TEXT DEFAULT 'stopped',
    speaking_timer_started_at TIMESTAMPTZ,
    speaking_timer_total_elapsed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Participations (Speaker List)
CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    status TEXT DEFAULT 'participating',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table Resolutions
CREATE TABLE IF NOT EXISTS resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_country TEXT NOT NULL,
    sponsors TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table Session State (Singleton)
CREATE TABLE IF NOT EXISTS session_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_suspended BOOLEAN DEFAULT FALSE,
    allow_resolutions BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default session state
INSERT INTO session_state (id, is_suspended, allow_resolutions) 
VALUES ('current', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;
