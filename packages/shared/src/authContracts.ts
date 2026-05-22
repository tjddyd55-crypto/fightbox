import type {
  FightboxAccountScope,
  FightboxSessionUser,
  FightboxStaffPermissions,
  FightboxUserRole,
} from './authContext.js';

export const AUTH_API_PATHS = {
  login: '/api/auth/login',
  me: '/api/auth/me',
} as const;

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface AuthUserDto {
  loginId: string;
  userId: string;
  role: FightboxUserRole;
  displayName: string;
  accountScope: FightboxAccountScope;
  gymId?: string;
  gymCode?: string;
  gymName?: string;
  creatorId?: string;
  creatorCode?: string;
  creatorName?: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export interface LoginResponse {
  token: string;
  user: AuthUserDto;
}

export interface AuthMeResponse {
  user: AuthUserDto;
}

/** JWT payload — ASCII identifiers only (no display names). */
export interface FightboxJwtPayload {
  sub: string;
  role: FightboxUserRole;
  accountScope: FightboxAccountScope;
  gymId?: string;
  creatorId?: string;
  gymCode?: string;
  creatorCode?: string;
}

export function authUserDtoToSessionUser(dto: AuthUserDto): FightboxSessionUser {
  return {
    loginId: dto.loginId,
    userId: dto.userId,
    role: dto.role,
    displayName: dto.displayName,
    accountScope: dto.accountScope,
    ...(dto.gymId ? { gymId: dto.gymId } : {}),
    ...(dto.gymCode ? { gymCode: dto.gymCode } : {}),
    ...(dto.gymName ? { gymName: dto.gymName } : {}),
    ...(dto.creatorId ? { creatorId: dto.creatorId } : {}),
    ...(dto.creatorCode ? { creatorCode: dto.creatorCode } : {}),
    ...(dto.creatorName ? { creatorName: dto.creatorName } : {}),
    ...(dto.staffPermissions ? { staffPermissions: dto.staffPermissions } : {}),
  };
}
