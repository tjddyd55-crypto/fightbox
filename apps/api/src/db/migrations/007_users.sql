CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  login_id text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL,
  account_scope text NOT NULL,
  gym_id text,
  creator_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_login_id ON users (login_id);
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users (gym_id);
CREATE INDEX IF NOT EXISTS idx_users_creator_id ON users (creator_id);

-- Demo accounts — password: 123456!! (bcrypt cost 10)
INSERT INTO users (
  id,
  login_id,
  password_hash,
  display_name,
  role,
  account_scope,
  gym_id,
  creator_id
)
VALUES
  (
    'demo-super-admin',
    'superadmin',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '슈퍼관리자',
    'super_admin',
    'platform',
    'demo-gym',
    NULL
  ),
  (
    'demo-gym-admin',
    'gymadmin',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '체육관관리자',
    'gym_admin',
    'gym',
    'demo-gym',
    NULL
  ),
  (
    'demo-staff-001',
    'gymstaff',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '체육관직원',
    'gym_staff',
    'gym',
    'demo-gym',
    NULL
  ),
  (
    'demo-creator-001',
    'creator',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '운동영상 크리에이터',
    'video_creator',
    'creator',
    NULL,
    'demo-creator-001'
  )
ON CONFLICT (id) DO NOTHING;
