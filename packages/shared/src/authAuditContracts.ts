export type AuthAuditEventType =
  | 'login_success'
  | 'login_failed'
  | 'login_rate_limited';

export interface AuthAuditLogDto {
  id: string;
  loginId: string;
  userId: string | null;
  gymId: string | null;
  role: string | null;
  eventType: AuthAuditEventType;
  success: boolean;
  failureCode: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface ListAuthAuditLogsResponse {
  data: AuthAuditLogDto[];
}

export const AUTH_AUDIT_API_PATHS = {
  logs: '/api/admin/auth-audit-logs',
} as const;
