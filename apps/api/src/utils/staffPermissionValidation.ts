import {
  DEFAULT_STAFF_PERMISSIONS,
  STAFF_PERMISSION_FIELD_KEYS,
  type FightboxStaffPermissions,
  type UpdateGymStaffPermissionsRequest,
} from '@fightbox/shared';
import { ApiError } from './apiError.js';

export function parseUpdateStaffPermissionsBody(
  body: unknown,
): UpdateGymStaffPermissionsRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }

  const record = body as Record<string, unknown>;
  const permissionsRaw = record.permissions;

  if (!permissionsRaw || typeof permissionsRaw !== 'object' || Array.isArray(permissionsRaw)) {
    throw new ApiError(400, 'INVALID_BODY', 'permissions must be an object');
  }

  const source = permissionsRaw as Record<string, unknown>;
  const permissions: Partial<FightboxStaffPermissions> = {};

  for (const key of Object.keys(source)) {
    if (!STAFF_PERMISSION_FIELD_KEYS.includes(key as (typeof STAFF_PERMISSION_FIELD_KEYS)[number])) {
      throw new ApiError(400, 'INVALID_PERMISSION_KEY', `Unknown permission key: ${key}`);
    }
    const value = source[key];
    if (typeof value !== 'boolean') {
      throw new ApiError(400, 'INVALID_PERMISSION_VALUE', `${key} must be a boolean`);
    }
    permissions[key as keyof FightboxStaffPermissions] = value;
  }

  if (Object.keys(permissions).length === 0) {
    throw new ApiError(400, 'INVALID_BODY', 'At least one permission field is required');
  }

  return { permissions };
}

export function resolveEffectiveStaffPermissions(
  rowPermissions: FightboxStaffPermissions | null,
  headerPermissions?: Partial<FightboxStaffPermissions>,
): FightboxStaffPermissions {
  if (rowPermissions) {
    return rowPermissions;
  }
  return {
    ...DEFAULT_STAFF_PERMISSIONS,
    ...headerPermissions,
  };
}
