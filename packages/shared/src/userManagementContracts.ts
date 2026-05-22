import type { FightboxStaffPermissions, FightboxUserRole } from './authContext.js';

export type ManagedUserStatus = 'active' | 'disabled';

export interface ManagedUserDto {
  id: string;
  loginId: string;
  gymId: string;
  role: FightboxUserRole;
  displayName: string;
  status: ManagedUserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface CreateManagedUserRequest {
  loginId: string;
  password: string;
  gymId?: string;
  role: FightboxUserRole;
  displayName: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export interface UpdateManagedUserRequest {
  displayName?: string;
  role?: FightboxUserRole;
  status?: ManagedUserStatus;
  password?: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export interface ManagedUserListResponse {
  data: ManagedUserDto[];
}

export interface ManagedUserItemResponse {
  data: ManagedUserDto;
}

export const USER_MANAGEMENT_API_PATHS = {
  users: '/api/admin/users',
} as const;

export interface ListManagedUsersQuery {
  gymId?: string;
  role?: FightboxUserRole;
  status?: ManagedUserStatus;
}
