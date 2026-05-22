import type { FightboxSessionUser } from '@fightbox/shared';

export type { FightboxSessionUser };

export interface AuthSession {
  token: string;
  user: FightboxSessionUser;
}

export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthContextValue {
  user: FightboxSessionUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  setUser?: (user: FightboxSessionUser | null) => void;
}
