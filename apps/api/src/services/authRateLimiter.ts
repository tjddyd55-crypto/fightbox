export interface AuthRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
  remainingAttempts?: number;
}

interface RateLimitEntry {
  count: number;
  firstFailedAt: number;
  blockedUntil?: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_MAP_SIZE = 10_000;

const failureStore = new Map<string, RateLimitEntry>();

function normalizeLoginId(loginId: string): string {
  const normalized = loginId.trim().toLowerCase();
  return normalized || 'unknown-login';
}

export function getLoginRateLimitKey(ip: string, loginId: string): string {
  const clientIp = ip.trim() || 'unknown';
  return `${clientIp}:${normalizeLoginId(loginId)}`;
}

function isEntryExpired(entry: RateLimitEntry, now: number): boolean {
  if (entry.blockedUntil !== undefined && entry.blockedUntil <= now) {
    return true;
  }
  return now - entry.firstFailedAt >= WINDOW_MS;
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of failureStore) {
    if (isEntryExpired(entry, now)) {
      failureStore.delete(key);
    }
  }

  if (failureStore.size <= MAX_MAP_SIZE) {
    return;
  }

  const overflow = failureStore.size - MAX_MAP_SIZE;
  const keys = failureStore.keys();
  for (let i = 0; i < overflow; i += 1) {
    const next = keys.next();
    if (next.done) {
      break;
    }
    failureStore.delete(next.value);
  }
}

function blockedRetryAfterSec(entry: RateLimitEntry, now: number): number {
  const blockedUntil = entry.blockedUntil ?? now + WINDOW_MS;
  return Math.max(1, Math.ceil((blockedUntil - now) / 1000));
}

function getOrResetEntry(key: string, now: number): RateLimitEntry {
  const existing = failureStore.get(key);
  if (!existing || isEntryExpired(existing, now)) {
    const fresh: RateLimitEntry = { count: 0, firstFailedAt: now };
    failureStore.set(key, fresh);
    return fresh;
  }
  return existing;
}

export function checkLoginRateLimit(ip: string, loginId: string): AuthRateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = getLoginRateLimitKey(ip, loginId);
  const entry = failureStore.get(key);
  if (!entry || isEntryExpired(entry, now)) {
    return { allowed: true, remainingAttempts: MAX_FAILURES };
  }

  if (entry.blockedUntil !== undefined && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: blockedRetryAfterSec(entry, now),
      remainingAttempts: 0,
    };
  }

  if (entry.count >= MAX_FAILURES) {
    entry.blockedUntil = now + WINDOW_MS;
    return {
      allowed: false,
      retryAfterSec: blockedRetryAfterSec(entry, now),
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILURES - entry.count),
  };
}

export function recordLoginFailure(ip: string, loginId: string): AuthRateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = getLoginRateLimitKey(ip, loginId);
  const entry = getOrResetEntry(key, now);
  entry.count += 1;

  if (entry.count >= MAX_FAILURES) {
    entry.blockedUntil = now + WINDOW_MS;
    return {
      allowed: false,
      retryAfterSec: blockedRetryAfterSec(entry, now),
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILURES - entry.count),
  };
}

export function clearLoginFailures(ip: string, loginId: string): void {
  failureStore.delete(getLoginRateLimitKey(ip, loginId));
}
