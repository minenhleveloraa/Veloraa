-- ==========================================================================
-- Veloraa Realtime Migration
-- Adds tables to the supabase_realtime publication and creates admin SELECT
-- policies so admin tabs receive realtime payloads (service-role bypass does
-- NOT apply to Realtime which is JWT-gated).
--
-- This migration is idempotent — safe to re-run.
-- ==========================================================================

-- 1. Opt the rest of the user-visible tables into the realtime publication.
do $$ begin
  alter publication supabase_realtime add table public.talent_applications;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.company_applications;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.company_jobs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.interview_invitations;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.job_recommendations;
exception when duplicate_object then null; end $$;

-- 2. Admin SELECT policies so admin tabs receive realtime payloads.
--    (Service-role bypass is fine for SSR but realtime is JWT-gated.)
drop policy if exists "talent_apps_admin_select" on public.talent_applications;
create policy "talent_apps_admin_select"
  on public.talent_applications for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "company_apps_admin_select" on public.company_applications;
create policy "company_apps_admin_select"
  on public.company_applications for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

drop policy if exists "company_jobs_admin_select" on public.company_jobs;
create policy "company_jobs_admin_select"
  on public.company_jobs for select
  to authenticated
  using ( public.is_admin(auth.uid()) );

-- ==========================================================================
-- Phase 3: Notifications table (first-class, enables push/mute/read/email)
-- ==========================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null, -- 'message' | 'invite' | 'review_decision' | 'recommendation' | 'subscription'
  title       text not null,
  body        text,
  ref_table   text,          -- 'messages' | 'interview_invitations' | ...
  ref_id      uuid,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using ( user_id = auth.uid() );

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
