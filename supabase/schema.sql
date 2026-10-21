-- BNI TNT SA Scorecard: database schema
-- Run this ONCE in the Supabase SQL Editor of a fresh project (or a project you dedicate to this app).
-- All access goes through the Vercel API with the service key; RLS blocks the anon key entirely.

create extension if not exists pgcrypto;

-- ---------- settings (single-row key/value) ----------
create table if not exists sa_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into sa_settings (key, value) values
  ('fee_amount', '49040'),
  ('commission_pct', '2.5'),
  ('mentoring_enabled', 'false'),
  ('one_to_one_threshold', '8.66'),
  ('online_event_types', '[]'),
  ('jotform_form_id', '"261212882805052"')
on conflict (key) do nothing;

-- ---------- chapters ----------
create table if not exists sa_chapters (
  id serial primary key,
  name text not null unique,          -- "BNI Ainthinai"
  key text not null unique,           -- "ainthinai" (normalised, matches BNI Connect names)
  region text not null,               -- "Tirunelveli" | "Nagercoil & Tuticorin"  (BNI Connect region names)
  sort_order int default 0,
  active boolean default true
);

insert into sa_chapters (name, key, region, sort_order) values
  ('BNI Ainthinai',     'ainthinai',    'Tirunelveli', 1),
  ('BNI Bamboo Kottai', 'bambookottai', 'Tirunelveli', 2),
  ('BNI Cmy Veli',      'cmyveli',      'Tirunelveli', 3),
  ('BNI Dil Nadu',      'dilnadu',      'Tirunelveli', 4),
  ('BNI Tamilan',       'tamilan',      'Tirunelveli', 5),
  ('BNI Ejamaan',       'ejamaan',      'Tirunelveli', 6),
  ('BNI Thamira',       'thamira',      'Tirunelveli', 7),
  ('BNI Saral',         'saral',        'Tirunelveli', 8),
  ('BNI Korkai',        'korkai',       'Nagercoil & Tuticorin', 9),
  ('BNI Nanjil',        'nanjil',       'Nagercoil & Tuticorin', 10),
  ('BNI Kanya',         'kanya',        'Nagercoil & Tuticorin', 11),
  ('BNI Comorin',       'comorin',      'Nagercoil & Tuticorin', 12),
  ('BNI Kumari',        'kumari',       'Nagercoil & Tuticorin', 13),
  ('BNI Kings',         'kings',        'Nagercoil & Tuticorin', 14)
on conflict (name) do nothing;

-- ---------- users (admins + SAs) ----------
create table if not exists sa_users (
  id serial primary key,
  role text not null check (role in ('admin','sa')),
  name text not null,
  email text unique,                  -- admins log in with email + password
  password_hash text,                 -- bcrypt (admins)
  pin_hash text,                      -- bcrypt (SAs)
  chapter_id int references sa_chapters(id),   -- current chapter (SAs)
  jotform_alias text,                 -- how the SA's name appears in "Visited By" / "Name" on the Jotform
  active boolean default true,
  created_at timestamptz default now(),
  last_login_at timestamptz
);
create index if not exists sa_users_chapter_idx on sa_users(chapter_id);

-- Riaz as first admin. CHANGE THE PASSWORD after first login (Admin > Users).
insert into sa_users (role, name, email, password_hash)
values ('admin', 'Mohamed Riaz', 'riaz@thekingsgroup.in', crypt('ChangeMe@2026', gen_salt('bf', 10)))
on conflict (email) do nothing;

-- Current SAs (PIN = 1234 for all; admin must reset each one before go-live)
insert into sa_users (role, name, chapter_id, pin_hash, jotform_alias)
select 'sa', v.name, c.id, crypt('1234', gen_salt('bf', 10)), v.name
from (values
  ('Vinoth Babu', 'BNI Ainthinai'),
  ('Kamak', 'BNI Bamboo Kottai'),
  ('Esai Kumar', 'BNI Cmy Veli'),
  ('Kareem', 'BNI Dil Nadu'),
  ('Saravanan Manickam', 'BNI Tamilan'),
  ('Abusalih', 'BNI Ejamaan'),
  ('Maria Anand', 'BNI Thamira'),
  ('Selvaratnam', 'BNI Saral'),
  ('Valentine', 'BNI Korkai'),
  ('Jimmy Bonson', 'BNI Nanjil'),
  ('Deva Shibin', 'BNI Kanya'),
  ('Suresh', 'BNI Comorin'),
  ('Ramkumar', 'BNI Kumari'),
  ('Dr.Ruth', 'BNI Kings')
) as v(name, chapter)
join sa_chapters c on c.name = v.chapter
where not exists (select 1 from sa_users u where u.role='sa' and u.name = v.name);

-- Former SA (history only, no login)
insert into sa_users (role, name, chapter_id, active)
select 'sa', 'Dr.Prashanth', c.id, false from sa_chapters c where c.name = 'BNI Kings'
  and not exists (select 1 from sa_users where name='Dr.Prashanth');

-- ---------- months ----------
create table if not exists sa_months (
  id serial primary key,
  ym text not null unique,            -- '2026-10'
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  published_by int references sa_users(id),
  created_at timestamptz default now()
);

-- ---------- entries: one row per chapter per month ----------
create table if not exists sa_entries (
  id serial primary key,
  month_id int not null references sa_months(id) on delete cascade,
  chapter_id int not null references sa_chapters(id),
  sa_user_id int references sa_users(id),       -- who was SA that month (history is by person)

  -- inputs
  member_score numeric,              -- SA's own Traffic Light score (manual)
  online_pct numeric,                -- from Training upload (or manual override)
  offline_pct numeric,
  training_unique int,               -- unique members trained (info)
  member_count numeric,              -- Mem Avg from Chapter Statistics upload
  mentoring_pct numeric,             -- paused KPI
  retention_pct numeric,             -- manual
  one_to_one_per_member numeric,     -- from Chapter Statistics upload
  ltrt_attended boolean,
  jotform_done boolean,
  jotform_auto boolean default false,  -- true when set by Jotform sync
  jotform_submission_id text,
  new_members int default 0,
  renewals int default 0,
  notes text,

  -- computed (stored on publish; recomputed live for drafts)
  points jsonb,
  total_raw numeric,
  max_total numeric,
  total_scaled numeric,
  band text,
  multiplier numeric,
  payout numeric,
  rank int,

  legacy boolean default false,      -- imported from the Google Sheet, points kept as the sheet scored them
  updated_at timestamptz default now(),
  updated_by int references sa_users(id),
  unique (month_id, chapter_id)
);
create index if not exists sa_entries_sa_idx on sa_entries(sa_user_id);

-- ---------- uploads log ----------
create table if not exists sa_uploads (
  id serial primary key,
  month_id int not null references sa_months(id) on delete cascade,
  kind text not null,                -- 'chapter_statistics' | 'training'
  region text,
  filename text,
  summary jsonb,
  uploaded_by int references sa_users(id),
  created_at timestamptz default now()
);

-- ---------- audit ----------
create table if not exists sa_audit (
  id bigserial primary key,
  user_id int,
  action text not null,
  detail jsonb,
  created_at timestamptz default now()
);

-- ---------- lock everything down: the API uses the service key, nothing else gets in ----------
alter table sa_settings enable row level security;
alter table sa_chapters enable row level security;
alter table sa_users    enable row level security;
alter table sa_months   enable row level security;
alter table sa_entries  enable row level security;
alter table sa_uploads  enable row level security;
alter table sa_audit    enable row level security;
-- (no policies = anon/authenticated roles cannot read or write; service_role bypasses RLS)
