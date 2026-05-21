CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploaded_videos (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_sec integer NOT NULL,
  difficulty text NOT NULL,
  body_parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_loopable boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'gym_only',
  is_premium boolean NOT NULL DEFAULT false,
  storage_key text NOT NULL,
  playback_url text NOT NULL DEFAULT '',
  thumbnail_url text,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  provider text NOT NULL DEFAULT 'r2',
  created_by text NOT NULL DEFAULT 'demo-coach',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS program_templates (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'draft',
  total_duration_sec integer NOT NULL DEFAULT 0,
  template_json jsonb NOT NULL,
  created_by text NOT NULL DEFAULT 'demo-coach',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_uploaded_videos_gym_deleted
  ON uploaded_videos (gym_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_program_templates_gym_deleted
  ON program_templates (gym_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_program_templates_gym_visibility_deleted
  ON program_templates (gym_id, visibility, deleted_at);
