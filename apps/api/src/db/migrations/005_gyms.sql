CREATE TABLE IF NOT EXISTS gyms (
  id text PRIMARY KEY,
  gym_code text NOT NULL UNIQUE,
  name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  memo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_by text NOT NULL DEFAULT 'demo-super-admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_gyms_gym_code ON gyms (gym_code);
CREATE INDEX IF NOT EXISTS idx_gyms_status_deleted ON gyms (status, deleted_at);

INSERT INTO gyms (
  id,
  gym_code,
  name,
  owner_name,
  status,
  created_by
)
VALUES (
  'demo-gym',
  'DEMO-GYM',
  '데모 체육관',
  '데모 관리자',
  'active',
  'demo-super-admin'
)
ON CONFLICT (id) DO NOTHING;
