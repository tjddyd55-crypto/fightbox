import {
  FIGHTBOX_ROLE_LABELS,
  isFightboxUserRole,
  parseStaffPermissionsJson,
  sessionUserToRequestContext,
  type FightboxRequestContext,
  type FightboxSessionUser,
  type FightboxUserRole,
} from '@fightbox/shared';
import { loadSession } from '../../auth/authSessionStorage';

const DEFAULT_GYM_ID = 'demo-gym';
const DEFAULT_USER_ID = 'demo-gym-admin';
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

function getEnvFallbackContext(): FightboxRequestContext {
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

export function getFightboxClientContextFromSession(): FightboxRequestContext | null {
  const user = loadSession();
  if (!user) {
    return null;
  }
  return sessionUserToRequestContext(user);
}

export function getFightboxClientContext(): FightboxRequestContext {
  return getFightboxClientContextFromSession() ?? getEnvFallbackContext();
}

export function getFightboxContextHeaders(): Record<string, string> {
  const context = getFightboxClientContext();
  const headers: Record<string, string> = {
    'x-gym-id': context.gymId,
    'x-user-id': context.userId,
    'x-user-role': context.role,
  };

  if (context.role === 'gym_staff') {
    headers['x-staff-permissions'] = JSON.stringify(context.staffPermissions ?? {});
  }

  return headers;
}

export function getFightboxRoleLabel(context?: FightboxRequestContext): string {
  const resolved = context ?? getFightboxClientContext();
  return FIGHTBOX_ROLE_LABELS[resolved.role];
}

export function getFightboxUserDisplayFromSession(): Pick<
  FightboxSessionUser,
  'loginId' | 'displayName' | 'role'
> | null {
  const user = loadSession();
  if (!user) {
    return null;
  }
  return {
    loginId: user.loginId,
    displayName: user.displayName,
    role: user.role,
  };
}

export function logFightboxClientContext(): void {
  const context = getFightboxClientContext();
  console.info(`[fightbox] role ${context.role} gym ${context.gymId} user ${context.userId}`);
}
