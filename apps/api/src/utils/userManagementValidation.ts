import type {
  CreateManagedUserRequest,
  FightboxStaffPermissions,
  FightboxUserRole,
  ManagedUserStatus,
  UpdateManagedUserRequest,
} from '@fightbox/shared';
import { isFightboxUserRole, STAFF_PERMISSION_FIELD_KEYS } from '@fightbox/shared';
import { ApiError } from './apiError.js';

const MIN_PASSWORD_LENGTH = 8;
const VALID_STATUSES: ManagedUserStatus[] = ['active', 'disabled'];

function readTrimmedString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseStaffPermissionsPatch(
  raw: unknown,
): Partial<FightboxStaffPermissions> | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ApiError(400, 'INVALID_BODY', 'staffPermissions must be an object');
  }

  const source = raw as Record<string, unknown>;
  const result: Partial<FightboxStaffPermissions> = {};

  for (const key of STAFF_PERMISSION_FIELD_KEYS) {
    const value = source[key];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== 'boolean') {
      throw new ApiError(400, 'INVALID_BODY', `staffPermissions.${key} must be a boolean`);
    }
    result[key] = value;
  }

  return result;
}

function parseRole(raw: unknown, field = 'role'): FightboxUserRole {
  if (typeof raw !== 'string' || !isFightboxUserRole(raw)) {
    throw new ApiError(400, 'INVALID_BODY', `${field} is invalid`);
  }
  return raw;
}

function parseStatus(raw: unknown): ManagedUserStatus {
  if (typeof raw !== 'string' || !VALID_STATUSES.includes(raw as ManagedUserStatus)) {
    throw new ApiError(400, 'INVALID_BODY', 'status must be active or disabled');
  }
  return raw as ManagedUserStatus;
}

function parsePassword(raw: unknown, required: boolean): string | undefined {
  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      throw new ApiError(400, 'INVALID_BODY', 'password is required');
    }
    return undefined;
  }
  if (typeof raw !== 'string') {
    throw new ApiError(400, 'INVALID_BODY', 'password must be a string');
  }
  if (raw.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, 'INVALID_BODY', `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return raw;
}

export function parseCreateManagedUserBody(body: unknown): CreateManagedUserRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;
  const loginId = readTrimmedString(record, 'loginId');
  const displayName = readTrimmedString(record, 'displayName');
  const password = parsePassword(record.password, true);
  const role = parseRole(record.role);
  const gymId = readTrimmedString(record, 'gymId');
  const staffPermissions = parseStaffPermissionsPatch(record.staffPermissions);

  if (!loginId) {
    throw new ApiError(400, 'INVALID_BODY', 'loginId is required');
  }
  if (!displayName) {
    throw new ApiError(400, 'INVALID_BODY', 'displayName is required');
  }

  return {
    loginId,
    password: password!,
    role,
    displayName,
    ...(gymId ? { gymId } : {}),
    ...(staffPermissions ? { staffPermissions } : {}),
  };
}

export function parseUpdateManagedUserBody(body: unknown): UpdateManagedUserRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;
  const result: UpdateManagedUserRequest = {};

  if (record.displayName !== undefined) {
    const displayName = readTrimmedString(record, 'displayName');
    if (!displayName) {
      throw new ApiError(400, 'INVALID_BODY', 'displayName cannot be empty');
    }
    result.displayName = displayName;
  }

  if (record.role !== undefined) {
    result.role = parseRole(record.role);
  }

  if (record.status !== undefined) {
    result.status = parseStatus(record.status);
  }

  if (record.password !== undefined) {
    const password = parsePassword(record.password, false);
    if (password) {
      result.password = password;
    }
  }

  const staffPermissions = parseStaffPermissionsPatch(record.staffPermissions);
  if (staffPermissions !== undefined) {
    result.staffPermissions = staffPermissions;
  }

  if (Object.keys(result).length === 0) {
    throw new ApiError(400, 'INVALID_BODY', 'At least one field must be provided');
  }

  return result;
}

export function parseListManagedUsersQuery(query: Record<string, unknown>): {
  gymId?: string;
  role?: FightboxUserRole;
  status?: ManagedUserStatus;
} {
  const filters: {
    gymId?: string;
    role?: FightboxUserRole;
    status?: ManagedUserStatus;
  } = {};

  const gymId = readTrimmedString(query, 'gymId');
  if (gymId) {
    filters.gymId = gymId;
  }

  const roleRaw = readTrimmedString(query, 'role');
  if (roleRaw) {
    filters.role = parseRole(roleRaw);
  }

  const statusRaw = readTrimmedString(query, 'status');
  if (statusRaw) {
    filters.status = parseStatus(statusRaw);
  }

  return filters;
}
