import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthUserDto, FightboxJwtPayload, LoginResponse } from '@fightbox/shared';
import { isFightboxAccountScope, isFightboxUserRole } from '@fightbox/shared';
import { getJwtExpiresIn, getJwtSecret } from '../config/authConfig.js';
import { getGymStaffPermission } from '../repositories/gymStaffPermissionRepository.js';
import {
  findUserById,
  findUserByLoginId,
  updateLastLoginAt,
} from '../repositories/userRepository.js';
import { ApiError } from '../utils/apiError.js';

function buildJwtPayload(user: AuthUserDto): FightboxJwtPayload {
  const payload: FightboxJwtPayload = {
    sub: user.userId,
    role: user.role,
    accountScope: user.accountScope,
  };

  if (user.gymId) {
    payload.gymId = user.gymId;
  }
  if (user.creatorId) {
    payload.creatorId = user.creatorId;
  }
  if (user.gymCode) {
    payload.gymCode = user.gymCode;
  }
  if (user.creatorCode) {
    payload.creatorCode = user.creatorCode;
  }

  return payload;
}

function signAccessToken(payload: FightboxJwtPayload): string {
  const expiresIn = getJwtExpiresIn() as SignOptions['expiresIn'];
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

async function attachStaffPermissions(user: AuthUserDto): Promise<AuthUserDto> {
  if (user.role !== 'gym_staff' || !user.gymId) {
    return user;
  }

  const row = await getGymStaffPermission(user.gymId, user.userId);
  if (!row) {
    return user;
  }

  return {
    ...user,
    staffPermissions: row.permissions,
  };
}

export async function loginWithPassword(
  loginId: string,
  password: string,
): Promise<LoginResponse> {
  const record = await findUserByLoginId(loginId);
  if (!record) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  if (!record.isActive) {
    throw new ApiError(401, 'ACCOUNT_DISABLED', '비활성화된 계정입니다.');
  }

  const passwordMatches = await bcrypt.compare(password, record.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  const user = await attachStaffPermissions(record.user);
  const token = signAccessToken(buildJwtPayload(user));
  await updateLastLoginAt(record.id);

  return { token, user };
}

export function verifyAccessToken(token: string): FightboxJwtPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid access token');
    }

    const payload = decoded as Record<string, unknown>;
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    const roleRaw = payload.role;
    const accountScopeRaw = payload.accountScope;

    if (
      !sub ||
      typeof roleRaw !== 'string' ||
      typeof accountScopeRaw !== 'string' ||
      !isFightboxUserRole(roleRaw) ||
      !isFightboxAccountScope(accountScopeRaw)
    ) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid access token claims');
    }

    const result: FightboxJwtPayload = { sub, role: roleRaw, accountScope: accountScopeRaw };

    if (typeof payload.gymId === 'string' && payload.gymId.trim()) {
      result.gymId = payload.gymId.trim();
    }
    if (typeof payload.creatorId === 'string' && payload.creatorId.trim()) {
      result.creatorId = payload.creatorId.trim();
    }
    if (typeof payload.gymCode === 'string' && payload.gymCode.trim()) {
      result.gymCode = payload.gymCode.trim();
    }
    if (typeof payload.creatorCode === 'string' && payload.creatorCode.trim()) {
      result.creatorCode = payload.creatorCode.trim();
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired access token');
  }
}

export async function getAuthenticatedUser(userId: string): Promise<AuthUserDto> {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(401, 'USER_NOT_FOUND', 'User not found or inactive');
  }
  return attachStaffPermissions(user);
}

export async function resolveUserFromJwtPayload(payload: FightboxJwtPayload): Promise<AuthUserDto> {
  return getAuthenticatedUser(payload.sub);
}
