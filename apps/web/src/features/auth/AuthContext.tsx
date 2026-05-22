import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FightboxSessionUser } from '@fightbox/shared';
import { clearSession, loadSession, saveSession } from './authSessionStorage';
import { loginWithDemoCredentials } from './demoAuthService';
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
    const sessionUser = loginWithDemoCredentials(loginId, password);
    saveSession(sessionUser);
    setUserState(sessionUser);
  }, []);

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
