import type { NextFunction, Request, Response } from 'express';
import {
  type FightboxPermission,
  hasAnyFightboxPermission,
  hasFightboxPermission,
} from '@fightbox/shared';
import { ApiError, toErrorResponse } from '../utils/apiError.js';

function denyPermission(res: Response, permission: FightboxPermission): void {
  const { status, body } = toErrorResponse(
    new ApiError(403, 'FORBIDDEN', `Missing permission: ${permission}`),
  );
  res.status(status).json(body);
}

export function requirePermission(permission: FightboxPermission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!hasFightboxPermission(req.fightboxContext, permission)) {
      denyPermission(res, permission);
      return;
    }
    next();
  };
}

export function requireAnyPermission(permissions: FightboxPermission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!hasAnyFightboxPermission(req.fightboxContext, permissions)) {
      const label = permissions.join(' | ');
      const { status, body } = toErrorResponse(
        new ApiError(403, 'FORBIDDEN', `Missing permission: ${label}`),
      );
      res.status(status).json(body);
      return;
    }
    next();
  };
}
