ALTER TABLE uploaded_videos
ADD COLUMN IF NOT EXISTS thumbnail_storage_key text;
