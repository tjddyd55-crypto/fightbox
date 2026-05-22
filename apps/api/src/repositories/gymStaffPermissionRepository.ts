import type {
  FightboxStaffPermissions,
  GymStaffPermissionDto,
} from '@fightbox/shared';
import { DEFAULT_STAFF_PERMISSIONS } from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

interface GymStaffPermissionRow {
  id: string;
  gym_id: string;
  user_id: string;
  display_name: string;
  login_id: string;
  can_upload_videos: boolean;
  can_manage_videos: boolean;
  can_create_templates: boolean;
  can_edit_templates: boolean;
  can_delete_templates: boolean;
  can_submit_public_templates: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertGymStaffPermissionInput {
  gymId: string;
  userId: string;
  loginId: string;
  displayName: string;
  permissions: Partial<FightboxStaffPermissions>;
}

function rowToPermissions(row: GymStaffPermissionRow): FightboxStaffPermissions {
  return {
    canUploadVideos: row.can_upload_videos,
    canManageVideos: row.can_manage_videos,
    canCreateTemplates: row.can_create_templates,
    canEditTemplates: row.can_edit_templates,
    canDeleteTemplates: row.can_delete_templates,
    canSubmitPublicTemplates: row.can_submit_public_templates,
  };
}

function rowToDto(row: GymStaffPermissionRow): GymStaffPermissionDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    userId: row.user_id,
    loginId: row.login_id,
    displayName: row.display_name,
    permissions: rowToPermissions(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

function mergePermissions(
  current: FightboxStaffPermissions,
  patch: Partial<FightboxStaffPermissions>,
): FightboxStaffPermissions {
  return { ...current, ...patch };
}

export async function listGymStaffPermissions(gymId: string): Promise<GymStaffPermissionDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymStaffPermissionRow>(
      `SELECT *
       FROM gym_staff_permissions
       WHERE gym_id = $1
       ORDER BY display_name ASC, login_id ASC`,
      [gymId],
    );
    return result.rows.map(rowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getGymStaffPermission(
  gymId: string,
  userId: string,
): Promise<GymStaffPermissionDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<GymStaffPermissionRow>(
      `SELECT *
       FROM gym_staff_permissions
       WHERE gym_id = $1 AND user_id = $2
       LIMIT 1`,
      [gymId, userId],
    );
    const row = result.rows[0];
    return row ? rowToDto(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function upsertGymStaffPermission(
  input: UpsertGymStaffPermissionInput,
): Promise<GymStaffPermissionDto> {
  const permissions = mergePermissions(DEFAULT_STAFF_PERMISSIONS, input.permissions);

  try {
    const pool = getDatabasePool();
    const id = `gsp-${input.gymId}-${input.userId}`.replace(/[^a-zA-Z0-9-_]/g, '-');
    const result = await pool.query<GymStaffPermissionRow>(
      `INSERT INTO gym_staff_permissions (
         id, gym_id, user_id, display_name, login_id,
         can_upload_videos, can_manage_videos, can_create_templates,
         can_edit_templates, can_delete_templates, can_submit_public_templates
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (gym_id, user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         login_id = EXCLUDED.login_id,
         can_upload_videos = EXCLUDED.can_upload_videos,
         can_manage_videos = EXCLUDED.can_manage_videos,
         can_create_templates = EXCLUDED.can_create_templates,
         can_edit_templates = EXCLUDED.can_edit_templates,
         can_delete_templates = EXCLUDED.can_delete_templates,
         can_submit_public_templates = EXCLUDED.can_submit_public_templates,
         updated_at = now()
       RETURNING *`,
      [
        id,
        input.gymId,
        input.userId,
        input.displayName,
        input.loginId,
        permissions.canUploadVideos,
        permissions.canManageVideos,
        permissions.canCreateTemplates,
        permissions.canEditTemplates,
        permissions.canDeleteTemplates,
        permissions.canSubmitPublicTemplates,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to upsert gym staff permission');
    }
    return rowToDto(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateGymStaffPermissions(
  gymId: string,
  userId: string,
  permissions: Partial<FightboxStaffPermissions>,
  fallback: { loginId: string; displayName: string },
): Promise<GymStaffPermissionDto> {
  const existing = await getGymStaffPermission(gymId, userId);
  if (existing) {
    const merged = mergePermissions(existing.permissions, permissions);
    return upsertGymStaffPermission({
      gymId,
      userId,
      loginId: existing.loginId,
      displayName: existing.displayName,
      permissions: merged,
    });
  }

  return upsertGymStaffPermission({
    gymId,
    userId,
    loginId: fallback.loginId,
    displayName: fallback.displayName,
    permissions,
  });
}
