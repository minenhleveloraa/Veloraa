-- Veloraa - Talent job applications and published job visibility

-- Let authenticated talent read published job posts. Company owners keep
-- their existing own-row policy from the base schema.
drop policy if exists "company_jobs_select_published" on public.company_jobs;
create policy "company_jobs_select_published"
  on public.company_jobs for select
  to authenticated
  using (status = 'published');

create table if not exists public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.company_jobs(id) on delete cascade,
  company_user_id  uuid not null references auth.users(id) on delete cascade,
  talent_user_id   uuid not null references auth.users(id) on delete cascade,
  intro_note       text not null check (length(btrim(intro_note)) >= 20 and length(intro_note) <= 1400),
  status           text not null default 'pending',
  status_note      text,
  decided_at       timestamptz,
  thread_id        uuid references public.message_threads(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(job_id, talent_user_id)
);

do $$ begin
  alter table public.job_applications
    add constraint job_applications_status_chk
    check (status in ('pending', 'accepted', 'declined', 'withdrawn'));
exception when duplicate_object then null; end $$;

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.tg_set_updated_at();

create index if not exists job_applications_job_idx
  on public.job_applications(job_id);
create index if not exists job_applications_company_idx
  on public.job_applications(company_user_id, created_at desc);
create index if not exists job_applications_talent_idx
  on public.job_applications(talent_user_id, created_at desc);
create index if not exists job_applications_thread_idx
  on public.job_applications(thread_id)
  where thread_id is not null;

alter table public.job_applications enable row level security;

drop policy if exists "job_applications_select_participants" on public.job_applications;
create policy "job_applications_select_participants"
  on public.job_applications for select
  to authenticated
  using (
    company_user_id = auth.uid()
    or talent_user_id = auth.uid()
  );

drop policy if exists "job_applications_insert_talent" on public.job_applications;
create policy "job_applications_insert_talent"
  on public.job_applications for insert
  to authenticated
  with check (
    talent_user_id = auth.uid()
    and exists (
      select 1
      from public.company_jobs job
      where job.id = job_applications.job_id
        and job.company_id = job_applications.company_user_id
        and job.status = 'published'
    )
  );

drop policy if exists "job_applications_update_participants" on public.job_applications;
drop policy if exists "job_applications_update_company" on public.job_applications;
create policy "job_applications_update_company"
  on public.job_applications for update
  to authenticated
  using (company_user_id = auth.uid())
  with check (company_user_id = auth.uid());

drop policy if exists "job_applications_withdraw_talent" on public.job_applications;
create policy "job_applications_withdraw_talent"
  on public.job_applications for update
  to authenticated
  using (talent_user_id = auth.uid())
  with check (
    talent_user_id = auth.uid()
    and status = 'withdrawn'
  );

do $$ begin
  alter publication supabase_realtime add table public.job_applications;
exception when duplicate_object then null; end $$;
