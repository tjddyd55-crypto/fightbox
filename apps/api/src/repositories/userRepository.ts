import type { AuthUserDto, FightboxUserRole } from '@fightbox/shared';
import { isFightboxAccountScope, isFightboxUserRole } from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

interface UserRow {
  id: string;
  login_id: string;
  password_hash: string;
  display_name: string;
  role: string;
  account_scope: string;
  status: string;
  gym_id: string | null;
  creator_id: string | null;
  gym_code: string | null;
  gym_name: string | null;
  creator_code: string | null;
  creator_name: string | null;
  last_login_at: Date | null;
}

export interface UserAuthRecord {
  id: string;
  loginId: string;
  passwordHash: string;
  isActive: boolean;
  user: AuthUserDto;
}

const USER_SELECT = `
  SELECT
    u.id,
    u.login_id,
    u.password_hash,
    u.display_name,
    u.role,
    u.account_scope,
    u.status,
    u.gym_id,
    u.creator_id,
    g.gym_code,
    g.name AS gym_name,
    c.creator_code,
    c.display_name AS creator_name
  FROM users u
  LEFT JOIN gyms g ON g.id = u.gym_id AND g.deleted_at IS NULL
  LEFT JOIN creators c ON c.id = u.creator_id AND c.deleted_at IS NULL
`;

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

function rowToAuthUser(row: UserRow): AuthUserDto {
  if (!isFightboxUserRole(row.role)) {
    throw new ApiError(500, 'INVALID_USER_ROLE', `Invalid user role in database: ${row.role}`);
  }
  if (!isFightboxAccountScope(row.account_scope)) {
    throw new ApiError(
      500,
      'INVALID_ACCOUNT_SCOPE',
      `Invalid account scope in database: ${row.account_scope}`,
    );
  }

  const role = row.role as FightboxUserRole;

  return {
    loginId: row.login_id,
    userId: row.id,
    role,
    displayName: row.display_name,
    accountScope: row.account_scope,
    ...(row.gym_id ? { gymId: row.gym_id } : {}),
    ...(row.gym_code ? { gymCode: row.gym_code } : {}),
    ...(row.gym_name ? { gymName: row.gym_name } : {}),
    ...(row.creator_id ? { creatorId: row.creator_id } : {}),
    ...(row.creator_code ? { creatorCode: row.creator_code } : {}),
    ...(row.creator_name ? { creatorName: row.creator_name } : {}),
  };
}

function rowToRecord(row: UserRow): UserAuthRecord {
  return {
    id: row.id,
    loginId: row.login_id,
    passwordHash: row.password_hash,
    isActive: row.status === 'active',
    user: rowToAuthUser(row),
  };
}

export async function updateLastLoginAt(userId: string): Promise<void> {
  try {
    const pool = getDatabasePool();
    await pool.query(
      `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
      [userId],
    );
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function findUserByLoginId(loginId: string): Promise<UserAuthRecord | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<UserRow>(
      `${USER_SELECT}
       WHERE u.login_id = $1
       LIMIT 1`,
      [loginId.trim()],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function findUserById(userId: string): Promise<AuthUserDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<UserRow>(
      `${USER_SELECT}
       WHERE u.id = $1 AND u.status = 'active'
       LIMIT 1`,
      [userId],
    );
    const row = result.rows[0];
    return row ? rowToAuthUser(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}
