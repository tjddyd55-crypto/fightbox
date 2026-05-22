import {
  AUTH_AUDIT_API_PATHS,
  type AuthAuditEventType,
  type AuthAuditLogDto,
  type FightboxSessionUser,
  type ListAuthAuditLogsResponse,
} from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';

export class AuthAuditApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthAuditApiError';
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

export interface ListAuthAuditLogsFilters {
  limit?: number;
  loginId?: string;
  success?: boolean;
  eventType?: AuthAuditEventType;
}

function buildUrl(path: string, query?: URLSearchParams): string {
  const base = getApiBaseUrl();
  const suffix = query?.toString() ? `?${query.toString()}` : '';
  return base ? `${base}${path}${suffix}` : `${path}${suffix}`;
}

function getHeadersForUser(user: FightboxSessionUser): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getFightboxContextHeadersForUser(user),
  };
}

async function parseApiError(response: Response): Promise<AuthAuditApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new AuthAuditApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new AuthAuditApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

export async function listAuthAuditLogs(
  user: FightboxSessionUser,
  filters: ListAuthAuditLogsFilters = {},
): Promise<AuthAuditLogDto[]> {
  const query = new URLSearchParams();
  if (filters.limit !== undefined) {
    query.set('limit', String(filters.limit));
  }
  if (filters.loginId?.trim()) {
    query.set('loginId', filters.loginId.trim());
  }
  if (filters.success !== undefined) {
    query.set('success', String(filters.success));
  }
  if (filters.eventType) {
    query.set('eventType', filters.eventType);
  }

  const response = await fetch(buildUrl(AUTH_AUDIT_API_PATHS.logs, query), {
    headers: getHeadersForUser(user),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const payload = (await response.json()) as ListAuthAuditLogsResponse;
  return payload.data;
}
