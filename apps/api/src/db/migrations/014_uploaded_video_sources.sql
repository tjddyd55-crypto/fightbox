ALTER TABLE uploaded_videos
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'uploaded';

ALTER TABLE uploaded_videos
  ADD COLUMN IF NOT EXISTS external_provider text;

ALTER TABLE uploaded_videos
  ADD COLUMN IF NOT EXISTS external_video_id text;

ALTER TABLE uploaded_videos
  ADD COLUMN IF NOT EXISTS external_url text;

ALTER TABLE uploaded_videos
  ADD COLUMN IF NOT EXISTS embed_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploaded_videos_source_type_check'
  ) THEN
    ALTER TABLE uploaded_videos
      ADD CONSTRAINT uploaded_videos_source_type_check
      CHECK (source_type IN ('uploaded', 'youtube'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_uploaded_videos_gym_source_type
  ON uploaded_videos (gym_id, source_type);

CREATE INDEX IF NOT EXISTS idx_uploaded_videos_external_provider_video
  ON uploaded_videos (external_provider, external_video_id);

UPDATE uploaded_videos
SET source_type = 'uploaded'
WHERE source_type IS NULL OR source_type = '';
