CREATE TABLE IF NOT EXISTS gym_staff_permissions (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  user_id text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  login_id text NOT NULL DEFAULT '',
  can_upload_videos boolean NOT NULL DEFAULT false,
  can_manage_videos boolean NOT NULL DEFAULT false,
  can_create_templates boolean NOT NULL DEFAULT false,
  can_edit_templates boolean NOT NULL DEFAULT false,
  can_delete_templates boolean NOT NULL DEFAULT false,
  can_submit_public_templates boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gym_staff_permissions_gym_id
  ON gym_staff_permissions (gym_id);

CREATE INDEX IF NOT EXISTS idx_gym_staff_permissions_gym_user
  ON gym_staff_permissions (gym_id, user_id);

INSERT INTO gym_staff_permissions (
  id,
  gym_id,
  user_id,
  display_name,
  login_id,
  can_upload_videos,
  can_manage_videos,
  can_create_templates,
  can_edit_templates,
  can_delete_templates,
  can_submit_public_templates
)
VALUES (
  'gsp-demo-staff-001',
  'demo-gym',
  'demo-staff-001',
  '체육관직원',
  'gymstaff',
  true,
  false,
  true,
  true,
  false,
  true
)
ON CONFLICT (gym_id, user_id) DO NOTHING;
