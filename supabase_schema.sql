
-- Create Tables for MUN Management System (Immune UERC)

-- Delegates Table
CREATE TABLE delegates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions Table
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    time_per_delegate TEXT DEFAULT '1:00',
    allow_participation BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'launched', -- launched, started, paused, completed
    total_elapsed_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    speaking_timer_status TEXT DEFAULT 'stopped', -- started, stopped
    speaking_timer_started_at TIMESTAMP WITH TIME ZONE,
    speaking_timer_total_elapsed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participations Table
CREATE TABLE participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
    country_name TEXT NOT NULL,
    status TEXT NOT NULL, -- participating, passing
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(action_id, delegate_id)
);

-- Resolutions Table
CREATE TABLE resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposing_country TEXT NOT NULL,
    sponsors TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session State Table (Singleton)
CREATE TABLE session_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    is_suspended BOOLEAN DEFAULT FALSE,
    allow_resolutions BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial session state
INSERT INTO session_state (id, is_suspended, allow_resolutions) 
VALUES ('current', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;
