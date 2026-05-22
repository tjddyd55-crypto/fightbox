CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id text PRIMARY KEY,
  login_id text NOT NULL DEFAULT '',
  user_id text,
  gym_id text,
  role text,
  event_type text NOT NULL,
  success boolean NOT NULL,
  failure_code text,
  ip_address text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at
  ON auth_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_login_id_created_at
  ON auth_audit_logs (login_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id_created_at
  ON auth_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_success_created_at
  ON auth_audit_logs (success, created_at DESC);
