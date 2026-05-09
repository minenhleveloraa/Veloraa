-- =====================================================================
-- Veloraa — Auth, Profiles & Talent Onboarding Schema
-- Run this in Supabase SQL editor (or `supabase db push`).
-- Idempotent where possible.
-- =====================================================================

-- 1) Role enum --------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('talent', 'company');
exception when duplicate_object then null; end $$;

-- 2) Profiles --------------------------------------------------------
-- One row per auth.users row. Created automatically via trigger.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  role              public.user_role,
  email             text unique,
  full_name         text,
  avatar_url        text,
  onboarding_stage  smallint not null default 0, -- 0=not started, 1=stage-1 submitted, 2=ai analyzed, etc.
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Auto-create a profile row whenever a new auth user appears.
-- Pulls role + full_name from signup metadata if provided.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'role', '')::public.user_role,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS -----------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using ( auth.uid() = id );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- =====================================================================
-- 3) Talent applications (stage-1 data) -------------------------------
-- Stores the structured data collected during stage-1 onboarding.
-- =====================================================================
create table if not exists public.talent_applications (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  headline         text,
  location         text,
  years_experience integer,
  bio              text,
  linkedin_url     text,
  github_url       text,
  portfolio_url    text,
  skills           text[] default '{}',
  work_experience  jsonb  default '[]'::jsonb,  -- [{company,title,start,end,description,current}]
  resume_path      text,                         -- storage path in 'resumes' bucket
  resume_filename  text,
  stage_1_submitted_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists talent_applications_set_updated_at on public.talent_applications;
create trigger talent_applications_set_updated_at
  before update on public.talent_applications
  for each row execute function public.tg_set_updated_at();

alter table public.talent_applications enable row level security;

drop policy if exists "talent_apps_select_own" on public.talent_applications;
create policy "talent_apps_select_own"
  on public.talent_applications for select
  using ( auth.uid() = user_id );

drop policy if exists "talent_apps_insert_own" on public.talent_applications;
create policy "talent_apps_insert_own"
  on public.talent_applications for insert
  with check ( auth.uid() = user_id );

drop policy if exists "talent_apps_update_own" on public.talent_applications;
create policy "talent_apps_update_own"
  on public.talent_applications for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- =====================================================================
-- 4) Resume storage bucket + policies ---------------------------------
-- Private bucket. Each user can only read/write files under their own uid.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects for select
  using ( bucket_id = 'resumes' and (auth.uid())::text = (storage.foldername(name))[1] );

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects for insert
  with check ( bucket_id = 'resumes' and (auth.uid())::text = (storage.foldername(name))[1] );

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
  on storage.objects for update
  using ( bucket_id = 'resumes' and (auth.uid())::text = (storage.foldername(name))[1] );

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects for delete
  using ( bucket_id = 'resumes' and (auth.uid())::text = (storage.foldername(name))[1] );

-- =====================================================================
-- 5) Talent AI analyses (stage-2) -------------------------------------
-- Stores the OpenAI-generated grading of a talent's application.
-- One row per user_id; re-running analysis overwrites.
-- =====================================================================
create table if not exists public.talent_ai_analyses (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  model            text,                       -- e.g. 'gpt-4.1-mini'
  overall_score    integer,                    -- 0-100
  expertise_level  text,                       -- e.g. 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal'
  summary          text,                       -- 2-3 sentence human-readable summary
  strengths        text[] default '{}',
  concerns         text[] default '{}',
  skill_scores     jsonb default '[]'::jsonb,  -- [{skill, score: 0-100, evidence?}]
  dimensions       jsonb default '{}'::jsonb,  -- { domain_expertise, leadership, depth, breadth, communication } each 0-100
  recommendation   text,                       -- 'advance' | 'hold' | 'decline'
  raw              jsonb,                      -- full OpenAI response for auditing
  status           text not null default 'ready', -- 'pending' | 'ready' | 'failed'
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists talent_ai_analyses_set_updated_at on public.talent_ai_analyses;
create trigger talent_ai_analyses_set_updated_at
  before update on public.talent_ai_analyses
  for each row execute function public.tg_set_updated_at();

alter table public.talent_ai_analyses enable row level security;

drop policy if exists "talent_ai_select_own" on public.talent_ai_analyses;
create policy "talent_ai_select_own"
  on public.talent_ai_analyses for select
  using ( auth.uid() = user_id );

-- Inserts/updates happen from the server action using the user's JWT,
-- so RLS with `auth.uid() = user_id` is fine for both.
drop policy if exists "talent_ai_insert_own" on public.talent_ai_analyses;
create policy "talent_ai_insert_own"
  on public.talent_ai_analyses for insert
  with check ( auth.uid() = user_id );

drop policy if exists "talent_ai_update_own" on public.talent_ai_analyses;
create policy "talent_ai_update_own"
  on public.talent_ai_analyses for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- =====================================================================
-- 6) Admin review columns on talent_applications ----------------------
-- These track the human decision after the AI analysis. The write path
-- uses the service-role key from server actions (which first verifies
-- the caller is on the ADMIN_EMAILS allowlist), so no RLS policy is
-- needed for admins — they bypass RLS entirely.
--
-- After `review_status = approved`, the talent enters a 2-stage vetting
-- funnel driven manually by admins (conducted over email in Phase 1):
--   1. Technical assessment — tracked in the `technical_*` columns.
--   2. Senior-engineer interview — tracked in the `interview_*` columns.
-- A failure at either stage is final for the current application and
-- sets `reapply_after` just like a human-review rejection.
-- =====================================================================
alter table public.talent_applications
  add column if not exists review_status           text   not null default 'pending',
  add column if not exists review_reason           text,
  add column if not exists review_decision_at      timestamptz,
  add column if not exists reviewed_by             uuid references auth.users(id),
  add column if not exists reapply_after           date,
  add column if not exists technical_status        text   not null default 'pending',
  add column if not exists technical_reason        text,
  add column if not exists technical_decision_at   timestamptz,
  add column if not exists interview_status        text   not null default 'pending',
  add column if not exists interview_reason        text,
  add column if not exists interview_decision_at   timestamptz,
  add column if not exists previous_approved_state jsonb;

-- Cheap but important sanity constraints.
do $$ begin
  alter table public.talent_applications
    add constraint talent_applications_review_status_chk
    check (review_status in ('pending', 'approved', 'rejected', 'hidden', 'pending_update'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.talent_applications
    add constraint talent_applications_technical_status_chk
    check (technical_status in ('pending', 'passed', 'failed'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.talent_applications
    add constraint talent_applications_interview_status_chk
    check (interview_status in ('pending', 'passed', 'failed'));
exception when duplicate_object then null; end $$;

-- Helpful indexes for admin dashboard queries.
create index if not exists talent_applications_review_status_idx
  on public.talent_applications(review_status);
create index if not exists talent_applications_technical_status_idx
  on public.talent_applications(technical_status);
create index if not exists talent_applications_interview_status_idx
  on public.talent_applications(interview_status);

-- =====================================================================
-- 7) Company applications ---------------------------------------------
-- Parallel to talent_applications but for hiring companies. There is no
-- AI analysis for companies — submission goes straight to human review.
-- All fields except the required basics are nullable so the autosave
-- flow can persist partial state at any step.
-- =====================================================================
create table if not exists public.company_applications (
  user_id               uuid primary key references auth.users(id) on delete cascade,

  -- Step 2 — basics
  legal_name            text,
  website_url           text,
  logo_path             text,
  logo_filename         text,
  company_size          text,  -- '1-10' | '11-50' | '51-200' | '201-1000' | '1000+'
  hq_country            text,
  company_stage         text,  -- 'pre-seed' | 'series-ab' | 'series-c-plus' | 'bootstrapped' | 'public'

  -- Step 3 — industry + roles
  industries            text[] not null default '{}',
  roles_hiring          text[] not null default '{}',

  -- Step 4 — work style (optional)
  work_style            text,  -- 'remote' | 'hybrid' | 'in-office' | 'depends'
  hiring_regions        text[] not null default '{}',
  eng_culture           text,  -- 'ship-fast' | 'quality-first' | 'research-driven' | 'structured'

  -- Step 5 — hiring situation
  hiring_urgency        text,
  hiring_volume         text,
  salary_range          text,
  hiring_method         text,

  -- Step 6 — plan selection (no card capture at this stage)
  selected_plan         text,  -- 'free' | 'growth' | 'scale'

  -- Wizard progress
  draft_step            int    not null default 0,
  stage_1_submitted_at  timestamptz,

  -- Admin review (same model as talent)
  review_status         text   not null default 'pending',
  review_reason         text,
  review_decision_at    timestamptz,
  reviewed_by           uuid references auth.users(id),
  reapply_after         date,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists company_applications_set_updated_at on public.company_applications;
create trigger company_applications_set_updated_at
  before update on public.company_applications
  for each row execute function public.tg_set_updated_at();

alter table public.company_applications enable row level security;

drop policy if exists "company_apps_select_own" on public.company_applications;
create policy "company_apps_select_own"
  on public.company_applications for select
  using ( auth.uid() = user_id );

drop policy if exists "company_apps_insert_own" on public.company_applications;
create policy "company_apps_insert_own"
  on public.company_applications for insert
  with check ( auth.uid() = user_id );

drop policy if exists "company_apps_update_own" on public.company_applications;
create policy "company_apps_update_own"
  on public.company_applications for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

do $$ begin
  alter table public.company_applications
    add constraint company_applications_review_status_chk
    check (review_status in ('pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

create index if not exists company_applications_review_status_idx
  on public.company_applications(review_status);
create index if not exists company_applications_submitted_idx
  on public.company_applications(stage_1_submitted_at);

-- =====================================================================
-- 8) Storage bucket: company-logos ------------------------------------
-- Private bucket. Each company uploads a logo at {user_id}/logo.(ext).
-- Admins read via signed URLs using the service-role client.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  false,
  2097152,                                        -- 2 MB
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

drop policy if exists "logos_owner_select" on storage.objects;
create policy "logos_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_owner_insert" on storage.objects;
create policy "logos_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_owner_update" on storage.objects;
create policy "logos_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_owner_delete" on storage.objects;
create policy "logos_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- 9) Admins + Messaging ----------------------------------------------
-- Admins are the source of truth for `is_admin()` checks inside RLS.
-- The actual allowlist lives in the `ADMIN_EMAILS` env var (see
-- `@/lib/admin`); whenever a user visits an admin route or runs an
-- admin server action we upsert their auth.uid() into `admin_users`
-- so RLS can verify the caller is an admin without having to read env
-- vars. Rows are inserted with the service-role client only.
-- =====================================================================
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Anyone authenticated can *read* the table (used by `is_admin()`), but
-- only the service-role client can write. Reads expose only auth uids,
-- which are already known to the server.
drop policy if exists "admin_users_read" on public.admin_users;
create policy "admin_users_read"
  on public.admin_users for select
  to authenticated
  using ( true );

-- SECURITY DEFINER so RLS policies can call it regardless of the
-- caller's own visibility into admin_users.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = uid);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- --- Thread kinds ---------------------------------------------------
do $$ begin
  create type public.thread_kind as enum ('admin_support', 'company_candidate');
exception when duplicate_object then null; end $$;

-- --- Threads --------------------------------------------------------
-- For `admin_support` threads: `user_id` is the talent or company user
--   the admin is supporting; `company_user_id` and `talent_user_id`
--   are both null.
-- For `company_candidate` threads: `company_user_id` + `talent_user_id`
--   are both set; `user_id` is null.
create table if not exists public.message_threads (
  id                    uuid primary key default gen_random_uuid(),
  kind                  public.thread_kind not null,
  user_id               uuid references auth.users(id) on delete cascade,
  company_user_id       uuid references auth.users(id) on delete cascade,
  talent_user_id        uuid references auth.users(id) on delete cascade,
  subject               text,
  created_at            timestamptz not null default now(),
  last_message_at       timestamptz,
  last_message_preview  text,
  last_sender_user_id   uuid references auth.users(id) on delete set null,
  last_sender_is_admin  boolean not null default false
);

do $$ begin
  alter table public.message_threads
    add constraint message_threads_kind_shape_chk check (
      (kind = 'admin_support'
         and user_id is not null
         and company_user_id is null
         and talent_user_id is null)
      or
      (kind = 'company_candidate'
         and company_user_id is not null
         and talent_user_id  is not null
         and user_id is null)
    );
exception when duplicate_object then null; end $$;

-- One admin_support thread per user.
create unique index if not exists message_threads_admin_support_uk
  on public.message_threads (user_id)
  where kind = 'admin_support';

-- One company↔talent thread per (company, talent) pair.
create unique index if not exists message_threads_company_candidate_uk
  on public.message_threads (company_user_id, talent_user_id)
  where kind = 'company_candidate';

create index if not exists message_threads_last_msg_idx
  on public.message_threads (last_message_at desc nulls last);
create index if not exists message_threads_user_idx
  on public.message_threads (user_id);
create index if not exists message_threads_company_idx
  on public.message_threads (company_user_id);
create index if not exists message_threads_talent_idx
  on public.message_threads (talent_user_id);

alter table public.message_threads enable row level security;

drop policy if exists "threads_select_participants" on public.message_threads;
create policy "threads_select_participants"
  on public.message_threads for select
  to authenticated
  using (
    user_id         = auth.uid()
    or company_user_id = auth.uid()
    or talent_user_id  = auth.uid()
    or (kind = 'admin_support' and public.is_admin(auth.uid()))
  );

-- Companies are allowed to open a thread with a talent they've matched
-- with. Admin-side inserts go through the service-role client so they
-- bypass RLS entirely.
drop policy if exists "threads_insert_company" on public.message_threads;
create policy "threads_insert_company"
  on public.message_threads for insert
  to authenticated
  with check (
    kind = 'company_candidate'
    and company_user_id = auth.uid()
  );

-- --- Messages -------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id  uuid references auth.users(id) on delete set null,
  sender_is_admin boolean not null default false,
  body            text not null check (length(btrim(body)) > 0 and length(body) <= 10000),
  system          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.user_id         = auth.uid()
          or t.company_user_id = auth.uid()
          or t.talent_user_id  = auth.uid()
          or (t.kind = 'admin_support' and public.is_admin(auth.uid()))
        )
    )
  );

-- Only participants can insert messages attributed to themselves.
-- Admin-side inserts go through the service-role client which bypasses
-- RLS (see `@/app/actions/messages`).
drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and system = false
    and exists (
      select 1 from public.message_threads t
      where t.id = messages.thread_id
        and (
          t.user_id         = auth.uid()
          or t.company_user_id = auth.uid()
          or t.talent_user_id  = auth.uid()
        )
    )
  );

-- --- Per-participant last-read tracking -----------------------------
-- Each row records the last time a given user viewed a given thread.
-- Unread count = messages where created_at > last_read_at and sender != me.
create table if not exists public.thread_reads (
  thread_id     uuid not null references public.message_threads(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table public.thread_reads enable row level security;

drop policy if exists "thread_reads_own" on public.thread_reads;
create policy "thread_reads_own"
  on public.thread_reads for select
  to authenticated
  using ( user_id = auth.uid() );

drop policy if exists "thread_reads_own_insert" on public.thread_reads;
create policy "thread_reads_own_insert"
  on public.thread_reads for insert
  to authenticated
  with check ( user_id = auth.uid() );

drop policy if exists "thread_reads_own_update" on public.thread_reads;
create policy "thread_reads_own_update"
  on public.thread_reads for update
  to authenticated
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- --- Realtime publication -------------------------------------------
-- Opt messages + threads into the default Supabase Realtime publication
-- so the UI can subscribe to INSERT/UPDATE events. RLS still applies
-- to the delivered payloads.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.message_threads;
exception when duplicate_object then null; end $$;

-- =====================================================================
-- 10) Company Jobs
-- =====================================================================
create table if not exists public.company_jobs (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  role_category     text not null,
  seniority         text not null,
  employment_type   text not null,
  work_arrangement  text not null,
  location          text,
  salary_range      text,
  description       text not null,
  skills            text[] not null default '{}',
  benefits          text,
  status            text not null default 'draft',
  review_reason     text,
  reviewed_by       uuid references auth.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

do $$ begin
  alter table public.company_jobs
    add constraint company_jobs_status_chk
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'published'));
exception when duplicate_object then null; end $$;

create index if not exists company_jobs_company_idx on public.company_jobs(company_id);
create index if not exists company_jobs_status_idx on public.company_jobs(status);

alter table public.company_jobs enable row level security;

drop policy if exists "company_jobs_select_own" on public.company_jobs;
create policy "company_jobs_select_own"
  on public.company_jobs for select
  using ( auth.uid() = company_id );

drop policy if exists "company_jobs_insert_own" on public.company_jobs;
create policy "company_jobs_insert_own"
  on public.company_jobs for insert
  with check ( auth.uid() = company_id );

drop policy if exists "company_jobs_update_own" on public.company_jobs;
create policy "company_jobs_update_own"
  on public.company_jobs for update
  using ( auth.uid() = company_id )
  with check ( auth.uid() = company_id );

-- =====================================================================
-- 11) Job Recommendations
-- =====================================================================
create table if not exists public.job_recommendations (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.company_jobs(id) on delete cascade,
  talent_user_id    uuid not null references auth.users(id) on delete cascade,
  recommended_by    uuid references auth.users(id) on delete set null,
  note              text,
  created_at        timestamptz not null default now(),
  unique(job_id, talent_user_id)
);

create index if not exists job_recommendations_job_idx on public.job_recommendations(job_id);
create index if not exists job_recommendations_talent_idx on public.job_recommendations(talent_user_id);

alter table public.job_recommendations enable row level security;

-- Only companies can see recommendations for their jobs
drop policy if exists "job_recommendations_select_company" on public.job_recommendations;
create policy "job_recommendations_select_company"
  on public.job_recommendations for select
  to authenticated
  using (
    exists (
      select 1 from public.company_jobs cj
      where cj.id = job_recommendations.job_id
        and cj.company_id = auth.uid()
    )
  );

-- Talent can see their own recommendations
drop policy if exists "job_recommendations_select_talent" on public.job_recommendations;
create policy "job_recommendations_select_talent"
  on public.job_recommendations for select
  to authenticated
  using ( talent_user_id = auth.uid() );

-- =====================================================================
-- 12) Interview Invitations
-- =====================================================================
create table if not exists public.interview_invitations (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.company_jobs(id) on delete cascade,
  company_user_id   uuid not null references auth.users(id) on delete cascade,
  talent_user_id    uuid not null references auth.users(id) on delete cascade,
  proposed_dates    text[] not null default '{}',
  accepted_date     text,
  message           text,
  status            text not null default 'pending',
  decline_reason    text,
  thread_id         uuid references public.message_threads(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

do $$ begin
  alter table public.interview_invitations
    add constraint interview_invitations_status_chk
    check (status in ('pending', 'accepted', 'declined'));
exception when duplicate_object then null; end $$;

create index if not exists interview_invitations_job_idx on public.interview_invitations(job_id);
create index if not exists interview_invitations_company_idx on public.interview_invitations(company_user_id);
create index if not exists interview_invitations_talent_idx on public.interview_invitations(talent_user_id);

alter table public.interview_invitations enable row level security;

drop policy if exists "interview_invitations_select_participants" on public.interview_invitations;
create policy "interview_invitations_select_participants"
  on public.interview_invitations for select
  to authenticated
  using (
    company_user_id = auth.uid()
    or talent_user_id = auth.uid()
  );

drop policy if exists "interview_invitations_insert_company" on public.interview_invitations;
create policy "interview_invitations_insert_company"
  on public.interview_invitations for insert
  to authenticated
  with check ( company_user_id = auth.uid() );

drop policy if exists "interview_invitations_update_participants" on public.interview_invitations;
create policy "interview_invitations_update_participants"
  on public.interview_invitations for update
  to authenticated
  using (
    company_user_id = auth.uid()
    or talent_user_id = auth.uid()
  )
  with check (
    company_user_id = auth.uid()
    or talent_user_id = auth.uid()
  );
