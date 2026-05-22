import {
  inferAccountScopeFromRole,
  isFightboxAccountScope,
  isFightboxUserRole,
  type FightboxAccountScope,
  type FightboxSessionUser,
} from '@fightbox/shared';

const SESSION_STORAGE_KEY = 'fightbox.auth.session.v1';

interface StoredAuthSession {
  user: FightboxSessionUser;
  token?: string;
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseSessionUser(record: Record<string, unknown>): FightboxSessionUser | null {
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
}

function parseStoredSession(raw: string): StoredAuthSession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (record.user && typeof record.user === 'object' && !Array.isArray(record.user)) {
      const user = parseSessionUser(record.user as Record<string, unknown>);
      if (!user) {
        return null;
      }
      return {
        user,
        token: readOptionalString(record, 'token'),
      };
    }

    const legacyUser = parseSessionUser(record);
    if (!legacyUser) {
      return null;
    }
    return { user: legacyUser };
  } catch {
    return null;
  }
}

export function saveSession(user: FightboxSessionUser, token?: string): void {
  const payload: StoredAuthSession = {
    user,
    ...(token?.trim() ? { token: token.trim() } : {}),
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
}

export function loadSession(): FightboxSessionUser | null {
  return loadStoredSession()?.user ?? null;
}

export function loadAuthToken(): string | null {
  return loadStoredSession()?.token ?? null;
}

function loadStoredSession(): StoredAuthSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return parseStoredSession(raw);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
