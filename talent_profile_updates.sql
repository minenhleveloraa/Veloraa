-- 1. Drop the old constraint
ALTER TABLE public.talent_applications
  DROP CONSTRAINT IF EXISTS talent_applications_review_status_chk;

-- 2. Add the new constraint allowing 'hidden' and 'pending_update'
ALTER TABLE public.talent_applications
  ADD CONSTRAINT talent_applications_review_status_chk
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'hidden', 'pending_update'));

-- 3. Add the column for storing the previous approved state to show diffs
ALTER TABLE public.talent_applications
  ADD COLUMN IF NOT EXISTS previous_approved_state jsonb;
