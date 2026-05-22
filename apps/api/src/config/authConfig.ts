import { ApiError } from '../utils/apiError.js';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new ApiError(503, 'AUTH_NOT_CONFIGURED', 'JWT_SECRET is required for authentication');
  }
  return secret;
}

export function getJwtExpiresInSec(): number {
  const raw = process.env.JWT_EXPIRES_IN_SEC?.trim();
  const parsed = raw ? Number(raw) : 86400;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 86400;
  }
  return parsed;
}
