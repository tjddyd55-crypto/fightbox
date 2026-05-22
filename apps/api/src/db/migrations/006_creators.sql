CREATE TABLE IF NOT EXISTS creators (
  id text PRIMARY KEY,
  creator_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payout_enabled boolean NOT NULL DEFAULT false,
  revenue_share_rate numeric(5, 2),
  memo text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'demo-super-admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_creators_creator_code ON creators (creator_code);
CREATE INDEX IF NOT EXISTS idx_creators_status_deleted ON creators (status, deleted_at);

INSERT INTO creators (
  id,
  creator_code,
  display_name,
  status,
  payout_enabled,
  revenue_share_rate,
  created_by
)
VALUES (
  'demo-creator-001',
  'CREATOR-DEMO',
  '데모 영상 크리에이터',
  'active',
  false,
  NULL,
  'demo-super-admin'
)
ON CONFLICT (id) DO NOTHING;
