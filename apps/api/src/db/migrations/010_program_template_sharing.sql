ALTER TABLE program_templates
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS unpublished_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_templates_share_token
  ON program_templates (share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_templates_gym_status_visibility
  ON program_templates (gym_id, status, visibility, deleted_at);

CREATE INDEX IF NOT EXISTS idx_program_templates_share_enabled_published
  ON program_templates (share_enabled, published_at);
