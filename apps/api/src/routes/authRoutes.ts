import { Router } from 'express';
import type { Response } from 'express';
import type { LoginRequest } from '@fightbox/shared';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { getAuthenticatedUser, loginWithPassword } from '../services/authService.js';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  recordLoginFailure,
} from '../services/authRateLimiter.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import { extractClientIp } from '../utils/requestIp.js';

const router = Router();

const AUTH_RATE_LIMIT_MESSAGE =
  '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';

function extractLoginIdCandidate(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return '';
  }

  const loginId = (body as Record<string, unknown>).loginId;
  return typeof loginId === 'string' ? loginId : '';
}

function sendRateLimited(res: Response, retryAfterSec: number): void {
  res.setHeader('Retry-After', String(retryAfterSec));
  res.status(429).json({
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: AUTH_RATE_LIMIT_MESSAGE,
    },
  });
}

function parseLoginBody(body: unknown): LoginRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
  }

  const record = body as Record<string, unknown>;
  const loginId = typeof record.loginId === 'string' ? record.loginId.trim() : '';
  const password = typeof record.password === 'string' ? record.password : '';

  if (!loginId || !password) {
    throw new ApiError(400, 'INVALID_BODY', 'loginId and password are required');
  }

  return { loginId, password };
}

function isLoginFailureError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.code === 'INVALID_CREDENTIALS' || error.code === 'ACCOUNT_DISABLED')
  );
}

router.post('/login', async (req, res) => {
  const ip = extractClientIp(req);
  let loginIdForLimit = extractLoginIdCandidate(req.body);

  const rateCheck = checkLoginRateLimit(ip, loginIdForLimit);
  if (!rateCheck.allowed) {
    sendRateLimited(res, rateCheck.retryAfterSec ?? 900);
    return;
  }

  try {
    const credentials = parseLoginBody(req.body);
    loginIdForLimit = credentials.loginId;
    const result = await loginWithPassword(credentials.loginId, credentials.password);
    clearLoginFailures(ip, credentials.loginId);
    res.status(200).json(result);
  } catch (error) {
    if (isLoginFailureError(error)) {
      recordLoginFailure(ip, loginIdForLimit);
    }

    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/me', optionalAuth, requireAuth, async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req.jwtPayload!.sub);
    res.status(200).json({ user });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
