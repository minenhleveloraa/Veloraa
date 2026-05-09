# Supabase setup for Veloraa

This folder holds the SQL schema that powers auth, profiles, talent onboarding, and resume storage.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **anon public key** from *Settings → API*.
3. Copy `.env.local.example` to `.env.local` at the repo root and fill those in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## 2. Apply the schema

Open the Supabase Dashboard → **SQL Editor** → **New query**, paste the
contents of `schema.sql`, and run it. It's idempotent, so you can safely
re-run after changes.

What it creates:

- `public.profiles` — one row per authenticated user. Auto-populated via a
  trigger on `auth.users`. Tracks `role` (`talent` | `company`) and
  `onboarding_stage` (0 → 5).
- `public.talent_applications` — stage-1 data (headline, bio, skills,
  work experience JSONB, resume pointer).
- `storage.buckets.resumes` — private bucket. RLS ensures each user can
  only read/write files under `<uid>/...`.
- Row-Level Security policies so users only see their own rows.

## 3. Auth providers

In the Supabase Dashboard → **Authentication → Providers**:

- **Email** — enabled by default. To skip email confirmation during dev,
  toggle off *Confirm email*. (Leave it on for production.)
- **Google / GitHub** (optional, for the buttons on the sign-up page) —
  enable each provider and add the credentials. Set the **Redirect URL**
  to:

  ```
  http://localhost:3000/auth/callback
  https://YOUR-DOMAIN.com/auth/callback
  ```

- **Email templates** — under *Authentication → Email templates*, update
  the **Confirm signup** template to point at our custom landing route:

  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
  ```

  Set **Site URL** (*Authentication → URL Configuration*) to
  `http://localhost:3000` in dev and your production domain live.

## 4. You're ready

Run `npm run dev` and visit `http://localhost:3000/sign-up`.
