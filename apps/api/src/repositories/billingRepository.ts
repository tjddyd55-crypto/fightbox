import { randomUUID } from 'node:crypto';
import type {
  CreditLedgerEntryDto,
  CreditLedgerEntryType,
  CreditWalletDto,
  PaymentOrderDto,
  PaymentOrderStatus,
  PaymentProductDto,
} from '@fightbox/shared';
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
  paid_at: Date | null;
  cancelled_at: Date | null;
  refunded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

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
    paidAt: row.paid_at?.toISOString() ?? null,
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    refundedAt: row.refunded_at?.toISOString() ?? null,
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
      `SELECT id, name, description, credits, price_amount, currency, is_active, sort_order,
              created_at, updated_at
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
      `SELECT id, name, description, credits, price_amount, currency, is_active, sort_order,
              created_at, updated_at
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
         credits, amount, currency, checkout_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10)
       RETURNING id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
                 status, credits, amount, currency, checkout_url, failure_code, failure_message,
                 paid_at, cancelled_at, refunded_at, created_at, updated_at`,
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
      `SELECT id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
              status, credits, amount, currency, checkout_url, failure_code, failure_message,
              paid_at, cancelled_at, refunded_at, created_at, updated_at
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
      `SELECT id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
              status, credits, amount, currency, checkout_url, failure_code, failure_message,
              paid_at, cancelled_at, refunded_at, created_at, updated_at
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
       RETURNING id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
                 status, credits, amount, currency, checkout_url, failure_code, failure_message,
                 paid_at, cancelled_at, refunded_at, created_at, updated_at`,
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
       RETURNING id, gym_id, user_id, product_id, provider, provider_order_id, provider_payment_id,
                 status, credits, amount, currency, checkout_url, failure_code, failure_message,
                 paid_at, cancelled_at, refunded_at, created_at, updated_at`,
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
