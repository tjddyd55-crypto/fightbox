-- Auth users hardening (JWT phase 1): last login, role constraint, idempotent demo seed

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('super_admin', 'gym_admin', 'gym_staff', 'video_creator'));
  END IF;
END $$;

UPDATE users
SET gym_id = 'demo-gym'
WHERE gym_id IS NULL
  AND role IN ('super_admin', 'gym_admin', 'gym_staff');

-- Demo accounts — password: 123456!! (bcrypt cost 10). Replace before production.
INSERT INTO users (
  id,
  login_id,
  password_hash,
  display_name,
  role,
  account_scope,
  gym_id,
  creator_id,
  status
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
    NULL,
    'active'
  ),
  (
    'demo-gym-admin',
    'gymadmin',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '체육관관리자',
    'gym_admin',
    'gym',
    'demo-gym',
    NULL,
    'active'
  ),
  (
    'demo-staff-001',
    'gymstaff',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '체육관직원',
    'gym_staff',
    'gym',
    'demo-gym',
    NULL,
    'active'
  ),
  (
    'demo-creator-001',
    'creator',
    '$2b$10$9lYFUIWysr3B5Slo8D8squejn1P6yE2vjMWkny9V2bH8npa/GOez.',
    '운동영상 크리에이터',
    'video_creator',
    'creator',
    NULL,
    'demo-creator-001',
    'active'
  )
ON CONFLICT (login_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  account_scope = EXCLUDED.account_scope,
  gym_id = EXCLUDED.gym_id,
  creator_id = EXCLUDED.creator_id,
  status = EXCLUDED.status,
  updated_at = now();
