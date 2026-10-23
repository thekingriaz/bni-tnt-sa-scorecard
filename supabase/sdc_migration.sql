-- BNI TNT SA Scorecard: SDC (Support Director Consultant) extension
-- Run ONCE in the Supabase SQL Editor after schema.sql. Safe to re-run.

-- 1. Third role
alter table sa_users drop constraint if exists sa_users_role_check;
alter table sa_users add constraint sa_users_role_check check (role in ('admin','sa','sdc'));

-- 2. Chapter meeting weekday (0 = Sunday … 6 = Saturday), drives meetings-in-month
alter table sa_chapters add column if not exists meeting_day int;
update sa_chapters set meeting_day = v.d from (values
  ('ainthinai',2),('bambookottai',3),('cmyveli',4),('dilnadu',5),('tamilan',2),('ejamaan',3),('thamira',4),('saral',4),
  ('korkai',2),('nanjil',4),('kanya',2),('comorin',5),('kumari',3),('kings',2)
) as v(key,d) where sa_chapters.key = v.key and sa_chapters.meeting_day is null;

-- 3. Settings
insert into sa_settings (key, value) values
  ('sdc_commission_pct', '7.5'),
  ('telebridge_form_id', '"221121498823050"')
on conflict (key) do nothing;

-- 4. Months: a month is published separately per programme
alter table sa_months add column if not exists sdc_status text not null default 'draft' check (sdc_status in ('draft','published'));
alter table sa_months add column if not exists sdc_published_at timestamptz;
alter table sa_months add column if not exists sdc_published_by int references sa_users(id);

-- 5. SDC entries: one row per chapter per month
create table if not exists sdc_entries (
  id serial primary key,
  month_id int not null references sa_months(id) on delete cascade,
  chapter_id int not null references sa_chapters(id),
  sdc_user_id int references sa_users(id),     -- who was SDC that month (history is by person)

  -- inputs
  net_add int,                      -- manual override; when null, derived from member_count minus previous month
  member_count numeric,             -- Mem Avg from Chapter Statistics upload (copied from the SA upload)
  tl_status text check (tl_status in ('GREEN','AMBER','RED','GREY')),  -- All India Traffic Lights
  tl_score numeric,                 -- chapter traffic light score (info)
  tl_growth numeric,                -- growth figure printed on the Traffic Lights report (info, trailing)
  tl_auto boolean default false,    -- true when set by the upload
  retention_pct numeric,            -- overall retention % from 3+1 Traffic Lights (manual)
  member_score numeric,             -- SDC's own member Traffic Light score (manual)
  ltrt_attended boolean,
  visit_done boolean,               -- chapter visit report within 24 h
  visit_auto boolean default false,
  visit_submission_id text,
  visit_hours numeric,              -- hours between visit date and submission (info)
  notes text,

  -- legacy-only week counts (live months use sdc_weeks)
  meetings_total int,
  telebridge_weeks int,
  palms_weeks int,

  -- computed (stored on publish; recomputed live for drafts)
  points jsonb,
  total_raw numeric,
  max_total numeric,
  total_scaled numeric,
  band text,
  multiplier numeric,
  payout numeric,
  rank int,

  legacy boolean default false,
  updated_at timestamptz default now(),
  updated_by int references sa_users(id),
  unique (month_id, chapter_id)
);
create index if not exists sdc_entries_sdc_idx on sdc_entries(sdc_user_id);

-- 6. Weekly grid: one row per chapter per meeting date in the month
create table if not exists sdc_weeks (
  id serial primary key,
  month_id int not null references sa_months(id) on delete cascade,
  chapter_id int not null references sa_chapters(id),
  week_date date not null,                  -- the chapter's meeting date
  no_meeting boolean default false,         -- holiday / skipped: drops out of the denominator
  telebridge_done boolean,                  -- null = not yet known
  telebridge_auto boolean default false,
  telebridge_submission_id text,
  palms_done boolean,
  updated_at timestamptz default now(),
  updated_by int references sa_users(id),
  unique (month_id, chapter_id, week_date)
);

-- 7. SDCs as of Sep 2026 (PIN = 1234 for all; admin must reset each one before go-live)
insert into sa_users (role, name, chapter_id, pin_hash, jotform_alias)
select 'sdc', v.name, c.id, crypt('1234', gen_salt('bf', 10)), v.name
from (values
  ('Max Prince', 'BNI Ainthinai'),
  ('Vijai', 'BNI Bamboo Kottai'),
  ('Krain Bigstan', 'BNI Cmy Veli'),
  ('Askar Ali', 'BNI Dil Nadu'),
  ('Gunaseelan', 'BNI Tamilan'),
  ('Ramanthan', 'BNI Ejamaan'),
  ('Dr.Gopalakrishnan', 'BNI Thamira'),
  ('Mariappan Mukesh', 'BNI Saral'),
  ('Rajesh', 'BNI Korkai'),
  ('Allwin', 'BNI Nanjil'),
  ('Ramadoss', 'BNI Kanya'),
  ('Mohamed Aneez', 'BNI Comorin'),
  ('Aravind', 'BNI Kumari'),
  ('Vijai', 'BNI Kings')
) as v(name, chapter)
join sa_chapters c on c.name = v.chapter
where not exists (select 1 from sa_users u where u.role='sdc' and u.name = v.name and u.chapter_id = c.id);

alter table sdc_entries enable row level security;
alter table sdc_weeks   enable row level security;

-- 8. (22 Oct 2026) Net growth from BNI Connect "Membership Activity by Chapter": joined / left per month
alter table sdc_entries add column if not exists joined int;
alter table sdc_entries add column if not exists left_count int;
alter table sdc_entries add column if not exists net_add_auto boolean default false;  -- true when net_add came from the report

-- 9. (23 Oct 2026) Renewal % not applicable for chapters under 12 months (no Overall Retention figure on the 3+1 report)
alter table sdc_entries add column if not exists retention_na boolean default false;

-- 10. (23 Oct 2026) LTRT and DCRT attendance tracked separately (uploaded from the attendance sheets); 5 points shared by the meetings held
alter table sdc_entries add column if not exists ltrt_att boolean;
alter table sdc_entries add column if not exists dcrt_att boolean;
alter table sa_entries  add column if not exists ltrt_att boolean;
alter table sa_entries  add column if not exists dcrt_att boolean;

-- 11. SA 1st-Year Retention from the 3+1 upload: chapters under 12 months have no figure (KPI skipped, scaled to 100)
alter table sa_entries add column if not exists retention_na boolean not null default false;
