import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../services/authService.js';
import { ApiError } from '../utils/apiError.js';

function readBearerToken(req: Request): string | undefined {
  const header = req.header('authorization')?.trim();
  if (!header) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  return token || undefined;
}

/** Parses Bearer JWT when present; does not require authentication. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    req.jwtPayload = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

/** Requires a valid Bearer JWT on the request (use after optionalAuth). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.jwtPayload) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Authorization Bearer token is required'));
    return;
  }
  next();
}

/** @deprecated Use optionalAuth */
export const authenticateRequest = optionalAuth;

/** @deprecated Use requireAuth */
export const requireBearerAuth = requireAuth;
