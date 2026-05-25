-- Billing subscriptions: subscription plans + gym subscriptions

ALTER TABLE payment_products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'credit_pack',
  ADD COLUMN IF NOT EXISTS billing_cycle text,
  ADD COLUMN IF NOT EXISTS included_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_subscription boolean NOT NULL DEFAULT false;

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'credit_purchase';

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  user_id text NOT NULL,
  product_id text NOT NULL,
  provider text NOT NULL DEFAULT 'manual',
  provider_subscription_id text,
  status text NOT NULL,
  billing_cycle text NOT NULL,
  price_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  included_credits_per_period integer NOT NULL DEFAULT 0,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_subscriptions_gym_status_idx
  ON billing_subscriptions (gym_id, status);

CREATE INDEX IF NOT EXISTS billing_subscriptions_gym_period_end_idx
  ON billing_subscriptions (gym_id, current_period_end);

CREATE INDEX IF NOT EXISTS billing_subscriptions_product_idx
  ON billing_subscriptions (product_id);

CREATE INDEX IF NOT EXISTS billing_subscriptions_provider_sub_idx
  ON billing_subscriptions (provider, provider_subscription_id);

CREATE INDEX IF NOT EXISTS payment_orders_subscription_idx
  ON payment_orders (subscription_id);

-- Existing credit packs
UPDATE payment_products
SET
  product_type = 'credit_pack',
  billing_cycle = NULL,
  included_credits = credits,
  is_subscription = false,
  updated_at = now()
WHERE id IN ('credit_pack_100', 'credit_pack_500', 'credit_pack_1000');

INSERT INTO payment_products (
  id,
  name,
  description,
  credits,
  price_amount,
  currency,
  is_active,
  sort_order,
  product_type,
  billing_cycle,
  included_credits,
  is_subscription
)
VALUES
  (
    'monthly_basic',
    '월정액 베이직',
    '월 단위 프로그램 운영 플랜',
    0,
    39000,
    'KRW',
    true,
    100,
    'subscription_plan',
    'monthly',
    300,
    true
  ),
  (
    'yearly_basic',
    '연간정액 베이직',
    '연 단위 프로그램 운영 플랜',
    0,
    390000,
    'KRW',
    true,
    110,
    'subscription_plan',
    'yearly',
    3600,
    true
  ),
  (
    'monthly_pro',
    '월정액 프로',
    '월 단위 프로그램 운영 프로 플랜',
    0,
    79000,
    'KRW',
    true,
    120,
    'subscription_plan',
    'monthly',
    1000,
    true
  ),
  (
    'yearly_pro',
    '연간정액 프로',
    '연 단위 프로그램 운영 프로 플랜',
    0,
    790000,
    'KRW',
    true,
    130,
    'subscription_plan',
    'yearly',
    12000,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  credits = EXCLUDED.credits,
  price_amount = EXCLUDED.price_amount,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  product_type = EXCLUDED.product_type,
  billing_cycle = EXCLUDED.billing_cycle,
  included_credits = EXCLUDED.included_credits,
  is_subscription = EXCLUDED.is_subscription,
  updated_at = now();
