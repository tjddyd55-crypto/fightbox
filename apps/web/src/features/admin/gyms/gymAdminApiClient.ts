import {
  GYM_API_PATHS,
  type CreateGymRequest,
  type GymDto,
  type GymItemResponse,
  type GymListResponse,
  type UpdateGymRequest,
} from '@fightbox/shared';
import type { FightboxSessionUser } from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../../workout-program-builder/services/videoUploadConfig';

export class GymAdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'GymAdminApiError';
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

function getHeaders(user: FightboxSessionUser): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getFightboxContextHeadersForUser(user),
  };
}

async function parseApiError(response: Response): Promise<GymAdminApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new GymAdminApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new GymAdminApiError(
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
      ...getHeaders(user),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}

export async function listGyms(user: FightboxSessionUser): Promise<GymDto[]> {
  const body = await requestJson<GymListResponse>(GYM_API_PATHS.gyms, user);
  return body.data;
}

export async function createGym(
  user: FightboxSessionUser,
  input: CreateGymRequest,
): Promise<GymDto> {
  const body = await requestJson<GymItemResponse>(GYM_API_PATHS.gyms, user, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function updateGym(
  user: FightboxSessionUser,
  id: string,
  input: UpdateGymRequest,
): Promise<GymDto> {
  const body = await requestJson<GymItemResponse>(
    `${GYM_API_PATHS.gyms}/${encodeURIComponent(id)}`,
    user,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return body.data;
}

export async function deleteGym(user: FightboxSessionUser, id: string): Promise<void> {
  await requestJson<{ data: { id: string; deleted: boolean } }>(
    `${GYM_API_PATHS.gyms}/${encodeURIComponent(id)}`,
    user,
    { method: 'DELETE' },
  );
}
