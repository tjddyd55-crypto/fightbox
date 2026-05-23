import {
  BILLING_API_PATHS,
  type BillingLedgerResponse,
  type BillingOrdersResponse,
  type BillingProductsResponse,
  type BillingWalletResponse,
  type BillingWalletsResponse,
  type CreatePaymentOrderRequest,
  type CreatePaymentOrderResponse,
  type CreditWalletDto,
  type FightboxSessionUser,
  type ManualCreditAdjustmentRequest,
  type ManualCreditAdjustmentResponse,
  type PaymentOrderDto,
  type CreditLedgerEntryDto,
  type PaymentProductDto,
} from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';

export class BillingApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'BillingApiError';
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

function getHeadersForUser(user: FightboxSessionUser): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getFightboxContextHeadersForUser(user),
  };
}

async function parseApiError(response: Response): Promise<BillingApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new BillingApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new BillingApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

async function requestJson<T>(
  path: string,
  user: FightboxSessionUser,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...getHeadersForUser(user),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}

export async function getMyWallet(user: FightboxSessionUser): Promise<CreditWalletDto> {
  const response = await requestJson<BillingWalletResponse>(BILLING_API_PATHS.myWallet, user);
  return response.data;
}

export async function getMyLedger(user: FightboxSessionUser): Promise<CreditLedgerEntryDto[]> {
  const response = await requestJson<BillingLedgerResponse>(BILLING_API_PATHS.ledger, user);
  return response.data;
}

export async function listPaymentProducts(user: FightboxSessionUser): Promise<PaymentProductDto[]> {
  const response = await requestJson<BillingProductsResponse>(BILLING_API_PATHS.products, user);
  return response.data;
}

export async function createPaymentOrder(
  user: FightboxSessionUser,
  input: CreatePaymentOrderRequest,
): Promise<CreatePaymentOrderResponse['data']> {
  const response = await requestJson<CreatePaymentOrderResponse>(BILLING_API_PATHS.createOrder, user, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function manualCompleteOrder(
  user: FightboxSessionUser,
  orderId: string,
): Promise<PaymentOrderDto> {
  const path = BILLING_API_PATHS.manualCompleteOrder.replace(':id', encodeURIComponent(orderId));
  const response = await requestJson<{ data: PaymentOrderDto }>(path, user, {
    method: 'POST',
  });
  return response.data;
}

export async function listMyPaymentOrders(user: FightboxSessionUser): Promise<PaymentOrderDto[]> {
  const response = await requestJson<BillingOrdersResponse>(BILLING_API_PATHS.orders, user);
  return response.data;
}

export async function adminListWallets(user: FightboxSessionUser): Promise<CreditWalletDto[]> {
  const response = await requestJson<BillingWalletsResponse>(
    BILLING_API_PATHS.adminWallets,
    user,
  );
  return response.data;
}

export async function adminAdjustCredits(
  user: FightboxSessionUser,
  input: ManualCreditAdjustmentRequest,
): Promise<ManualCreditAdjustmentResponse['data']> {
  const response = await requestJson<ManualCreditAdjustmentResponse>(
    BILLING_API_PATHS.adminAdjustCredits,
    user,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
