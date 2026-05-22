export type FightboxUserRole =
  | 'super_admin'
  | 'gym_admin'
  | 'gym_staff'
  | 'video_creator';

export interface FightboxStaffPermissions {
  canUploadVideos: boolean;
  canManageVideos: boolean;
  canCreateTemplates: boolean;
  canEditTemplates: boolean;
  canDeleteTemplates: boolean;
  canSubmitPublicTemplates: boolean;
}

export interface FightboxSessionUser {
  loginId: string;
  userId: string;
  gymId: string;
  role: FightboxUserRole;
  displayName: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export interface FightboxRequestContext {
  gymId: string;
  userId: string;
  role: FightboxUserRole;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export function sessionUserToRequestContext(user: FightboxSessionUser): FightboxRequestContext {
  return {
    gymId: user.gymId,
    userId: user.userId,
    role: user.role,
    ...(user.staffPermissions ? { staffPermissions: user.staffPermissions } : {}),
  };
}

export const FIGHTBOX_ROLE_LABELS: Record<FightboxUserRole, string> = {
  super_admin: '슈퍼관리자',
  gym_admin: '체육관관리자',
  gym_staff: '체육관직원',
  video_creator: '운동영상 크리에이터',
};

export const DEFAULT_STAFF_PERMISSIONS: FightboxStaffPermissions = {
  canUploadVideos: false,
  canManageVideos: false,
  canCreateTemplates: false,
  canEditTemplates: false,
  canDeleteTemplates: false,
  canSubmitPublicTemplates: false,
};

export type FightboxPermission =
  | 'uploadVideos'
  | 'manageVideos'
  | 'createTemplates'
  | 'editTemplates'
  | 'deleteTemplates'
  | 'submitPublicTemplates'
  | 'reviewPublicTemplates'
  | 'manageStaffPermissions';

const VALID_ROLES: FightboxUserRole[] = [
  'super_admin',
  'gym_admin',
  'gym_staff',
  'video_creator',
];

export function isFightboxUserRole(value: string): value is FightboxUserRole {
  return VALID_ROLES.includes(value as FightboxUserRole);
}

function resolveStaffPermissions(context: FightboxRequestContext): FightboxStaffPermissions {
  if (context.role !== 'gym_staff') {
    return DEFAULT_STAFF_PERMISSIONS;
  }
  return {
    ...DEFAULT_STAFF_PERMISSIONS,
    ...context.staffPermissions,
  };
}

export function canUploadVideos(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
    case 'video_creator':
      return true;
    case 'gym_staff':
      return resolveStaffPermissions(context).canUploadVideos;
    default:
      return false;
  }
}

export function canManageVideos(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
    case 'video_creator':
      return true;
    case 'gym_staff':
      return resolveStaffPermissions(context).canManageVideos;
    default:
      return false;
  }
}

export function canCreateTemplates(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
    case 'video_creator':
      return true;
    case 'gym_staff':
      return resolveStaffPermissions(context).canCreateTemplates;
    default:
      return false;
  }
}

export function canEditTemplates(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
    case 'video_creator':
      return true;
    case 'gym_staff':
      return resolveStaffPermissions(context).canEditTemplates;
    default:
      return false;
  }
}

export function canDeleteTemplates(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
      return true;
    case 'video_creator':
      return false;
    case 'gym_staff':
      return resolveStaffPermissions(context).canDeleteTemplates;
    default:
      return false;
  }
}

export function canSubmitPublicTemplates(context: FightboxRequestContext): boolean {
  switch (context.role) {
    case 'super_admin':
    case 'gym_admin':
    case 'video_creator':
      return true;
    case 'gym_staff':
      return resolveStaffPermissions(context).canSubmitPublicTemplates;
    default:
      return false;
  }
}

export function canReviewPublicTemplates(context: FightboxRequestContext): boolean {
  return context.role === 'super_admin';
}

export function canManageStaffPermissions(context: FightboxRequestContext): boolean {
  return context.role === 'super_admin' || context.role === 'gym_admin';
}

export function hasFightboxPermission(
  context: FightboxRequestContext,
  permission: FightboxPermission,
): boolean {
  switch (permission) {
    case 'uploadVideos':
      return canUploadVideos(context);
    case 'manageVideos':
      return canManageVideos(context);
    case 'createTemplates':
      return canCreateTemplates(context);
    case 'editTemplates':
      return canEditTemplates(context);
    case 'deleteTemplates':
      return canDeleteTemplates(context);
    case 'submitPublicTemplates':
      return canSubmitPublicTemplates(context);
    case 'reviewPublicTemplates':
      return canReviewPublicTemplates(context);
    case 'manageStaffPermissions':
      return canManageStaffPermissions(context);
    default:
      return false;
  }
}

export function hasAnyFightboxPermission(
  context: FightboxRequestContext,
  permissions: FightboxPermission[],
): boolean {
  return permissions.some((permission) => hasFightboxPermission(context, permission));
}

export function parseStaffPermissionsJson(
  raw: string,
): Partial<FightboxStaffPermissions> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Staff permissions must be a JSON object');
  }

  const source = parsed as Record<string, unknown>;
  const result: Partial<FightboxStaffPermissions> = {};
  const keys: (keyof FightboxStaffPermissions)[] = [
    'canUploadVideos',
    'canManageVideos',
    'canCreateTemplates',
    'canEditTemplates',
    'canDeleteTemplates',
    'canSubmitPublicTemplates',
  ];

  for (const key of keys) {
    const value = source[key];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== 'boolean') {
      throw new Error(`Staff permission ${key} must be a boolean`);
    }
    result[key] = value;
  }

  return result;
}
