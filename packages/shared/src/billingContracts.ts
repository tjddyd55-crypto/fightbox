export interface CreditWalletDto {
  id: string;
  gymId: string;
  balance: number;
  lifetimePurchased: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  lifetimeRefunded: number;
  createdAt: string;
  updatedAt: string;
}

export type CreditLedgerEntryType =
  | 'purchase'
  | 'grant'
  | 'spend'
  | 'refund'
  | 'adjustment'
  | 'revoke';

export interface CreditLedgerEntryDto {
  id: string;
  gymId: string;
  walletId: string;
  entryType: CreditLedgerEntryType;
  amount: number;
  balanceAfter: number;
  reason: string;
  sourceType: string;
  sourceId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PaymentProductDto {
  id: string;
  name: string;
  description: string;
  credits: number;
  priceAmount: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  productType: PaymentProductType;
  billingCycle: BillingCycle | null;
  includedCredits: number;
  isSubscription: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentProductType = 'credit_pack' | 'subscription_plan';

export type BillingCycle = 'monthly' | 'yearly';

export type BillingSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type PaymentOrderType =
  | 'credit_purchase'
  | 'subscription_start'
  | 'subscription_renewal';

export interface BillingSubscriptionDto {
  id: string;
  gymId: string;
  userId: string;
  productId: string;
  provider: string;
  providerSubscriptionId: string | null;
  status: BillingSubscriptionStatus;
  billingCycle: BillingCycle;
  priceAmount: number;
  currency: string;
  includedCreditsPerPeriod: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSummaryDto {
  wallet: CreditWalletDto;
  activeSubscription: BillingSubscriptionDto | null;
}

export type PaymentOrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentOrderDto {
  id: string;
  gymId: string;
  userId: string;
  productId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  status: PaymentOrderStatus;
  credits: number;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  subscriptionId: string | null;
  orderType: PaymentOrderType;
  paidAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderRequest {
  productId: string;
}

export interface CreateSubscriptionRequest {
  productId: string;
}

export interface CreateSubscriptionResponse {
  data: {
    subscription: BillingSubscriptionDto;
    order: PaymentOrderDto;
    checkoutUrl: string | null;
  };
}

export interface BillingSummaryResponse {
  data: BillingSummaryDto;
}

export interface BillingSubscriptionsResponse {
  data: BillingSubscriptionDto[];
}

export interface BillingSubscriptionResponse {
  data: BillingSubscriptionDto | null;
}

export interface CompleteSubscriptionResponse {
  data: BillingSubscriptionDto;
}

export interface ManualCreditAdjustmentRequest {
  gymId: string;
  amount: number;
  reason: string;
}

export interface BillingWalletResponse {
  data: CreditWalletDto;
}

export interface BillingLedgerResponse {
  data: CreditLedgerEntryDto[];
}

export interface BillingProductsResponse {
  data: PaymentProductDto[];
}

export interface BillingOrdersResponse {
  data: PaymentOrderDto[];
}

export interface CreatePaymentOrderResponse {
  data: {
    order: PaymentOrderDto;
    checkoutUrl: string | null;
  };
}

export interface BillingWalletsResponse {
  data: CreditWalletDto[];
}

export interface ManualCreditAdjustmentResponse {
  data: {
    wallet: CreditWalletDto;
    ledgerEntry: CreditLedgerEntryDto;
  };
}

export const CREDIT_USAGE_COSTS = {
  programPublish: 1,
} as const;

export type CreditUsageSourceType = 'program_publish';

export function buildProgramPublishIdempotencyKey(templateId: string): string {
  return `program_publish:${templateId}:first_publish`;
}

export function buildSubscriptionGrantIdempotencyKey(subscriptionId: string): string {
  return `subscription:${subscriptionId}:initial-grant`;
}

export const BILLING_API_PATHS = {
  myWallet: '/api/billing/wallet',
  ledger: '/api/billing/ledger',
  products: '/api/billing/products',
  orders: '/api/billing/orders',
  createOrder: '/api/billing/orders',
  manualCompleteOrder: '/api/billing/orders/:id/manual-complete',
  billingSummary: '/api/billing/summary',
  subscriptions: '/api/billing/subscriptions',
  activeSubscription: '/api/billing/subscriptions/active',
  createSubscription: '/api/billing/subscriptions',
  cancelSubscription: '/api/billing/subscriptions/:id/cancel',
  manualCompleteSubscription: '/api/billing/subscriptions/:id/manual-complete',
  adminAdjustCredits: '/api/admin/billing/credits/adjust',
  adminWallets: '/api/admin/billing/wallets',
} as const;
