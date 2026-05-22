import type { NextFunction, Request, Response } from 'express';
import {
  type FightboxRequestContext,
  isFightboxUserRole,
  parseStaffPermissionsJson,
} from '@fightbox/shared';
import {
  DEFAULT_ACTOR_ID,
  DEFAULT_GYM_ID,
  DEFAULT_USER_ROLE,
} from '../constants/workoutBuilderConstants.js';
import { ApiError } from '../utils/apiError.js';

function buildFightboxContext(req: Request): FightboxRequestContext {
  const gymId = req.header('x-gym-id')?.trim() || DEFAULT_GYM_ID;
  const userId = req.header('x-user-id')?.trim() || DEFAULT_ACTOR_ID;
  const roleRaw = req.header('x-user-role')?.trim() || DEFAULT_USER_ROLE;

  if (!isFightboxUserRole(roleRaw)) {
    throw new ApiError(400, 'INVALID_ROLE', `Invalid x-user-role: ${roleRaw}`);
  }

  const staffPermissionsHeader = req.header('x-staff-permissions')?.trim();
  let staffPermissions: FightboxRequestContext['staffPermissions'];

  if (staffPermissionsHeader) {
    try {
      staffPermissions = parseStaffPermissionsJson(staffPermissionsHeader);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid staff permissions JSON';
      throw new ApiError(400, 'INVALID_STAFF_PERMISSIONS', message);
    }
  }

  return {
    gymId,
    userId,
    role: roleRaw,
    ...(staffPermissions ? { staffPermissions } : {}),
  };
}

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    req.fightboxContext = buildFightboxContext(req);
    next();
  } catch (error) {
    next(error);
  }
}
