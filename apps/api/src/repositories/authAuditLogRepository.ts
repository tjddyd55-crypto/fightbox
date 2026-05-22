import { randomUUID } from 'node:crypto';
import type { AuthAuditEventType, AuthAuditLogDto } from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';

export interface CreateAuthAuditLogInput {
  loginId: string;
  userId?: string | null;
  gymId?: string | null;
  role?: string | null;
  eventType: AuthAuditEventType;
  success: boolean;
  failureCode?: string | null;
  ipAddress: string;
  userAgent: string;
}

export interface ListAuthAuditLogsFilters {
  limit?: number;
  loginId?: string;
  success?: boolean;
  eventType?: AuthAuditEventType;
}

interface AuthAuditLogRow {
  id: string;
  login_id: string;
  user_id: string | null;
  gym_id: string | null;
  role: string | null;
  event_type: string;
  success: boolean;
  failure_code: string | null;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function rowToDto(row: AuthAuditLogRow): AuthAuditLogDto {
  return {
    id: row.id,
    loginId: row.login_id,
    userId: row.user_id,
    gymId: row.gym_id,
    role: row.role,
    eventType: row.event_type as AuthAuditEventType,
    success: row.success,
    failureCode: row.failure_code,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createAuthAuditLog(input: CreateAuthAuditLogInput): Promise<boolean> {
  try {
    const pool = getDatabasePool();
    await pool.query(
      `INSERT INTO auth_audit_logs (
        id,
        login_id,
        user_id,
        gym_id,
        role,
        event_type,
        success,
        failure_code,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        randomUUID(),
        input.loginId.trim().toLowerCase(),
        input.userId ?? null,
        input.gymId ?? null,
        input.role ?? null,
        input.eventType,
        input.success,
        input.failureCode ?? null,
        input.ipAddress.trim() || 'unknown',
        input.userAgent,
      ],
    );
    return true;
  } catch {
    console.warn('[fightbox] auth audit log insert failed');
    return false;
  }
}

export async function listAuthAuditLogs(
  filters: ListAuthAuditLogsFilters = {},
): Promise<AuthAuditLogDto[]> {
  const limit = Math.min(
    Math.max(filters.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.loginId?.trim()) {
    conditions.push(`login_id = $${paramIndex++}`);
    params.push(filters.loginId.trim().toLowerCase());
  }

  if (filters.success !== undefined) {
    conditions.push(`success = $${paramIndex++}`);
    params.push(filters.success);
  }

  if (filters.eventType) {
    conditions.push(`event_type = $${paramIndex++}`);
    params.push(filters.eventType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);

  const pool = getDatabasePool();
  const result = await pool.query<AuthAuditLogRow>(
    `SELECT
      id,
      login_id,
      user_id,
      gym_id,
      role,
      event_type,
      success,
      failure_code,
      ip_address,
      user_agent,
      created_at
    FROM auth_audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex}`,
    params,
  );

  return result.rows.map(rowToDto);
}
