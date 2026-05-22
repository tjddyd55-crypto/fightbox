import {
  USER_MANAGEMENT_API_PATHS,
  type CreateManagedUserRequest,
  type FightboxSessionUser,
  type ManagedUserDto,
  type ManagedUserItemResponse,
  type ManagedUserListResponse,
  type UpdateManagedUserRequest,
} from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';

export class UserManagementApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'UserManagementApiError';
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

async function parseApiError(response: Response): Promise<UserManagementApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new UserManagementApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new UserManagementApiError(
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

export async function listManagedUsers(
  user: FightboxSessionUser,
  query?: { gymId?: string; role?: string; status?: string },
): Promise<ManagedUserDto[]> {
  const params = new URLSearchParams();
  if (query?.gymId) params.set('gymId', query.gymId);
  if (query?.role) params.set('role', query.role);
  if (query?.status) params.set('status', query.status);

  const qs = params.toString();
  const path = qs
    ? `${USER_MANAGEMENT_API_PATHS.users}?${qs}`
    : USER_MANAGEMENT_API_PATHS.users;

  const body = await requestJson<ManagedUserListResponse>(path, user);
  return body.data;
}

export async function createManagedUser(
  manager: FightboxSessionUser,
  input: CreateManagedUserRequest,
): Promise<ManagedUserDto> {
  const body = await requestJson<ManagedUserItemResponse>(
    USER_MANAGEMENT_API_PATHS.users,
    manager,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return body.data;
}

export async function updateManagedUser(
  manager: FightboxSessionUser,
  userId: string,
  input: UpdateManagedUserRequest,
): Promise<ManagedUserDto> {
  const body = await requestJson<ManagedUserItemResponse>(
    `${USER_MANAGEMENT_API_PATHS.users}/${encodeURIComponent(userId)}`,
    manager,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return body.data;
}

export async function disableManagedUser(
  manager: FightboxSessionUser,
  userId: string,
): Promise<ManagedUserDto> {
  const body = await requestJson<ManagedUserItemResponse>(
    `${USER_MANAGEMENT_API_PATHS.users}/${encodeURIComponent(userId)}`,
    manager,
    { method: 'DELETE' },
  );
  return body.data;
}
