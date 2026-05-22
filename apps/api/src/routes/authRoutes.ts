import { Router } from 'express';
import type { Response } from 'express';
import type { AuthAuditEventType, LoginRequest } from '@fightbox/shared';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { createAuthAuditLog } from '../repositories/authAuditLogRepository.js';
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

function normalizeAuditLoginId(loginId: string): string {
  return loginId.trim().toLowerCase();
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

function recordAuditEvent(input: {
  loginId: string;
  userId?: string | null;
  gymId?: string | null;
  role?: string | null;
  eventType: AuthAuditEventType;
  success: boolean;
  failureCode?: string | null;
  ipAddress: string;
  userAgent: string;
}): void {
  void createAuthAuditLog(input);
}

router.post('/login', async (req, res) => {
  const ip = extractClientIp(req);
  const userAgent = req.get('user-agent')?.trim() ?? '';
  let loginIdForLimit = extractLoginIdCandidate(req.body);
  const auditLoginId = normalizeAuditLoginId(loginIdForLimit || 'unknown-login');

  const rateCheck = checkLoginRateLimit(ip, loginIdForLimit);
  if (!rateCheck.allowed) {
    recordAuditEvent({
      loginId: auditLoginId,
      eventType: 'login_rate_limited',
      success: false,
      failureCode: 'AUTH_RATE_LIMITED',
      ipAddress: ip,
      userAgent,
    });
    sendRateLimited(res, rateCheck.retryAfterSec ?? 900);
    return;
  }

  try {
    const credentials = parseLoginBody(req.body);
    loginIdForLimit = credentials.loginId;
    const normalizedLoginId = normalizeAuditLoginId(credentials.loginId);
    const result = await loginWithPassword(credentials.loginId, credentials.password);
    clearLoginFailures(ip, credentials.loginId);
    recordAuditEvent({
      loginId: normalizedLoginId,
      userId: result.user.userId,
      gymId: result.user.gymId ?? null,
      role: result.user.role,
      eventType: 'login_success',
      success: true,
      failureCode: null,
      ipAddress: ip,
      userAgent,
    });
    res.status(200).json(result);
  } catch (error) {
    if (isLoginFailureError(error)) {
      recordLoginFailure(ip, loginIdForLimit);
      recordAuditEvent({
        loginId: normalizeAuditLoginId(loginIdForLimit || auditLoginId),
        eventType: 'login_failed',
        success: false,
        failureCode: error.code,
        ipAddress: ip,
        userAgent,
      });
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
