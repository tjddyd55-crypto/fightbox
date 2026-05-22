import {
  inferAccountScopeFromRole,
  isFightboxAccountScope,
  isFightboxUserRole,
  type FightboxAccountScope,
  type FightboxSessionUser,
} from '@fightbox/shared';

const SESSION_STORAGE_KEY = 'fightbox.auth.session.v1';

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function saveSession(user: FightboxSessionUser): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function loadSession(): FightboxSessionUser | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (
      typeof record.loginId !== 'string' ||
      typeof record.userId !== 'string' ||
      typeof record.role !== 'string' ||
      typeof record.displayName !== 'string' ||
      !isFightboxUserRole(record.role)
    ) {
      return null;
    }

    const role = record.role;
    const accountScopeRaw = readOptionalString(record, 'accountScope');
    let accountScope: FightboxAccountScope | undefined;
    if (accountScopeRaw) {
      if (!isFightboxAccountScope(accountScopeRaw)) {
        return null;
      }
      accountScope = accountScopeRaw;
    } else {
      accountScope = inferAccountScopeFromRole(role);
    }

    const gymId = readOptionalString(record, 'gymId');
    if (accountScope === 'gym' && !gymId) {
      return null;
    }

    const user: FightboxSessionUser = {
      loginId: record.loginId,
      userId: record.userId,
      role,
      displayName: record.displayName,
      accountScope,
      ...(gymId ? { gymId } : {}),
      gymCode: readOptionalString(record, 'gymCode'),
      gymName: readOptionalString(record, 'gymName'),
      creatorId: readOptionalString(record, 'creatorId'),
      creatorCode: readOptionalString(record, 'creatorCode'),
      creatorName: readOptionalString(record, 'creatorName'),
    };

    if (accountScope === 'creator') {
      if (!user.creatorId || !user.creatorCode || !user.creatorName) {
        return null;
      }
    }

    if (record.staffPermissions && typeof record.staffPermissions === 'object') {
      user.staffPermissions = record.staffPermissions as FightboxSessionUser['staffPermissions'];
    }

    return user;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
