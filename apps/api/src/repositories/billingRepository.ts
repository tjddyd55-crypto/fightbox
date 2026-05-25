import { randomUUID } from 'node:crypto';
import type {
  BillingCycle,
  BillingSubscriptionDto,
  BillingSubscriptionStatus,
  CreditLedgerEntryDto,
  CreditLedgerEntryType,
  CreditWalletDto,
  PaymentOrderDto,
  PaymentOrderStatus,
  PaymentOrderType,
  PaymentProductDto,
  PaymentProductType,
} from '@fightbox/shared';
import { buildSubscriptionGrantIdempotencyKey } from '@fightbox/shared';
import type { PoolClient } from 'pg';
import { getDatabasePool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

interface CreditWalletRow {
  id: string;
  gym_id: string;
  balance: number;
  lifetime_purchased: number;
  lifetime_granted: number;
  lifetime_spent: number;
  lifetime_refunded: number;
  created_at: Date;
  updated_at: Date;
}

interface CreditLedgerRow {
  id: string;
  gym_id: string;
  wallet_id: string;
  entry_type: string;
  amount: number;
  balance_after: number;
  reason: string;
  source_type: string;
  source_id: string | null;
  created_by: string | null;
  created_at: Date;
}

interface PaymentProductRow {
  id: string;
  name: string;
  description: string;
  credits: number;
  price_amount: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  product_type: string;
  billing_cycle: string | null;
  included_credits: number;
  is_subscription: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PaymentOrderRow {
  id: string;
  gym_id: string;
  user_id: string;
  product_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: string;
  credits: number;
  amount: number;
  currency: string;
  checkout_url: string | null;
  failure_code: string | null;
  failure_message: string | null;
  subscription_id: string | null;
  order_type: string;
  paid_at: Date | null;
  cancelled_at: Date | null;
  refunded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface BillingSubscriptionRow {
  id: string;
  gym_id: string;
  user_id: string;
  product_id: string;
  provider: string;
  provider_subscription_id: string | null;
  status: string;
  billing_cycle: string;
  price_amount: number;
  currency: string;
  included_credits_per_period: number;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  cancelled_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const PRODUCT_SELECT = `id, name, description, credits, price_amount, currency, is_active, sort_order,
  product_type, billing_cycle, included_credits, is_subscription, created_at, updated_at`;

const ORDER_SELECT = `id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
  status, credits, amount, currency, checkout_url, failure_code, failure_message,
  subscription_id, order_type, paid_at, cancelled_at, refunded_at, created_at, updated_at`;

const SUBSCRIPTION_SELECT = `id, gym_id, user_id, product_id, provider, provider_subscription_id, status,
  billing_cycle, price_amount, currency, included_credits_per_period, current_period_start,
  current_period_end, cancel_at_period_end, cancelled_at, ended_at, created_at, updated_at`;

const VALID_LEDGER_TYPES: CreditLedgerEntryType[] = [
  'purchase',
  'grant',
  'spend',
  'refund',
  'adjustment',
  'revoke',
];

const VALID_ORDER_STATUSES: PaymentOrderStatus[] = [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
];

export interface CreateLedgerEntryInput {
  gymId: string;
  entryType: CreditLedgerEntryType;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId?: string | null;
  idempotencyKey?: string | null;
  createdBy?: string | null;
}

export interface SpendCreditsInput {
  gymId: string;
  amount: number;
  sourceType: string;
  sourceId: string;
  reason: string;
  idempotencyKey: string;
  createdBy: string;
}

interface LedgerApplyOptions {
  insufficientStatus?: number;
  insufficientMessage?: string;
}

export interface CreatePaymentOrderInput {
  gymId: string;
  userId: string;
  productId: string;
  provider: string;
  providerOrderId?: string | null;
  credits: number;
  amount: number;
  currency: string;
  checkoutUrl?: string | null;
  subscriptionId?: string | null;
  orderType?: PaymentOrderType;
}

export interface CreateBillingSubscriptionInput {
  gymId: string;
  userId: string;
  productId: string;
  provider: string;
  billingCycle: BillingCycle;
  priceAmount: number;
  currency: string;
  includedCreditsPerPeriod: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface UpdatePaymentOrderStatusInput {
  orderId: string;
  status: PaymentOrderStatus;
  providerPaymentId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return new ApiError(409, 'DUPLICATE_ENTRY', 'Duplicate billing record');
  }
  if (error instanceof Error) {
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

function walletRowToDto(row: CreditWalletRow): CreditWalletDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    balance: row.balance,
    lifetimePurchased: row.lifetime_purchased,
    lifetimeGranted: row.lifetime_granted,
    lifetimeSpent: row.lifetime_spent,
    lifetimeRefunded: row.lifetime_refunded,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function ledgerRowToDto(row: CreditLedgerRow): CreditLedgerEntryDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    walletId: row.wallet_id,
    entryType: row.entry_type as CreditLedgerEntryType,
    amount: row.amount,
    balanceAfter: row.balance_after,
    reason: row.reason,
    sourceType: row.source_type,
    sourceId: row.source_id,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  };
}

function productRowToDto(row: PaymentProductRow): PaymentProductDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    credits: row.credits,
    priceAmount: row.price_amount,
    currency: row.currency,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    productType: row.product_type as PaymentProductType,
    billingCycle: (row.billing_cycle as BillingCycle | null) ?? null,
    includedCredits: row.included_credits,
    isSubscription: row.is_subscription,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function orderRowToDto(row: PaymentOrderRow): PaymentOrderDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    productId: row.product_id,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id,
    status: row.status as PaymentOrderStatus,
    credits: row.credits,
    amount: row.amount,
    currency: row.currency,
    checkoutUrl: row.checkout_url,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    subscriptionId: row.subscription_id,
    orderType: (row.order_type ?? 'credit_purchase') as PaymentOrderType,
    paidAt: row.paid_at?.toISOString() ?? null,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    refundedAt: row.refunded_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function subscriptionRowToDto(row: BillingSubscriptionRow): BillingSubscriptionDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    productId: row.product_id,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
    status: row.status as BillingSubscriptionStatus,
    billingCycle: row.billing_cycle as BillingCycle,
    priceAmount: row.price_amount,
    currency: row.currency,
    includedCreditsPerPeriod: row.included_credits_per_period,
    currentPeriodStart: row.current_period_start.toISOString(),
    currentPeriodEnd: row.current_period_end.toISOString(),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    endedAt: row.ended_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function buildWalletId(gymId: string): string {
  return `wallet-${gymId}`;
}

function assertLedgerType(entryType: string): asserts entryType is CreditLedgerEntryType {
  if (!VALID_LEDGER_TYPES.includes(entryType as CreditLedgerEntryType)) {
    throw new ApiError(400, 'INVALID_LEDGER_TYPE', `Invalid ledger entry type: ${entryType}`);
  }
}

function assertOrderStatus(status: string): asserts status is PaymentOrderStatus {
  if (!VALID_ORDER_STATUSES.includes(status as PaymentOrderStatus)) {
    throw new ApiError(400, 'INVALID_ORDER_STATUS', `Invalid order status: ${status}`);
  }
}

function applyLifetimeCounters(
  row: CreditWalletRow,
  entryType: CreditLedgerEntryType,
  amount: number,
): Partial<CreditWalletRow> {
  switch (entryType) {
    case 'purchase':
      return { lifetime_purchased: row.lifetime_purchased + amount };
    case 'grant':
      return { lifetime_granted: row.lifetime_granted + amount };
    case 'spend':
      return { lifetime_spent: row.lifetime_spent + Math.abs(amount) };
    case 'refund':
      return { lifetime_refunded: row.lifetime_refunded + amount };
    case 'adjustment':
      if (amount >= 0) {
        return { lifetime_granted: row.lifetime_granted + amount };
      }
      return { lifetime_spent: row.lifetime_spent + Math.abs(amount) };
    case 'revoke':
      return { lifetime_spent: row.lifetime_spent + Math.abs(amount) };
    default:
      return {};
  }
}

async function selectWalletForUpdate(
  client: PoolClient,
  gymId: string,
): Promise<CreditWalletRow> {
  const existing = await client.query<CreditWalletRow>(
    `SELECT id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
            lifetime_refunded, created_at, updated_at
     FROM credit_wallets
     WHERE gym_id = $1
     FOR UPDATE`,
    [gymId],
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const walletId = buildWalletId(gymId);
  const inserted = await client.query<CreditWalletRow>(
    `INSERT INTO credit_wallets (id, gym_id)
     VALUES ($1, $2)
     ON CONFLICT (gym_id) DO NOTHING
     RETURNING id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
               lifetime_refunded, created_at, updated_at`,
    [walletId, gymId],
  );

  if (inserted.rows[0]) {
    return inserted.rows[0];
  }

  const locked = await client.query<CreditWalletRow>(
    `SELECT id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
            lifetime_refunded, created_at, updated_at
     FROM credit_wallets
     WHERE gym_id = $1
     FOR UPDATE`,
    [gymId],
  );

  if (!locked.rows[0]) {
    throw new ApiError(500, 'WALLET_CREATE_FAILED', 'Failed to create credit wallet');
  }

  return locked.rows[0];
}

export async function getOrCreateCreditWallet(gymId: string): Promise<CreditWalletDto> {
  try {
    const pool = getDatabasePool();
    const existing = await pool.query<CreditWalletRow>(
      `SELECT id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
              lifetime_refunded, created_at, updated_at
       FROM credit_wallets
       WHERE gym_id = $1`,
      [gymId],
    );

    if (existing.rows[0]) {
      return walletRowToDto(existing.rows[0]);
    }

    const walletId = buildWalletId(gymId);
    const inserted = await pool.query<CreditWalletRow>(
      `INSERT INTO credit_wallets (id, gym_id)
       VALUES ($1, $2)
       ON CONFLICT (gym_id) DO UPDATE SET gym_id = EXCLUDED.gym_id
       RETURNING id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
                 lifetime_refunded, created_at, updated_at`,
      [walletId, gymId],
    );

    return walletRowToDto(inserted.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getCreditWallet(gymId: string): Promise<CreditWalletDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<CreditWalletRow>(
      `SELECT id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
              lifetime_refunded, created_at, updated_at
       FROM credit_wallets
       WHERE gym_id = $1`,
      [gymId],
    );
    return result.rows[0] ? walletRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listCreditWallets(): Promise<CreditWalletDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<CreditWalletRow>(
      `SELECT id, gym_id, balance, lifetime_purchased, lifetime_granted, lifetime_spent,
              lifetime_refunded, created_at, updated_at
       FROM credit_wallets
       ORDER BY gym_id ASC`,
    );
    return result.rows.map(walletRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listCreditLedgerEntries(
  gymId: string,
  limit = 100,
): Promise<CreditLedgerEntryDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<CreditLedgerRow>(
      `SELECT id, gym_id, wallet_id, entry_type, amount, balance_after, reason,
              source_type, source_id, created_by, created_at
       FROM credit_ledger_entries
       WHERE gym_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [gymId, limit],
    );
    return result.rows.map(ledgerRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

async function applyLedgerEntryOnClient(
  client: PoolClient,
  input: CreateLedgerEntryInput,
  options?: LedgerApplyOptions,
): Promise<CreditLedgerEntryDto> {
  assertLedgerType(input.entryType);

  if (input.idempotencyKey) {
    const existing = await client.query<CreditLedgerRow>(
      `SELECT id, gym_id, wallet_id, entry_type, amount, balance_after, reason,
              source_type, source_id, created_by, created_at
       FROM credit_ledger_entries
       WHERE idempotency_key = $1`,
      [input.idempotencyKey],
    );
    if (existing.rows[0]) {
      return ledgerRowToDto(existing.rows[0]);
    }
  }

  const wallet = await selectWalletForUpdate(client, input.gymId);
  const newBalance = wallet.balance + input.amount;

  if (newBalance < 0) {
    throw new ApiError(
      options?.insufficientStatus ?? 400,
      'INSUFFICIENT_CREDITS',
      options?.insufficientMessage ?? 'Insufficient credit balance',
    );
  }

  const lifetimePatch = applyLifetimeCounters(wallet, input.entryType, input.amount);
  const ledgerId = `ledger-${randomUUID()}`;

  await client.query(
    `UPDATE credit_wallets
     SET balance = $2,
         lifetime_purchased = $3,
         lifetime_granted = $4,
         lifetime_spent = $5,
         lifetime_refunded = $6,
         updated_at = now()
     WHERE id = $1`,
    [
      wallet.id,
      newBalance,
      lifetimePatch.lifetime_purchased ?? wallet.lifetime_purchased,
      lifetimePatch.lifetime_granted ?? wallet.lifetime_granted,
      lifetimePatch.lifetime_spent ?? wallet.lifetime_spent,
      lifetimePatch.lifetime_refunded ?? wallet.lifetime_refunded,
    ],
  );

  const inserted = await client.query<CreditLedgerRow>(
    `INSERT INTO credit_ledger_entries (
       id, gym_id, wallet_id, entry_type, amount, balance_after, reason,
       source_type, source_id, idempotency_key, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, gym_id, wallet_id, entry_type, amount, balance_after, reason,
               source_type, source_id, created_by, created_at`,
    [
      ledgerId,
      input.gymId,
      wallet.id,
      input.entryType,
      input.amount,
      newBalance,
      input.reason,
      input.sourceType,
      input.sourceId ?? null,
      input.idempotencyKey ?? null,
      input.createdBy ?? null,
    ],
  );

  return ledgerRowToDto(inserted.rows[0]);
}

export async function spendCredits(
  input: SpendCreditsInput,
  externalClient?: PoolClient,
): Promise<CreditLedgerEntryDto> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new ApiError(400, 'INVALID_AMOUNT', 'amount must be a positive integer');
  }

  const ledgerInput: CreateLedgerEntryInput = {
    gymId: input.gymId,
    entryType: 'spend',
    amount: -input.amount,
    reason: input.reason,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    idempotencyKey: input.idempotencyKey,
    createdBy: input.createdBy,
  };

  const insufficientOptions: LedgerApplyOptions = {
    insufficientStatus: 402,
    insufficientMessage: '크레딧이 부족합니다. 크레딧을 충전한 뒤 다시 시도해 주세요.',
  };

  if (externalClient) {
    return applyLedgerEntryOnClient(externalClient, ledgerInput, insufficientOptions);
  }

  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const entry = await applyLedgerEntryOnClient(client, ledgerInput, insufficientOptions);
    await client.query('COMMIT');
    return entry;
  } catch (error) {
    await client.query('ROLLBACK');
    throw wrapDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function createLedgerEntryWithWalletUpdate(
  input: CreateLedgerEntryInput,
): Promise<CreditLedgerEntryDto> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const entry = await applyLedgerEntryOnClient(client, input);
    await client.query('COMMIT');
    return entry;
  } catch (error) {
    await client.query('ROLLBACK');
    throw wrapDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function listPaymentProducts(): Promise<PaymentProductDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM payment_products
       WHERE is_active = true
       ORDER BY sort_order ASC, id ASC`,
    );
    return result.rows.map(productRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getPaymentProduct(productId: string): Promise<PaymentProductDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM payment_products
       WHERE id = $1`,
      [productId],
    );
    return result.rows[0] ? productRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderDto> {
  try {
    const pool = getDatabasePool();
    const orderId = `order-${randomUUID()}`;
    const result = await pool.query<PaymentOrderRow>(
      `INSERT INTO payment_orders (
         id, gym_id, user_id, product_id, provider, provider_order_id, status,
         credits, amount, currency, checkout_url, subscription_id, order_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12)
       RETURNING ${ORDER_SELECT}`,
      [
        orderId,
        input.gymId,
        input.userId,
        input.productId,
        input.provider,
        input.providerOrderId ?? null,
        input.credits,
        input.amount,
        input.currency,
        input.checkoutUrl ?? null,
        input.subscriptionId ?? null,
        input.orderType ?? 'credit_purchase',
      ],
    );
    return orderRowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getPaymentOrder(orderId: string): Promise<PaymentOrderDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentOrderRow>(
      `SELECT ${ORDER_SELECT}
       FROM payment_orders
       WHERE id = $1`,
      [orderId],
    );
    return result.rows[0] ? orderRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listPaymentOrders(gymId: string): Promise<PaymentOrderDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentOrderRow>(
      `SELECT ${ORDER_SELECT}
       FROM payment_orders
       WHERE gym_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [gymId],
    );
    return result.rows.map(orderRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updatePaymentOrderStatus(
  input: UpdatePaymentOrderStatusInput,
): Promise<PaymentOrderDto> {
  assertOrderStatus(input.status);

  try {
    const pool = getDatabasePool();
    const paidAt = input.status === 'paid' ? new Date() : null;
    const cancelledAt = input.status === 'cancelled' ? new Date() : null;
    const refundedAt = input.status === 'refunded' ? new Date() : null;

    const result = await pool.query<PaymentOrderRow>(
      `UPDATE payment_orders
       SET status = $2,
           provider_payment_id = COALESCE($3, provider_payment_id),
           failure_code = $4,
           failure_message = $5,
           paid_at = COALESCE($6, paid_at),
           cancelled_at = COALESCE($7, cancelled_at),
           refunded_at = COALESCE($8, refunded_at),
           updated_at = now()
       WHERE id = $1
       RETURNING ${ORDER_SELECT}`,
      [
        input.orderId,
        input.status,
        input.providerPaymentId ?? null,
        input.failureCode ?? null,
        input.failureMessage ?? null,
        paidAt,
        cancelledAt,
        refundedAt,
      ],
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
    }

    return orderRowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updatePaymentOrderCheckout(
  orderId: string,
  providerOrderId: string,
  checkoutUrl: string | null,
): Promise<PaymentOrderDto> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentOrderRow>(
      `UPDATE payment_orders
       SET provider_order_id = $2,
           checkout_url = $3,
           updated_at = now()
       WHERE id = $1
       RETURNING ${ORDER_SELECT}`,
      [orderId, providerOrderId, checkoutUrl],
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
    }

    return orderRowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listSubscriptionProducts(): Promise<PaymentProductDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentProductRow>(
      `SELECT ${PRODUCT_SELECT}
       FROM payment_products
       WHERE is_active = true AND product_type = 'subscription_plan'
       ORDER BY sort_order ASC, id ASC`,
    );
    return result.rows.map(productRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createBillingSubscription(
  input: CreateBillingSubscriptionInput,
): Promise<BillingSubscriptionDto> {
  try {
    const pool = getDatabasePool();
    const subscriptionId = `sub-${randomUUID()}`;
    const result = await pool.query<BillingSubscriptionRow>(
      `INSERT INTO billing_subscriptions (
         id, gym_id, user_id, product_id, provider, status, billing_cycle,
         price_amount, currency, included_credits_per_period,
         current_period_start, current_period_end
       )
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11)
       RETURNING ${SUBSCRIPTION_SELECT}`,
      [
        subscriptionId,
        input.gymId,
        input.userId,
        input.productId,
        input.provider,
        input.billingCycle,
        input.priceAmount,
        input.currency,
        input.includedCreditsPerPeriod,
        input.currentPeriodStart,
        input.currentPeriodEnd,
      ],
    );
    return subscriptionRowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getBillingSubscription(
  subscriptionId: string,
): Promise<BillingSubscriptionDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<BillingSubscriptionRow>(
      `SELECT ${SUBSCRIPTION_SELECT}
       FROM billing_subscriptions
       WHERE id = $1`,
      [subscriptionId],
    );
    return result.rows[0] ? subscriptionRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getActiveBillingSubscription(
  gymId: string,
): Promise<BillingSubscriptionDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<BillingSubscriptionRow>(
      `SELECT ${SUBSCRIPTION_SELECT}
       FROM billing_subscriptions
       WHERE gym_id = $1
         AND status = 'active'
         AND current_period_end > now()
       ORDER BY current_period_end DESC
       LIMIT 1`,
      [gymId],
    );
    return result.rows[0] ? subscriptionRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listBillingSubscriptions(
  gymId: string,
): Promise<BillingSubscriptionDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<BillingSubscriptionRow>(
      `SELECT ${SUBSCRIPTION_SELECT}
       FROM billing_subscriptions
       WHERE gym_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [gymId],
    );
    return result.rows.map(subscriptionRowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

async function setExistingActiveSubscriptionsCancelledOnClient(
  client: PoolClient,
  gymId: string,
  exceptSubscriptionId: string,
): Promise<void> {
  await client.query(
    `UPDATE billing_subscriptions
     SET status = 'cancelled',
         cancelled_at = now(),
         ended_at = now(),
         updated_at = now()
     WHERE gym_id = $1
       AND status = 'active'
       AND id <> $2`,
    [gymId, exceptSubscriptionId],
  );
}

export interface ActivateBillingSubscriptionInput {
  subscriptionId: string;
  gymId: string;
  actorId: string;
  orderId?: string | null;
}

export async function activateBillingSubscription(
  input: ActivateBillingSubscriptionInput,
): Promise<BillingSubscriptionDto> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const locked = await client.query<BillingSubscriptionRow>(
      `SELECT ${SUBSCRIPTION_SELECT}
       FROM billing_subscriptions
       WHERE id = $1 AND gym_id = $2
       FOR UPDATE`,
      [input.subscriptionId, input.gymId],
    );

    const subscription = locked.rows[0];
    if (!subscription) {
      throw new ApiError(404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
    }

    if (subscription.status === 'active') {
      await client.query('COMMIT');
      return subscriptionRowToDto(subscription);
    }

    if (subscription.status !== 'pending') {
      throw new ApiError(400, 'SUBSCRIPTION_NOT_PENDING', 'Subscription is not pending');
    }

    await setExistingActiveSubscriptionsCancelledOnClient(
      client,
      input.gymId,
      input.subscriptionId,
    );

    const activated = await client.query<BillingSubscriptionRow>(
      `UPDATE billing_subscriptions
       SET status = 'active', updated_at = now()
       WHERE id = $1
       RETURNING ${SUBSCRIPTION_SELECT}`,
      [input.subscriptionId],
    );

    if (subscription.included_credits_per_period > 0) {
      await applyLedgerEntryOnClient(client, {
        gymId: input.gymId,
        entryType: 'grant',
        amount: subscription.included_credits_per_period,
        reason: 'Subscription period credit grant',
        sourceType: 'subscription',
        sourceId: input.subscriptionId,
        idempotencyKey: buildSubscriptionGrantIdempotencyKey(input.subscriptionId),
        createdBy: input.actorId,
      });
    }

    if (input.orderId) {
      await client.query(
        `UPDATE payment_orders
         SET status = 'paid',
             provider_payment_id = COALESCE(provider_payment_id, $2),
             paid_at = COALESCE(paid_at, now()),
             updated_at = now()
         WHERE id = $1 AND status = 'pending'`,
        [input.orderId, `manual-${input.orderId}`],
      );
    }

    await client.query('COMMIT');
    return subscriptionRowToDto(activated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw wrapDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function cancelBillingSubscription(
  subscriptionId: string,
  gymId: string,
): Promise<BillingSubscriptionDto> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<BillingSubscriptionRow>(
      `UPDATE billing_subscriptions
       SET cancel_at_period_end = true, updated_at = now()
       WHERE id = $1 AND gym_id = $2 AND status = 'active'
       RETURNING ${SUBSCRIPTION_SELECT}`,
      [subscriptionId, gymId],
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'SUBSCRIPTION_NOT_FOUND', 'Active subscription not found');
    }

    return subscriptionRowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getPendingOrderForSubscription(
  subscriptionId: string,
): Promise<PaymentOrderDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<PaymentOrderRow>(
      `SELECT ${ORDER_SELECT}
       FROM payment_orders
       WHERE subscription_id = $1 AND order_type = 'subscription_start'
       ORDER BY created_at DESC
       LIMIT 1`,
      [subscriptionId],
    );
    return result.rows[0] ? orderRowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}
