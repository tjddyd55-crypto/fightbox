ALTER TABLE program_templates
ADD COLUMN IF NOT EXISTS public_review_status text,
ADD COLUMN IF NOT EXISTS public_rejection_reason text,
ADD COLUMN IF NOT EXISTS public_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS public_reviewed_by text;

CREATE INDEX IF NOT EXISTS idx_program_templates_public_pending
  ON program_templates (visibility, deleted_at)
  WHERE visibility = 'public_pending' AND deleted_at IS NULL;
