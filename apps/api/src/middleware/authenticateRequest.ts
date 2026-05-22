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

export function authenticateRequest(req: Request, _res: Response, next: NextFunction): void {
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

export function requireBearerAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.jwtPayload) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authorization Bearer token is required'));
    return;
  }
  next();
}
