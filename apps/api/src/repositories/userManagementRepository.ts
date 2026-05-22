import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type {
  CreateManagedUserRequest,
  FightboxRequestContext,
  FightboxUserRole,
  ManagedUserDto,
  ManagedUserStatus,
  UpdateManagedUserRequest,
} from '@fightbox/shared';
import {
  canManageUserRole,
  inferAccountScopeFromRole,
  isFightboxUserRole,
} from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { upsertGymStaffPermission } from './gymStaffPermissionRepository.js';
import { ApiError } from '../utils/apiError.js';

const BCRYPT_ROUNDS = 12;

interface ManagedUserRow {
  id: string;
  login_id: string;
  display_name: string;
  role: string;
  gym_id: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

const MANAGED_USER_SELECT = `
  SELECT
    u.id,
    u.login_id,
    u.display_name,
    u.role,
    u.gym_id,
    u.status,
    u.created_at,
    u.updated_at,
    u.last_login_at
  FROM users u
`;

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return new ApiError(409, 'LOGIN_ID_EXISTS', 'loginId is already in use');
  }
  if (error instanceof Error) {
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

function mapDbStatus(status: string): ManagedUserStatus {
  return status === 'active' ? 'active' : 'disabled';
}

function mapStatusToDb(status: ManagedUserStatus): string {
  return status === 'active' ? 'active' : 'disabled';
}

function rowToDto(row: ManagedUserRow): ManagedUserDto {
  if (!isFightboxUserRole(row.role)) {
    throw new ApiError(500, 'INVALID_USER_ROLE', `Invalid user role in database: ${row.role}`);
  }

  return {
    id: row.id,
    loginId: row.login_id,
    gymId: row.gym_id ?? '',
    role: row.role,
    displayName: row.display_name,
    status: mapDbStatus(row.status),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
  };
}

function assertManagerCanAccessTarget(
  context: FightboxRequestContext,
  target: { role: FightboxUserRole; gymId: string | null },
): void {
  if (!canManageUserRole(context.role, target.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot manage this user role');
  }

  if (context.role === 'gym_admin') {
    const targetGymId = target.gymId?.trim();
    if (!targetGymId || targetGymId !== context.gymId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only manage users in your gym');
    }
  }
}

function assertManagerCanAssignRole(context: FightboxRequestContext, role: FightboxUserRole): void {
  if (!canManageUserRole(context.role, role)) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot create or assign this role');
  }
}

function resolveGymIdForCreate(
  context: FightboxRequestContext,
  input: CreateManagedUserRequest,
): string | null {
  if (context.role === 'gym_admin') {
    return context.gymId;
  }

  const gymId = input.gymId?.trim() || 'demo-gym';
  return gymId;
}

async function fetchManagedUserRow(userId: string): Promise<ManagedUserRow | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ManagedUserRow>(
    `${MANAGED_USER_SELECT} WHERE u.id = $1 LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function countActiveSuperAdmins(excludeUserId?: string): Promise<number> {
  const pool = getDatabasePool();
  const result = excludeUserId
    ? await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users
         WHERE role = 'super_admin' AND status = 'active' AND id <> $1`,
        [excludeUserId],
      )
    : await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users
         WHERE role = 'super_admin' AND status = 'active'`,
      );
  return Number(result.rows[0]?.count ?? 0);
}

async function syncStaffPermissions(
  gymId: string,
  userId: string,
  loginId: string,
  displayName: string,
  permissions: CreateManagedUserRequest['staffPermissions'] | UpdateManagedUserRequest['staffPermissions'],
): Promise<void> {
  if (!permissions) {
    return;
  }
  await upsertGymStaffPermission({
    gymId,
    userId,
    loginId,
    displayName,
    permissions,
  });
}

export async function listManagedUsers(
  context: FightboxRequestContext,
  filters: { gymId?: string; role?: FightboxUserRole; status?: ManagedUserStatus },
): Promise<ManagedUserDto[]> {
  try {
    const pool = getDatabasePool();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (context.role === 'gym_admin') {
      params.push(context.gymId);
      conditions.push(`u.gym_id = $${params.length}`);
      params.push(['gym_staff', 'video_creator']);
      conditions.push(`u.role = ANY($${params.length}::text[])`);
    } else if (filters.gymId) {
      params.push(filters.gymId);
      conditions.push(`u.gym_id = $${params.length}`);
    }

    if (filters.role) {
      if (context.role === 'gym_admin' && !canManageUserRole('gym_admin', filters.role)) {
        throw new ApiError(403, 'FORBIDDEN', 'You cannot filter by this role');
      }
      params.push(filters.role);
      conditions.push(`u.role = $${params.length}`);
    }

    if (filters.status) {
      params.push(mapStatusToDb(filters.status));
      conditions.push(`u.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query<ManagedUserRow>(
      `${MANAGED_USER_SELECT} ${whereClause} ORDER BY u.display_name ASC, u.login_id ASC`,
      params,
    );

    return result.rows.map(rowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function findManagedUserById(
  userId: string,
  context: FightboxRequestContext,
): Promise<ManagedUserDto | null> {
  try {
    const row = await fetchManagedUserRow(userId);
    if (!row) {
      return null;
    }

    if (!isFightboxUserRole(row.role)) {
      throw new ApiError(500, 'INVALID_USER_ROLE', `Invalid user role: ${row.role}`);
    }

    assertManagerCanAccessTarget(context, { role: row.role, gymId: row.gym_id });
    return rowToDto(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createManagedUser(
  input: CreateManagedUserRequest,
  context: FightboxRequestContext,
): Promise<ManagedUserDto> {
  assertManagerCanAssignRole(context, input.role);

  const gymId = resolveGymIdForCreate(context, input);
  const accountScope = inferAccountScopeFromRole(input.role);
  const userId = `user-${randomUUID()}`;
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const creatorId = input.role === 'video_creator' ? userId : null;
  const dbGymId = input.role === 'video_creator' && context.role === 'super_admin' && !input.gymId?.trim()
    ? null
    : gymId;

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ManagedUserRow>(
      `INSERT INTO users (
         id, login_id, password_hash, display_name, role, account_scope, gym_id, creator_id, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING
         id, login_id, display_name, role, gym_id, status, created_at, updated_at, last_login_at`,
      [
        userId,
        input.loginId.trim(),
        passwordHash,
        input.displayName.trim(),
        input.role,
        accountScope,
        dbGymId,
        creatorId,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to create user');
    }

    if (input.role === 'gym_staff' && gymId) {
      await syncStaffPermissions(
        gymId,
        userId,
        input.loginId.trim(),
        input.displayName.trim(),
        input.staffPermissions,
      );
    }

    return rowToDto(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateManagedUser(
  userId: string,
  input: UpdateManagedUserRequest,
  context: FightboxRequestContext,
): Promise<ManagedUserDto> {
  const existing = await fetchManagedUserRow(userId);
  if (!existing) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (!isFightboxUserRole(existing.role)) {
    throw new ApiError(500, 'INVALID_USER_ROLE', `Invalid user role: ${existing.role}`);
  }

  assertManagerCanAccessTarget(context, { role: existing.role, gymId: existing.gym_id });

  const nextRole = input.role ?? existing.role;
  if (input.role) {
    assertManagerCanAssignRole(context, input.role);
  }

  if (input.status === 'disabled' && userId === context.userId) {
    throw new ApiError(400, 'CANNOT_DISABLE_SELF', 'You cannot disable your own account');
  }

  if (
    input.status === 'disabled' &&
    existing.role === 'super_admin' &&
    existing.status === 'active'
  ) {
    const remaining = await countActiveSuperAdmins(userId);
    if (remaining === 0) {
      throw new ApiError(400, 'LAST_SUPER_ADMIN', 'Cannot disable the last active super admin');
    }
  }

  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.displayName !== undefined) {
    params.push(input.displayName.trim());
    sets.push(`display_name = $${params.length}`);
  }

  if (input.role !== undefined) {
    params.push(input.role);
    sets.push(`role = $${params.length}`);
    params.push(inferAccountScopeFromRole(input.role));
    sets.push(`account_scope = $${params.length}`);
    if (input.role === 'video_creator') {
      params.push(userId);
      sets.push(`creator_id = $${params.length}`);
    } else {
      sets.push('creator_id = NULL');
    }
  }

  if (input.status !== undefined) {
    params.push(mapStatusToDb(input.status));
    sets.push(`status = $${params.length}`);
  }

  if (input.password) {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    params.push(passwordHash);
    sets.push(`password_hash = $${params.length}`);
  }

  if (sets.length === 0 && input.staffPermissions === undefined) {
    throw new ApiError(400, 'INVALID_BODY', 'No changes to apply');
  }

  try {
    const pool = getDatabasePool();
    let row: ManagedUserRow | undefined;

    if (sets.length > 0) {
      sets.push('updated_at = now()');
      params.push(userId);
      const result = await pool.query<ManagedUserRow>(
        `UPDATE users SET ${sets.join(', ')}
         WHERE id = $${params.length}
         RETURNING id, login_id, display_name, role, gym_id, status, created_at, updated_at, last_login_at`,
        params,
      );
      row = result.rows[0];
    } else {
      row = existing;
    }

    if (!row) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const effectiveGymId = row.gym_id ?? context.gymId;
    if (nextRole === 'gym_staff' && effectiveGymId && input.staffPermissions !== undefined) {
      await syncStaffPermissions(
        effectiveGymId,
        userId,
        row.login_id,
        input.displayName?.trim() ?? row.display_name,
        input.staffPermissions,
      );
    }

    return rowToDto(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function disableManagedUser(
  userId: string,
  context: FightboxRequestContext,
): Promise<ManagedUserDto> {
  return updateManagedUser(userId, { status: 'disabled' }, context);
}
