import type { CreatePaymentOrderRequest, CreateSubscriptionRequest, ManualCreditAdjustmentRequest } from '@fightbox/shared';
import { ApiError } from './apiError.js';

function readStringField(body: unknown, field: string): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }
  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be a string`);
  }
  return value.trim();
}

function readNumberField(body: unknown, field: string): number {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }
  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be an integer`);
  }
  return value;
}

export function parseCreatePaymentOrderBody(body: unknown): CreatePaymentOrderRequest {
  const productId = readStringField(body, 'productId');
  if (!productId) {
    throw new ApiError(400, 'INVALID_PRODUCT_ID', 'productId is required');
  }
  return { productId };
}

export function parseCreateSubscriptionBody(body: unknown): CreateSubscriptionRequest {
  return parseCreatePaymentOrderBody(body);
}

export function parseManualCreditAdjustmentBody(body: unknown): ManualCreditAdjustmentRequest {
  const gymId = readStringField(body, 'gymId');
  const amount = readNumberField(body, 'amount');
  const reason = readStringField(body, 'reason');

  if (!gymId) {
    throw new ApiError(400, 'INVALID_GYM_ID', 'gymId is required');
  }
  if (!reason) {
    throw new ApiError(400, 'REASON_REQUIRED', 'reason is required');
  }

  return { gymId, amount, reason };
}
