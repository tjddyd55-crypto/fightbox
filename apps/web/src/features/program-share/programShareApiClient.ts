import {
  PROGRAM_SHARE_API_PATHS,
  WORKOUT_BUILDER_API_PATHS,
  type ProgramTemplateDto,
  type PublishProgramTemplateResponse,
  type PublishedProgramShareDto,
  type PublicProgramShareResponse,
  type UnpublishProgramTemplateResponse,
} from '@fightbox/shared';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';
import { getFightboxContextHeaders } from '../workout-program-builder/services/fightboxContextConfig';

export class ProgramShareApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ProgramShareApiError';
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

function templatePath(templateId: string, suffix: string): string {
  return `${WORKOUT_BUILDER_API_PATHS.templates}/${encodeURIComponent(templateId)}${suffix}`;
}

async function parseApiError(response: Response): Promise<ProgramShareApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ProgramShareApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new ProgramShareApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getFightboxContextHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as T;
}

export function buildClientShareUrl(shareToken: string): string {
  const origin = window.location.origin.replace(/\/$/, '');
  return `${origin}/share/programs/${encodeURIComponent(shareToken)}`;
}

export async function publishProgramTemplate(
  templateId: string,
): Promise<PublishProgramTemplateResponse['data']> {
  const response = await requestJson<PublishProgramTemplateResponse>(
    templatePath(templateId, '/publish'),
    { method: 'POST' },
  );
  return response.data;
}

export async function unpublishProgramTemplate(
  templateId: string,
): Promise<ProgramTemplateDto> {
  const response = await requestJson<UnpublishProgramTemplateResponse>(
    templatePath(templateId, '/unpublish'),
    { method: 'POST' },
  );
  return response.data.template;
}

export async function getSharedProgram(shareToken: string): Promise<PublishedProgramShareDto> {
  const path = PROGRAM_SHARE_API_PATHS.sharedProgram.replace(
    ':shareToken',
    encodeURIComponent(shareToken),
  );
  const response = await fetch(buildUrl(path), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const payload = (await response.json()) as PublicProgramShareResponse;
  return payload.data;
}
