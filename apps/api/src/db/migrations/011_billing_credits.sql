-- Billing: gym credit wallets, ledger, payment products/orders, webhook events

CREATE TABLE IF NOT EXISTS credit_wallets (
  id text PRIMARY KEY,
  gym_id text NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_purchased integer NOT NULL DEFAULT 0,
  lifetime_granted integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  lifetime_refunded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_wallets_gym_id_idx ON credit_wallets (gym_id);

CREATE TABLE IF NOT EXISTS credit_ledger_entries (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  wallet_id text NOT NULL,
  entry_type text NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  source_type text NOT NULL,
  source_id text,
  idempotency_key text UNIQUE,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_ledger_entries_gym_created_idx
  ON credit_ledger_entries (gym_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_ledger_entries_wallet_created_idx
  ON credit_ledger_entries (wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_ledger_entries_source_idx
  ON credit_ledger_entries (source_type, source_id);

CREATE INDEX IF NOT EXISTS credit_ledger_entries_type_created_idx
  ON credit_ledger_entries (entry_type, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  credits integer NOT NULL,
  price_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  user_id text NOT NULL,
  product_id text NOT NULL,
  provider text NOT NULL DEFAULT 'manual',
  provider_order_id text,
  provider_payment_id text,
  status text NOT NULL,
  credits integer NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  checkout_url text,
  failure_code text,
  failure_message text,
  paid_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_orders_gym_created_idx
  ON payment_orders (gym_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx
  ON payment_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_status_created_idx
  ON payment_orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_orders_provider_order_idx
  ON payment_orders (provider, provider_order_id);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  order_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

INSERT INTO payment_products (
  id,
  name,
  description,
  credits,
  price_amount,
  currency,
  is_active,
  sort_order
)
VALUES
  (
    'credit_pack_100',
    '100 크레딧',
    '체육관 운영용 기본 크레딧 팩',
    100,
    10000,
    'KRW',
    true,
    10
  ),
  (
    'credit_pack_500',
    '500 크레딧',
    '체육관 운영용 크레딧 팩 (할인)',
    500,
    45000,
    'KRW',
    true,
    20
  ),
  (
    'credit_pack_1000',
    '1000 크레딧',
    '체육관 운영용 대용량 크레딧 팩',
    1000,
    80000,
    'KRW',
    true,
    30
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  price_amount = EXCLUDED.price_amount,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO credit_wallets (
  id,
  gym_id,
  balance,
  lifetime_granted
)
VALUES (
  'wallet-demo-gym',
  'demo-gym',
  120,
  120
)
ON CONFLICT (gym_id) DO NOTHING;

INSERT INTO credit_ledger_entries (
  id,
  gym_id,
  wallet_id,
  entry_type,
  amount,
  balance_after,
  reason,
  source_type,
  source_id,
  idempotency_key,
  created_by
)
VALUES (
  'ledger-seed-demo-gym-initial',
  'demo-gym',
  'wallet-demo-gym',
  'grant',
  120,
  120,
  '데모 체육관 초기 크레딧',
  'admin_manual',
  'seed',
  'seed:demo-gym:initial-credit',
  'system'
)
ON CONFLICT (idempotency_key) DO NOTHING;
