import type { NextFunction, Request, Response } from 'express';
import {
  CREATOR_SCOPE_GYM_FALLBACK,
  type FightboxAccountScope,
  type FightboxJwtPayload,
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
import { getGymStaffPermission } from '../repositories/gymStaffPermissionRepository.js';
import { ApiError } from '../utils/apiError.js';

function readHeader(req: Request, name: string): string | undefined {
  const value = req.header(name)?.trim();
  return value || undefined;
}

function resolveGymIdFromJwt(payload: FightboxJwtPayload): string {
  if (payload.gymId) {
    return payload.gymId;
  }
  if (payload.accountScope === 'creator' || payload.role === 'video_creator') {
    return CREATOR_SCOPE_GYM_FALLBACK;
  }
  return DEFAULT_GYM_ID;
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

async function buildContextFromJwt(payload: FightboxJwtPayload): Promise<FightboxRequestContext> {
  if (!isFightboxUserRole(payload.role)) {
    throw new ApiError(401, 'INVALID_TOKEN', `Invalid token role: ${payload.role}`);
  }

  const accountScope = payload.accountScope;
  if (!isFightboxAccountScope(accountScope)) {
    throw new ApiError(401, 'INVALID_TOKEN', `Invalid token account scope: ${accountScope}`);
  }

  const gymId = resolveGymIdFromJwt(payload);
  const context: FightboxRequestContext = {
    gymId,
    userId: payload.sub,
    role: payload.role,
    accountScope,
    ...(payload.gymCode ? { gymCode: payload.gymCode } : {}),
    ...(payload.creatorId ? { creatorId: payload.creatorId } : {}),
    ...(payload.creatorCode ? { creatorCode: payload.creatorCode } : {}),
  };

  if (payload.role === 'gym_staff') {
    const row = await getGymStaffPermission(gymId, payload.sub);
    if (row) {
      context.staffPermissions = row.permissions;
    }
  }

  return context;
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

export async function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.jwtPayload) {
      req.fightboxContext = await buildContextFromJwt(req.jwtPayload);
    } else {
      req.fightboxContext = buildFightboxContext(req);
    }
    next();
  } catch (error) {
    next(error);
  }
}
