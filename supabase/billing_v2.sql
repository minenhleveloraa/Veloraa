-- =====================================================================
-- Veloraa Billing v2 Migration
-- Run this AFTER `billing_schema.sql` in the Supabase SQL editor.
-- Idempotent: safe to re-run.
-- =====================================================================

-- 1. Persist subscription currency on every webhook update (so it never
--    drifts between USD/ZAR). `payment_currency` is kept as a back-compat
--    mirror until all readers migrate.
alter table public.company_applications
  add column if not exists subscription_currency text
    check (subscription_currency in ('USD', 'ZAR'));

-- Backfill from the legacy column.
update public.company_applications
   set subscription_currency = coalesce(payment_currency, 'USD')
 where subscription_currency is null;

-- 2. Stable de-dupe key for both providers' webhook events.
alter table public.billing_events
  add column if not exists provider_event_id text;

create unique index if not exists billing_events_provider_event_uk
  on public.billing_events (provider, provider_event_id)
  where provider_event_id is not null;

-- 3. First-class invoice/receipt table — provider-agnostic.
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('paddle', 'payfast')),
  provider_ref    text not null,                  -- Paddle txn id / PayFast pf_payment_id
  number          text,                            -- VLR-YYYY-000NNN
  status          text not null default 'paid'
                  check (status in ('paid', 'refunded', 'void')),
  amount_cents    bigint not null,                 -- smallest unit
  currency        text not null check (currency in ('USD', 'ZAR')),
  plan_id         text not null check (plan_id in ('growth', 'scale')),
  interval        text not null check (interval in ('monthly', 'annual')),
  period_start    timestamptz,
  period_end      timestamptz,
  pdf_url         text,                            -- signed Storage URL or null
  emitted_at      timestamptz not null default now()
);

create unique index if not exists invoices_provider_ref_uk
  on public.invoices (provider, provider_ref);

create index if not exists invoices_user_idx
  on public.invoices (user_id, emitted_at desc);

alter table public.invoices enable row level security;

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
  on public.invoices for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- No direct insert / update / delete from clients — only the service role.
drop policy if exists "invoices_no_direct_write" on public.invoices;
create policy "invoices_no_direct_write"
  on public.invoices for insert
  to authenticated
  with check (false);

-- 4. Storage bucket for PDF receipts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "receipts_owner_select" on storage.objects;
create policy "receipts_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. New 'pending' status for the awkward gap between checkout-init and
--    webhook confirmation. Recreate the check constraint to add it.
do $$
begin
  alter table public.company_applications
    drop constraint if exists company_applications_subscription_status_check;
  alter table public.company_applications
    add constraint company_applications_subscription_status_check
    check (subscription_status in (
      'free', 'active', 'paused', 'cancelled', 'past_due', 'pending'
    ));
exception when others then null;
end $$;

-- 6. Sequence for monotonic invoice numbering (VLR-YYYY-000NNN).
create sequence if not exists public.invoice_number_seq start 1;

-- RPC wrapper because supabase-js can't call nextval() directly.
create or replace function public.next_invoice_number()
  returns text
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  n bigint;
  y text;
begin
  n := nextval('public.invoice_number_seq');
  y := to_char(now(), 'YYYY');
  return 'VLR-' || y || '-' || lpad(n::text, 6, '0');
end;
$$;

revoke all on function public.next_invoice_number() from public;
grant execute on function public.next_invoice_number() to service_role;

-- 7. Backfill: anyone whose subscription is still "free" but whose
--    `selected_plan` was "growth" / "scale" gets it cleared so they are
--    not silently upgraded by the new resolver.
update public.company_applications
   set selected_plan = 'free'
 where subscription_status = 'free'
   and selected_plan in ('growth', 'scale');

-- =====================================================================
-- Done. Confirm with:
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='company_applications'
--      and column_name='subscription_currency';
--   select count(*) from public.invoices;
-- =====================================================================
