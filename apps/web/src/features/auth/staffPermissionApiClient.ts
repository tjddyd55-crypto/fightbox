import {
  STAFF_PERMISSION_API_PATHS,
  type FightboxSessionUser,
  type FightboxStaffPermissions,
  type GymStaffPermissionDto,
  type GymStaffPermissionItemResponse,
  type GymStaffPermissionListResponse,
  type MyStaffPermissionsResponse,
  type UpdateGymStaffPermissionsRequest,
} from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';

export class StaffPermissionApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'StaffPermissionApiError';
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

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

function getHeadersForUser(user: FightboxSessionUser): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getFightboxContextHeadersForUser(user),
  };
}

async function parseApiError(response: Response): Promise<StaffPermissionApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new StaffPermissionApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new StaffPermissionApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

async function requestJson<T>(
  path: string,
  user: FightboxSessionUser,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...getHeadersForUser(user),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}

export async function listStaffPermissions(
  user: FightboxSessionUser,
): Promise<GymStaffPermissionDto[]> {
  const body = await requestJson<GymStaffPermissionListResponse>(
    STAFF_PERMISSION_API_PATHS.staffPermissions,
    user,
  );
  return body.data;
}

export async function updateStaffPermissions(
  user: FightboxSessionUser,
  targetUserId: string,
  permissions: UpdateGymStaffPermissionsRequest['permissions'],
): Promise<GymStaffPermissionDto> {
  const body = await requestJson<GymStaffPermissionItemResponse>(
    `${STAFF_PERMISSION_API_PATHS.staffPermissions}/${encodeURIComponent(targetUserId)}`,
    user,
    {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    },
  );
  return body.data;
}

export async function getMyStaffPermissions(
  user: FightboxSessionUser,
): Promise<{ row: GymStaffPermissionDto | null; permissions: FightboxStaffPermissions }> {
  const body = await requestJson<MyStaffPermissionsResponse>(
    STAFF_PERMISSION_API_PATHS.staffPermissionsMe,
    user,
  );
  return { row: body.data, permissions: body.permissions };
}
