import type {
  CreditLedgerEntryDto,
  CreditWalletDto,
  FightboxRequestContext,
  ManualCreditAdjustmentRequest,
  PaymentOrderDto,
  PaymentProductDto,
} from '@fightbox/shared';
import {
  CREDIT_USAGE_COSTS,
  buildProgramPublishIdempotencyKey,
  canManageBilling,
  canPurchaseCredits,
} from '@fightbox/shared';
import { getPaymentConfig, isManualPaymentProvider } from '../config/paymentConfig.js';
import {
  createLedgerEntryWithWalletUpdate,
  createPaymentOrder,
  getCreditWallet,
  getOrCreateCreditWallet,
  getPaymentOrder,
  getPaymentProduct,
  listCreditLedgerEntries,
  listCreditWallets,
  listPaymentOrders,
  listPaymentProducts,
  spendCredits,
  updatePaymentOrderCheckout,
  updatePaymentOrderStatus,
} from '../repositories/billingRepository.js';
import type { PoolClient } from 'pg';
import { getPaymentProvider } from '../services/manualPaymentProvider.js';
import { ApiError } from '../utils/apiError.js';

export interface BillingSummary {
  wallet: CreditWalletDto;
  ledger: CreditLedgerEntryDto[];
  orders: PaymentOrderDto[];
  products: PaymentProductDto[];
}

function assertGymAccess(context: FightboxRequestContext, gymId: string): void {
  if (context.role === 'super_admin') {
    return;
  }
  if (context.gymId !== gymId) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot access another gym billing data');
  }
}

function resolveBillingGymId(context: FightboxRequestContext): string {
  if (!context.gymId?.trim()) {
    throw new ApiError(400, 'GYM_ID_REQUIRED', 'gymId is required for billing');
  }
  return context.gymId;
}

export async function getMyBillingSummary(
  context: FightboxRequestContext,
): Promise<BillingSummary> {
  const gymId = resolveBillingGymId(context);
  const [wallet, ledger, orders, products] = await Promise.all([
    getOrCreateCreditWallet(gymId),
    listCreditLedgerEntries(gymId),
    listPaymentOrders(gymId),
    listPaymentProducts(),
  ]);

  return { wallet, ledger, orders, products };
}

export async function getMyWallet(context: FightboxRequestContext): Promise<CreditWalletDto> {
  const gymId = resolveBillingGymId(context);
  return getOrCreateCreditWallet(gymId);
}

export async function listMyLedger(
  context: FightboxRequestContext,
): Promise<CreditLedgerEntryDto[]> {
  const gymId = resolveBillingGymId(context);
  return listCreditLedgerEntries(gymId);
}

export async function listActiveProducts(): Promise<PaymentProductDto[]> {
  return listPaymentProducts();
}

export async function listMyPaymentOrders(
  context: FightboxRequestContext,
): Promise<PaymentOrderDto[]> {
  const gymId = resolveBillingGymId(context);
  return listPaymentOrders(gymId);
}

export async function createPaymentOrderForProduct(
  context: FightboxRequestContext,
  productId: string,
): Promise<{ order: PaymentOrderDto; checkoutUrl: string | null }> {
  if (!canPurchaseCredits(context)) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot purchase credits');
  }

  const product = await getPaymentProduct(productId);
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Payment product not found');
  }
  if (!product.isActive) {
    throw new ApiError(400, 'PRODUCT_INACTIVE', 'Payment product is not active');
  }

  const gymId = resolveBillingGymId(context);
  const paymentConfig = getPaymentConfig();
  const provider = getPaymentProvider();

  const order = await createPaymentOrder({
    gymId,
    userId: context.userId,
    productId: product.id,
    provider: paymentConfig.provider,
    credits: product.credits,
    amount: product.priceAmount,
    currency: product.currency,
  });

  const checkout = await provider.createCheckout({
    orderId: order.id,
    productName: product.name,
    amount: product.priceAmount,
    currency: product.currency,
    credits: product.credits,
    successUrl: `${paymentConfig.frontendPublicUrl}/dashboard/billing?orderId=${encodeURIComponent(order.id)}&status=success`,
    failUrl: `${paymentConfig.frontendPublicUrl}/dashboard/billing?orderId=${encodeURIComponent(order.id)}&status=failed`,
  });

  const updatedOrder = await updatePaymentOrderCheckout(
    order.id,
    checkout.providerOrderId,
    checkout.checkoutUrl,
  );

  return {
    order: updatedOrder,
    checkoutUrl: checkout.checkoutUrl,
  };
}

export async function completeManualPaymentOrder(
  context: FightboxRequestContext,
  orderId: string,
): Promise<PaymentOrderDto> {
  const order = await getPaymentOrder(orderId);
  if (!order) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
  }

  assertGymAccess(context, order.gymId);

  const isSuperAdmin = context.role === 'super_admin';
  const isGymAdminOwnOrder =
    context.role === 'gym_admin' &&
    isManualPaymentProvider() &&
    order.gymId === context.gymId;

  if (!isSuperAdmin && !isGymAdminOwnOrder) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot complete this payment order');
  }

  if (order.status === 'paid') {
    return order;
  }

  if (order.status !== 'pending') {
    throw new ApiError(400, 'ORDER_NOT_PENDING', 'Payment order is not pending');
  }

  await createLedgerEntryWithWalletUpdate({
    gymId: order.gymId,
    entryType: 'purchase',
    amount: order.credits,
    reason: `크레딧 충전 (${order.productId})`,
    sourceType: 'payment_order',
    sourceId: order.id,
    idempotencyKey: `payment_order:${order.id}:paid`,
    createdBy: context.userId,
  });

  return updatePaymentOrderStatus({
    orderId: order.id,
    status: 'paid',
    providerPaymentId: `manual-${order.id}`,
  });
}

export async function adjustCreditsByAdmin(
  context: FightboxRequestContext,
  input: ManualCreditAdjustmentRequest,
): Promise<{ wallet: CreditWalletDto; ledgerEntry: CreditLedgerEntryDto }> {
  if (!canManageBilling(context)) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot adjust credits');
  }

  const gymId = input.gymId.trim();
  if (!gymId) {
    throw new ApiError(400, 'INVALID_GYM_ID', 'gymId is required');
  }

  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new ApiError(400, 'INVALID_AMOUNT', 'amount must be a non-zero integer');
  }

  const reason = input.reason.trim();
  if (!reason) {
    throw new ApiError(400, 'REASON_REQUIRED', 'reason is required');
  }

  const entryType = input.amount > 0 ? 'grant' : 'adjustment';
  const idempotencyKey = `admin_manual:${gymId}:${Date.now()}:${context.userId}`;

  const ledgerEntry = await createLedgerEntryWithWalletUpdate({
    gymId,
    entryType,
    amount: input.amount,
    reason,
    sourceType: 'admin_manual',
    sourceId: context.userId,
    idempotencyKey,
    createdBy: context.userId,
  });

  const wallet = await getCreditWallet(gymId);
  if (!wallet) {
    throw new ApiError(500, 'WALLET_NOT_FOUND', 'Wallet not found after adjustment');
  }

  return { wallet, ledgerEntry };
}

export async function listAllWallets(
  context: FightboxRequestContext,
): Promise<CreditWalletDto[]> {
  if (!canManageBilling(context)) {
    throw new ApiError(403, 'FORBIDDEN', 'Cannot list wallets');
  }
  return listCreditWallets();
}

export async function spendCreditsForProgramPublish(
  gymId: string,
  templateId: string,
  actorId: string,
  client?: PoolClient,
): Promise<CreditLedgerEntryDto> {
  return spendCredits(
    {
      gymId,
      amount: CREDIT_USAGE_COSTS.programPublish,
      sourceType: 'program_publish',
      sourceId: templateId,
      reason: 'Program template publish',
      idempotencyKey: buildProgramPublishIdempotencyKey(templateId),
      createdBy: actorId,
    },
    client,
  );
}
