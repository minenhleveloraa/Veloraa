-- =====================================================================
-- Veloraa Billing Schema Migration
-- Run in Supabase SQL editor
-- =====================================================================

-- Billing columns on company_applications
alter table company_applications add column if not exists
  company_domain text;

alter table company_applications add column if not exists
  has_used_free_post boolean default false;

alter table company_applications add column if not exists
  payment_provider text
    check (payment_provider in ('paddle', 'payfast'))
    default 'paddle';

alter table company_applications add column if not exists
  payment_currency text
    check (payment_currency in ('USD', 'ZAR'))
    default 'USD';

alter table company_applications add column if not exists
  subscription_plan text
    check (subscription_plan in ('free', 'growth', 'scale'))
    default 'free';

alter table company_applications add column if not exists
  subscription_status text
    check (subscription_status in ('free', 'active', 'paused', 'cancelled', 'past_due'))
    default 'free';

alter table company_applications add column if not exists
  subscription_interval text
    check (subscription_interval in ('monthly', 'annual'))
    default 'monthly';

alter table company_applications add column if not exists
  current_period_start timestamptz;

alter table company_applications add column if not exists
  current_period_end timestamptz;

-- Paddle-specific
alter table company_applications add column if not exists
  paddle_customer_id text;

alter table company_applications add column if not exists
  paddle_subscription_id text;

-- PayFast-specific
alter table company_applications add column if not exists
  payfast_token text;

alter table company_applications add column if not exists
  payfast_subscription_ref text;

-- Indexes
create index if not exists idx_employer_company_domain
  on company_applications(company_domain);

create index if not exists idx_employer_subscription_status
  on company_applications(subscription_status);

create index if not exists idx_employer_paddle_sub
  on company_applications(paddle_subscription_id)
  where paddle_subscription_id is not null;

-- =====================================================================
-- Billing events log table
-- =====================================================================

create table if not exists billing_events (
  id uuid default gen_random_uuid() primary key,
  employer_id uuid references company_applications(user_id) on delete cascade,
  provider text not null check (provider in ('paddle', 'payfast')),
  event_type text not null,
  event_data jsonb,
  processed_at timestamptz default now()
);

alter table billing_events enable row level security;

-- Only admins can read billing events
create policy "Admin reads billing events"
  on billing_events for select
  using (is_admin());

-- No user can insert directly — only server via service role
create policy "No direct insert on billing events"
  on billing_events for insert
  with check (false);

-- =====================================================================
-- RLS Policies for billing data
-- =====================================================================

-- Employers can only read their own billing profile
-- (This policy likely already exists; create only if not present)
-- create policy "Employer reads own billing profile"
--   on company_applications for select
--   using (auth.uid() = id);
