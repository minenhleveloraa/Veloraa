-- =====================================================================
-- Veloraa — Add Velscreen columns to talent_applications
-- Run this in the Supabase SQL Editor alongside the Velscreen migration
-- =====================================================================

-- Add Velscreen integration columns to talent_applications
ALTER TABLE talent_applications
  ADD COLUMN IF NOT EXISTS velscreen_session_token TEXT,
  ADD COLUMN IF NOT EXISTS velscreen_interview_url TEXT,
  ADD COLUMN IF NOT EXISTS velscreen_report JSONB,
  ADD COLUMN IF NOT EXISTS velscreen_completed_at TIMESTAMPTZ;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_talent_apps_velscreen_token
  ON talent_applications(velscreen_session_token)
  WHERE velscreen_session_token IS NOT NULL;
