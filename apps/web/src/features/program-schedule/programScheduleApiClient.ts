import {
  PROGRAM_SCHEDULE_API_PATHS,
  type CreateProgramScheduleEntryRequest,
  type ProgramScheduleEntriesResponse,
  type ProgramScheduleEntryDto,
  type ProgramScheduleEntryResponse,
  type UpdateProgramScheduleEntryRequest,
} from '@fightbox/shared';
import type { FightboxSessionUser } from '@fightbox/shared';
import { getFightboxContextHeadersForUser } from '../workout-program-builder/services/fightboxContextConfig';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';

export class ProgramScheduleApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ProgramScheduleApiError';
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

async function parseApiError(response: Response): Promise<ProgramScheduleApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ProgramScheduleApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new ProgramScheduleApiError(
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

export async function listProgramScheduleEntries(
  user: FightboxSessionUser,
): Promise<ProgramScheduleEntryDto[]> {
  const response = await requestJson<ProgramScheduleEntriesResponse>(
    PROGRAM_SCHEDULE_API_PATHS.entries,
    user,
  );
  return response.data;
}

export async function createProgramScheduleEntry(
  user: FightboxSessionUser,
  input: CreateProgramScheduleEntryRequest,
): Promise<ProgramScheduleEntryDto> {
  const response = await requestJson<ProgramScheduleEntryResponse>(
    PROGRAM_SCHEDULE_API_PATHS.entries,
    user,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function updateProgramScheduleEntry(
  user: FightboxSessionUser,
  id: string,
  input: UpdateProgramScheduleEntryRequest,
): Promise<ProgramScheduleEntryDto> {
  const path = PROGRAM_SCHEDULE_API_PATHS.entryById.replace(':id', encodeURIComponent(id));
  const response = await requestJson<ProgramScheduleEntryResponse>(path, user, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteProgramScheduleEntry(
  user: FightboxSessionUser,
  id: string,
): Promise<void> {
  const path = PROGRAM_SCHEDULE_API_PATHS.entryById.replace(':id', encodeURIComponent(id));
  await requestJson<{ data: { ok: boolean } }>(path, user, {
    method: 'DELETE',
  });
}
