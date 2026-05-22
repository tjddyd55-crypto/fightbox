import {
  FIGHTBOX_ROLE_LABELS,
  inferAccountScopeFromRole,
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
  const accountScope = inferAccountScopeFromRole(role);

  return {
    gymId,
    userId,
    role,
    accountScope,
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

/** API request headers must be ASCII-safe; display names stay in session/UI only. */
export function buildFightboxContextHeaders(
  context: FightboxRequestContext,
): Record<string, string> {
  const accountScope =
    context.accountScope ?? inferAccountScopeFromRole(context.role);

  const headers: Record<string, string> = {
    'x-user-id': context.userId,
    'x-user-role': context.role,
    'x-account-scope': accountScope,
  };

  if (context.gymId) {
    headers['x-gym-id'] = context.gymId;
  }
  if (context.gymCode) {
    headers['x-gym-code'] = context.gymCode;
  }
  if (context.creatorId) {
    headers['x-creator-id'] = context.creatorId;
  }
  if (context.creatorCode) {
    headers['x-creator-code'] = context.creatorCode;
  }

  if (context.role === 'gym_staff') {
    headers['x-staff-permissions'] = JSON.stringify(context.staffPermissions ?? {});
  }

  return headers;
}

export function getFightboxContextHeaders(): Record<string, string> {
  return buildFightboxContextHeaders(getFightboxClientContext());
}

export function getFightboxContextHeadersForUser(user: FightboxSessionUser): Record<string, string> {
  return buildFightboxContextHeaders(sessionUserToRequestContext(user));
}

export function getFightboxRoleLabel(context?: FightboxRequestContext): string {
  const resolved = context ?? getFightboxClientContext();
  return FIGHTBOX_ROLE_LABELS[resolved.role];
}

export function getBuilderHeaderScopeLabel(user: FightboxSessionUser): string {
  const scope = user.accountScope ?? inferAccountScopeFromRole(user.role);

  switch (scope) {
    case 'platform':
      return '전체 관리자';
    case 'gym':
      return user.gymCode ?? user.gymId ?? '—';
    case 'creator':
      return user.creatorCode ?? user.creatorId ?? '—';
    default:
      return '—';
  }
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
  const scope = context.accountScope ?? inferAccountScopeFromRole(context.role);
  console.info(
    `[fightbox] scope ${scope} role ${context.role} gym ${context.gymId} user ${context.userId}`,
  );
}
