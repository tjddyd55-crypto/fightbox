import {
  FIGHTBOX_ROLE_LABELS,
  isFightboxUserRole,
  parseStaffPermissionsJson,
  type FightboxRequestContext,
  type FightboxUserRole,
} from '@fightbox/shared';

const DEFAULT_GYM_ID = 'demo-gym';
const DEFAULT_USER_ID = 'demo-coach';
const DEFAULT_USER_ROLE: FightboxUserRole = 'gym_admin';

function parseRole(raw: string | undefined): FightboxUserRole {
  const value = raw?.trim();
  if (value && isFightboxUserRole(value)) {
    return value;
  }
  return DEFAULT_USER_ROLE;
}

function parseStaffPermissionsFromEnv(
  raw: string | undefined,
): FightboxRequestContext['staffPermissions'] {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }
  try {
    return parseStaffPermissionsJson(value);
  } catch {
    console.warn('[fightbox] invalid VITE_FIGHTBOX_STAFF_PERMISSIONS JSON');
    return undefined;
  }
}

export function getFightboxClientContext(): FightboxRequestContext {
  const gymId = import.meta.env.VITE_FIGHTBOX_GYM_ID?.trim() || DEFAULT_GYM_ID;
  const userId = import.meta.env.VITE_FIGHTBOX_USER_ID?.trim() || DEFAULT_USER_ID;
  const role = parseRole(import.meta.env.VITE_FIGHTBOX_USER_ROLE);
  const staffPermissions = parseStaffPermissionsFromEnv(
    import.meta.env.VITE_FIGHTBOX_STAFF_PERMISSIONS,
  );

  return {
    gymId,
    userId,
    role,
    ...(staffPermissions ? { staffPermissions } : {}),
  };
}

export function getFightboxContextHeaders(): Record<string, string> {
  const context = getFightboxClientContext();
  const headers: Record<string, string> = {
    'x-gym-id': context.gymId,
    'x-user-id': context.userId,
    'x-user-role': context.role,
  };

  if (context.role === 'gym_staff' && context.staffPermissions) {
    headers['x-staff-permissions'] = JSON.stringify(context.staffPermissions);
  }

  return headers;
}

export function getFightboxRoleLabel(): string {
  return FIGHTBOX_ROLE_LABELS[getFightboxClientContext().role];
}

export function logFightboxClientContext(): void {
  const context = getFightboxClientContext();
  console.info(`[fightbox] role ${context.role} gym ${context.gymId} user ${context.userId}`);
}
