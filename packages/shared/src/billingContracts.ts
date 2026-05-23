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
  createdAt: string;
  updatedAt: string;
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
  paidAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderRequest {
  productId: string;
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

export const BILLING_API_PATHS = {
  myWallet: '/api/billing/wallet',
  ledger: '/api/billing/ledger',
  products: '/api/billing/products',
  orders: '/api/billing/orders',
  createOrder: '/api/billing/orders',
  manualCompleteOrder: '/api/billing/orders/:id/manual-complete',
  adminAdjustCredits: '/api/admin/billing/credits/adjust',
  adminWallets: '/api/admin/billing/wallets',
} as const;
