import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FightboxSessionUser } from '@fightbox/shared';
import { fetchAuthMe, loginWithApi } from './authApiClient';
import { isApiAuthEnabled } from './authConfig';
import { clearSession, loadAuthToken, loadSession, saveSession } from './authSessionStorage';
import { loginWithDemoCredentials } from './demoAuthService';
import { hydrateStaffPermissionsForUser } from './staffPermissionHydrate';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';
import type { AuthContextValue } from './auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

function shouldUseApiLogin(): boolean {
  return isApiAuthEnabled() && Boolean(getApiBaseUrl());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<FightboxSessionUser | null>(() => loadSession());
  const [loading, setLoading] = useState(() => Boolean(loadAuthToken()) && shouldUseApiLogin());

  const setUser = useCallback((next: FightboxSessionUser | null, token?: string) => {
    setUserState(next);
    if (next) {
      saveSession(next, token ?? loadAuthToken() ?? undefined);
    } else {
      clearSession();
    }
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    if (shouldUseApiLogin()) {
      const { token, user: sessionUser } = await loginWithApi(loginId, password);
      saveSession(sessionUser, token);
      setUserState(sessionUser);
      return;
    }

    const sessionUser = await hydrateStaffPermissionsForUser(
      loginWithDemoCredentials(loginId, password),
    );
    saveSession(sessionUser);
    setUserState(sessionUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUserState(null);
  }, []);

  useEffect(() => {
    const token = loadAuthToken();
    if (!token || !shouldUseApiLogin()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void fetchAuthMe(token)
      .then((hydrated) => {
        if (cancelled) {
          return;
        }
        saveSession(hydrated, token);
        setUserState(hydrated);
      })
      .catch((error) => {
        console.warn('[auth] failed to hydrate session from /api/auth/me', error);
        if (!cancelled) {
          clearSession();
          setUserState(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'gym_staff') {
      return;
    }

    const token = loadAuthToken();
    if (token && shouldUseApiLogin()) {
      return;
    }

    let cancelled = false;

    void hydrateStaffPermissionsForUser(user).then((hydrated) => {
      if (cancelled) {
        return;
      }
      const prev = JSON.stringify(user.staffPermissions ?? {});
      const next = JSON.stringify(hydrated.staffPermissions ?? {});
      if (prev !== next) {
        saveSession(hydrated, token ?? undefined);
        setUserState(hydrated);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      logout,
      setUser: (next) => setUser(next),
    }),
    [user, loading, login, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
