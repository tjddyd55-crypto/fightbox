export type FightboxUserRole =
  | 'super_admin'
  | 'gym_admin'
  | 'gym_staff'
  | 'video_creator';

export type FightboxAccountScope = 'platform' | 'gym' | 'creator';

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
  role: FightboxUserRole;
  displayName: string;
  accountScope?: FightboxAccountScope;
  gymId?: string;
  gymCode?: string;
  gymName?: string;
  creatorId?: string;
  creatorCode?: string;
  creatorName?: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

export interface FightboxRequestContext {
  gymId: string;
  userId: string;
  role: FightboxUserRole;
  accountScope?: FightboxAccountScope;
  gymCode?: string;
  gymName?: string;
  creatorId?: string;
  creatorCode?: string;
  creatorName?: string;
  staffPermissions?: Partial<FightboxStaffPermissions>;
}

/** Workout builder APIs still scope by gymId until ownerType/ownerId migration. */
export const CREATOR_SCOPE_GYM_FALLBACK = 'demo-gym';

export function inferAccountScopeFromRole(role: FightboxUserRole): FightboxAccountScope {
  switch (role) {
    case 'super_admin':
      return 'platform';
    case 'gym_admin':
    case 'gym_staff':
      return 'gym';
    case 'video_creator':
      return 'creator';
    default:
      return 'gym';
  }
}

function resolveGymIdForRequest(user: FightboxSessionUser): string {
  const trimmed = user.gymId?.trim();
  if (trimmed) {
    return trimmed;
  }

  const scope = user.accountScope ?? inferAccountScopeFromRole(user.role);
  if (scope === 'creator' || user.role === 'video_creator') {
    return CREATOR_SCOPE_GYM_FALLBACK;
  }

  return CREATOR_SCOPE_GYM_FALLBACK;
}

export function sessionUserToRequestContext(user: FightboxSessionUser): FightboxRequestContext {
  const accountScope = user.accountScope ?? inferAccountScopeFromRole(user.role);

  return {
    gymId: resolveGymIdForRequest(user),
    userId: user.userId,
    role: user.role,
    accountScope,
    ...(user.gymCode ? { gymCode: user.gymCode } : {}),
    ...(user.gymName ? { gymName: user.gymName } : {}),
    ...(user.creatorId ? { creatorId: user.creatorId } : {}),
    ...(user.creatorCode ? { creatorCode: user.creatorCode } : {}),
    ...(user.creatorName ? { creatorName: user.creatorName } : {}),
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
  | 'manageStaffPermissions'
  | 'manageGyms';

const VALID_ROLES: FightboxUserRole[] = [
  'super_admin',
  'gym_admin',
  'gym_staff',
  'video_creator',
];

const VALID_ACCOUNT_SCOPES: FightboxAccountScope[] = ['platform', 'gym', 'creator'];

export function isFightboxUserRole(value: string): value is FightboxUserRole {
  return VALID_ROLES.includes(value as FightboxUserRole);
}

export function isFightboxAccountScope(value: string): value is FightboxAccountScope {
  return VALID_ACCOUNT_SCOPES.includes(value as FightboxAccountScope);
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

export function canManageGyms(context: FightboxRequestContext): boolean {
  return context.role === 'super_admin';
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
    case 'manageGyms':
      return canManageGyms(context);
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
