import { Router } from 'express';
import type { LoginRequest } from '@fightbox/shared';
import { authenticateRequest, requireBearerAuth } from '../middleware/authenticateRequest.js';
import { getAuthenticatedUser, loginWithPassword } from '../services/authService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';

const router = Router();

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

router.post('/login', async (req, res) => {
  try {
    const credentials = parseLoginBody(req.body);
    const result = await loginWithPassword(credentials.loginId, credentials.password);
    res.status(200).json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/me', authenticateRequest, requireBearerAuth, async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req.jwtPayload!.sub);
    res.status(200).json({ user });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
