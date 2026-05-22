import type { FightboxSessionUser } from '@fightbox/shared';

const SESSION_STORAGE_KEY = 'fightbox.auth.session.v1';

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
      typeof record.gymId !== 'string' ||
      typeof record.role !== 'string' ||
      typeof record.displayName !== 'string'
    ) {
      return null;
    }

    const user: FightboxSessionUser = {
      loginId: record.loginId,
      userId: record.userId,
      gymId: record.gymId,
      role: record.role as FightboxSessionUser['role'],
      displayName: record.displayName,
    };

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
