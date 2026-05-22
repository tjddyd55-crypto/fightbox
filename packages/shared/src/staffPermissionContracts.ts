import type { FightboxStaffPermissions } from './authContext.js';

export const STAFF_PERMISSION_API_PATHS = {
  staffPermissions: '/api/gym/staff-permissions',
  staffPermissionsMe: '/api/gym/staff-permissions/me',
} as const;

export interface GymStaffPermissionDto {
  id: string;
  gymId: string;
  userId: string;
  loginId: string;
  displayName: string;
  permissions: FightboxStaffPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGymStaffPermissionsRequest {
  permissions: Partial<FightboxStaffPermissions>;
}

export interface GymStaffPermissionListResponse {
  data: GymStaffPermissionDto[];
}

export interface GymStaffPermissionItemResponse {
  data: GymStaffPermissionDto;
}

export interface MyStaffPermissionsResponse {
  data: GymStaffPermissionDto | null;
  permissions: FightboxStaffPermissions;
}

export const STAFF_PERMISSION_FIELD_KEYS = [
  'canUploadVideos',
  'canManageVideos',
  'canCreateTemplates',
  'canEditTemplates',
  'canDeleteTemplates',
  'canSubmitPublicTemplates',
] as const satisfies readonly (keyof FightboxStaffPermissions)[];
