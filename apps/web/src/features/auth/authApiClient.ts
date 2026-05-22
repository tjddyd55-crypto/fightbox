import {
  AUTH_API_PATHS,
  authUserDtoToSessionUser,
  type AuthMeResponse,
  type FightboxSessionUser,
  type LoginRequest,
  type LoginResponse,
} from '@fightbox/shared';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';
import { AuthError } from './auth.types';

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthApiError';
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
  if (!base) {
    throw new AuthError('API_NOT_CONFIGURED', 'VITE_API_BASE_URL is required for API login');
  }
  return `${base}${path}`;
}

async function parseApiError(response: Response): Promise<AuthApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new AuthApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new AuthApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

export async function loginWithApi(
  loginId: string,
  password: string,
): Promise<{ token: string; user: FightboxSessionUser }> {
  const body: LoginRequest = { loginId, password };

  let response: Response;
  try {
    response = await fetch(buildUrl(AUTH_API_PATHS.login), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('NETWORK_ERROR', '로그인 API에 연결할 수 없습니다.');
  }

  if (!response.ok) {
    const error = await parseApiError(response);
    if (error.code === 'INVALID_CREDENTIALS') {
      throw new AuthError('INVALID_CREDENTIALS', error.message);
    }
    throw new AuthError(error.code, error.message);
  }

  const payload = (await response.json()) as LoginResponse;
  return {
    token: payload.token,
    user: authUserDtoToSessionUser(payload.user),
  };
}

export async function fetchAuthMe(token: string): Promise<FightboxSessionUser> {
  let response: Response;
  try {
    response = await fetch(buildUrl(AUTH_API_PATHS.me), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AuthError('NETWORK_ERROR', '세션 확인 API에 연결할 수 없습니다.');
  }

  if (!response.ok) {
    const error = await parseApiError(response);
    throw new AuthError(error.code, error.message);
  }

  const payload = (await response.json()) as AuthMeResponse;
  return authUserDtoToSessionUser(payload.user);
}

export function getBearerAuthHeader(token: string | null | undefined): Record<string, string> {
  const trimmed = token?.trim();
  return trimmed ? { Authorization: `Bearer ${trimmed}` } : {};
}
