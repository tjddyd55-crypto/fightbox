import { ApiError } from '../utils/apiError.js';

const DEV_JWT_SECRET = 'dev-only-fightbox-jwt-secret';

export type AuthProviderMode = 'db' | 'header';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  authProvider: AuthProviderMode;
}

function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

function resolveJwtExpiresIn(): string {
  const duration = process.env.JWT_EXPIRES_IN?.trim();
  if (duration) {
    return duration;
  }

  const secondsRaw = process.env.JWT_EXPIRES_IN_SEC?.trim();
  if (secondsRaw) {
    const seconds = Number(secondsRaw);
    if (Number.isFinite(seconds) && seconds > 0) {
      return `${seconds}s`;
    }
  }

  return '12h';
}

function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (isProductionNodeEnv()) {
    throw new Error(
      'JWT_SECRET is required when NODE_ENV=production. Set a strong random value on the API service.',
    );
  }

  return DEV_JWT_SECRET;
}

function resolveAuthProvider(): AuthProviderMode {
  const raw = process.env.AUTH_PROVIDER?.trim().toLowerCase();
  return raw === 'header' ? 'header' : 'db';
}

let cachedConfig: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (!cachedConfig) {
    cachedConfig = {
      jwtSecret: resolveJwtSecret(),
      jwtExpiresIn: resolveJwtExpiresIn(),
      authProvider: resolveAuthProvider(),
    };
  }
  return cachedConfig;
}

export function getJwtSecret(): string {
  return getAuthConfig().jwtSecret;
}

export function getJwtExpiresIn(): string {
  return getAuthConfig().jwtExpiresIn;
}

/** @deprecated Prefer getJwtExpiresIn() — kept for callers expecting seconds */
export function getJwtExpiresInSec(): number {
  const raw = process.env.JWT_EXPIRES_IN_SEC?.trim();
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 43200;
}

export function assertAuthConfiguredForStartup(): void {
  try {
    getAuthConfig();
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(503, 'AUTH_NOT_CONFIGURED', error.message);
    }
    throw error;
  }
}
