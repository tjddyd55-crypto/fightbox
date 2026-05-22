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
import { clearSession, loadSession, saveSession } from './authSessionStorage';
import { loginWithDemoCredentials } from './demoAuthService';
import { hydrateStaffPermissionsForUser } from './staffPermissionHydrate';
import type { AuthContextValue } from './auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<FightboxSessionUser | null>(() => loadSession());

  const setUser = useCallback((next: FightboxSessionUser | null) => {
    setUserState(next);
    if (next) {
      saveSession(next);
    } else {
      clearSession();
    }
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    const sessionUser = await hydrateStaffPermissionsForUser(
      loginWithDemoCredentials(loginId, password),
    );
    saveSession(sessionUser);
    setUserState(sessionUser);
  }, []);

  // gym_staff: mount 시 DB 권한을 /me로 다시 불러와 세션 갱신 (관리자 변경 반영)
  useEffect(() => {
    if (!user || user.role !== 'gym_staff') {
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
        saveSession(hydrated);
        setUserState(hydrated);
      }
    });

    return () => {
      cancelled = true;
    };
    // staffPermissions 갱신 시 재호출 루프 방지 — userId/role 변경 시에만 hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.role]);

  const logout = useCallback(() => {
    clearSession();
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading: false,
      login,
      logout,
      setUser,
    }),
    [user, login, logout, setUser],
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
