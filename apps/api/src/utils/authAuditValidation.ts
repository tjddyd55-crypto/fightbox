import type { AuthAuditEventType } from '@fightbox/shared';
import type { ListAuthAuditLogsFilters } from '../repositories/authAuditLogRepository.js';
import { ApiError } from './apiError.js';

const VALID_EVENT_TYPES: AuthAuditEventType[] = [
  'login_success',
  'login_failed',
  'login_rate_limited',
];

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  throw new ApiError(400, 'INVALID_QUERY', 'success must be true or false');
}

function parseEventType(value: unknown): AuthAuditEventType | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_QUERY', 'eventType must be a string');
  }
  const normalized = value.trim();
  if (!VALID_EVENT_TYPES.includes(normalized as AuthAuditEventType)) {
    throw new ApiError(400, 'INVALID_QUERY', 'eventType is invalid');
  }
  return normalized as AuthAuditEventType;
}

export function parseListAuthAuditLogsQuery(
  query: Record<string, unknown>,
): ListAuthAuditLogsFilters {
  const filters: ListAuthAuditLogsFilters = {};

  if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
    const raw = typeof query.limit === 'string' ? query.limit : String(query.limit);
    const limit = Number(raw);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new ApiError(400, 'INVALID_QUERY', 'limit must be a positive number');
    }
    filters.limit = limit;
  }

  if (typeof query.loginId === 'string' && query.loginId.trim()) {
    filters.loginId = query.loginId.trim();
  }

  filters.success = parseOptionalBoolean(query.success);
  filters.eventType = parseEventType(query.eventType);

  return filters;
}
