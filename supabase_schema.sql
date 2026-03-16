-- Enable Realtime for all relevant tables
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Delegates table (simple auth as requested)
create table delegates (
  id uuid primary key default gen_random_uuid(),
  country_name text unique not null,
  password text not null,
  created_at timestamp with time zone default now()
);

-- Actions table
create table actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration_minutes integer not null,
  time_per_delegate text, -- Display only
  description text,
  allow_participation boolean default true,
  status text check (status in ('draft', 'launched', 'started', 'completed')) default 'draft',
  started_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Participations table (real-time tracking)
create table participations (
  id uuid primary key default gen_random_uuid(),
  action_id uuid references actions(id) on delete cascade,
  delegate_id uuid references delegates(id) on delete cascade,
  status text check (status in ('participating', 'passing')),
  updated_at timestamp with time zone default now(),
  unique(action_id, delegate_id)
);

-- Resolutions table
create table resolutions (
  id uuid primary key default gen_random_uuid(),
  proposing_country text not null,
  sponsors text,
  content text not null,
  status text check (status in ('pending', 'approved', 'rejected', 'modification_requested')) default 'pending',
  feedback text,
  created_at timestamp with time zone default now()
);

-- Global settings (Session suspension)
create table settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null
);

-- Initial settings
insert into settings (key, value) values ('session_suspended', 'false'::jsonb);

-- Add tables to the realtime publication
alter publication supabase_realtime add table actions, participations, resolutions, settings;