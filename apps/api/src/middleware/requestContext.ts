import type { NextFunction, Request, Response } from 'express';
import {
  CREATOR_SCOPE_GYM_FALLBACK,
  type FightboxAccountScope,
  type FightboxRequestContext,
  inferAccountScopeFromRole,
  isFightboxAccountScope,
  isFightboxUserRole,
  parseStaffPermissionsJson,
} from '@fightbox/shared';
import {
  DEFAULT_ACTOR_ID,
  DEFAULT_GYM_ID,
  DEFAULT_USER_ROLE,
} from '../constants/workoutBuilderConstants.js';
import { ApiError } from '../utils/apiError.js';

function readHeader(req: Request, name: string): string | undefined {
  const value = req.header(name)?.trim();
  return value || undefined;
}

function resolveGymId(
  req: Request,
  role: FightboxRequestContext['role'],
  accountScope: FightboxAccountScope,
): string {
  const headerGymId = readHeader(req, 'x-gym-id');
  if (headerGymId) {
    return headerGymId;
  }

  if (accountScope === 'creator' || role === 'video_creator') {
    return CREATOR_SCOPE_GYM_FALLBACK;
  }

  return DEFAULT_GYM_ID;
}

function buildFightboxContext(req: Request): FightboxRequestContext {
  const userId = readHeader(req, 'x-user-id') || DEFAULT_ACTOR_ID;
  const roleRaw = readHeader(req, 'x-user-role') || DEFAULT_USER_ROLE;

  if (!isFightboxUserRole(roleRaw)) {
    throw new ApiError(400, 'INVALID_ROLE', `Invalid x-user-role: ${roleRaw}`);
  }

  const role = roleRaw;
  const accountScopeHeader = readHeader(req, 'x-account-scope');
  let accountScope: FightboxAccountScope;

  if (accountScopeHeader) {
    if (!isFightboxAccountScope(accountScopeHeader)) {
      throw new ApiError(400, 'INVALID_ACCOUNT_SCOPE', `Invalid x-account-scope: ${accountScopeHeader}`);
    }
    accountScope = accountScopeHeader;
  } else {
    accountScope = inferAccountScopeFromRole(role);
  }

  const gymId = resolveGymId(req, role, accountScope);
  const gymCode = readHeader(req, 'x-gym-code');
  const gymName = readHeader(req, 'x-gym-name');
  const creatorId = readHeader(req, 'x-creator-id');
  const creatorCode = readHeader(req, 'x-creator-code');
  const creatorName = readHeader(req, 'x-creator-name');

  const staffPermissionsHeader = readHeader(req, 'x-staff-permissions');
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
    role,
    accountScope,
    ...(gymCode ? { gymCode } : {}),
    ...(gymName ? { gymName } : {}),
    ...(creatorId ? { creatorId } : {}),
    ...(creatorCode ? { creatorCode } : {}),
    ...(creatorName ? { creatorName } : {}),
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
