import type { CreateGymRequest, GymDto, GymStatus, UpdateGymRequest } from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

interface GymRow {
  id: string;
  gym_code: string;
  name: string;
  owner_name: string;
  phone: string;
  address: string;
  memo: string;
  status: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const GYM_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
const VALID_STATUSES: GymStatus[] = ['active', 'suspended', 'archived'];

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return new ApiError(409, 'DUPLICATE_GYM_CODE', 'Gym code already exists');
    }
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

export function normalizeGymCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateGymCode(gymCode: string): void {
  if (!GYM_CODE_PATTERN.test(gymCode)) {
    throw new ApiError(
      400,
      'INVALID_GYM_CODE',
      'Gym code must be 3-32 characters (A-Z, 0-9, -, _)',
    );
  }
}

function assertGymStatus(status: string): asserts status is GymStatus {
  if (!VALID_STATUSES.includes(status as GymStatus)) {
    throw new ApiError(400, 'INVALID_GYM_STATUS', `Invalid gym status: ${status}`);
  }
}

function rowToDto(row: GymRow): GymDto {
  return {
    id: row.id,
    gymCode: row.gym_code,
    name: row.name,
    ownerName: row.owner_name,
    phone: row.phone,
    address: row.address,
    memo: row.memo,
    status: row.status as GymStatus,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function generateGymId(gymCode: string): string {
  return `gym-${gymCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export async function listGyms(): Promise<GymDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymRow>(
      `SELECT id, gym_code, name, owner_name, phone, address, memo, status, created_by, created_at, updated_at
       FROM gyms
       WHERE deleted_at IS NULL
       ORDER BY gym_code ASC`,
    );
    return result.rows.map(rowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getGymById(id: string): Promise<GymDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymRow>(
      `SELECT id, gym_code, name, owner_name, phone, address, memo, status, created_by, created_at, updated_at
       FROM gyms
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    const row = result.rows[0];
    return row ? rowToDto(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createGym(
  input: CreateGymRequest,
  createdBy: string,
): Promise<GymDto> {
  const gymCode = normalizeGymCode(input.gymCode);
  validateGymCode(gymCode);

  const name = input.name.trim();
  if (!name) {
    throw new ApiError(400, 'INVALID_NAME', 'Gym name is required');
  }

  const status = input.status ?? 'active';
  assertGymStatus(status);

  const id = generateGymId(gymCode);

  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymRow>(
      `INSERT INTO gyms (
         id, gym_code, name, owner_name, phone, address, memo, status, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, gym_code, name, owner_name, phone, address, memo, status, created_by, created_at, updated_at`,
      [
        id,
        gymCode,
        name,
        input.ownerName?.trim() ?? '',
        input.phone?.trim() ?? '',
        input.address?.trim() ?? '',
        input.memo?.trim() ?? '',
        status,
        createdBy,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to create gym');
    }
    return rowToDto(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateGym(id: string, input: UpdateGymRequest): Promise<GymDto | null> {
  const existing = await getGymById(id);
  if (!existing) {
    return null;
  }

  const gymCode = input.gymCode !== undefined ? normalizeGymCode(input.gymCode) : existing.gymCode;
  if (input.gymCode !== undefined) {
    validateGymCode(gymCode);
  }

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  if (!name) {
    throw new ApiError(400, 'INVALID_NAME', 'Gym name is required');
  }

  const status = input.status ?? existing.status;
  assertGymStatus(status);

  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymRow>(
      `UPDATE gyms
       SET gym_code = $2,
           name = $3,
           owner_name = $4,
           phone = $5,
           address = $6,
           memo = $7,
           status = $8,
           updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, gym_code, name, owner_name, phone, address, memo, status, created_by, created_at, updated_at`,
      [
        id,
        gymCode,
        name,
        input.ownerName !== undefined ? input.ownerName.trim() : existing.ownerName,
        input.phone !== undefined ? input.phone.trim() : existing.phone,
        input.address !== undefined ? input.address.trim() : existing.address,
        input.memo !== undefined ? input.memo.trim() : existing.memo,
        status,
      ],
    );
    const row = result.rows[0];
    return row ? rowToDto(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function softDeleteGym(id: string): Promise<boolean> {
  if (id === 'demo-gym') {
    throw new ApiError(400, 'PROTECTED_GYM', 'Demo gym cannot be deleted');
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query(
      `UPDATE gyms
       SET deleted_at = now(), updated_at = now(), status = 'archived'
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}
