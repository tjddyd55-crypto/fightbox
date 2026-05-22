import { DEMO_ACCOUNTS } from '@fightbox/shared';
import type { FightboxSessionUser } from '@fightbox/shared';
import { AuthError } from './auth.types';

export function loginWithDemoCredentials(
  loginId: string,
  password: string,
): FightboxSessionUser {
  const normalizedLoginId = loginId.trim();
  const account = DEMO_ACCOUNTS.find((item) => item.loginId === normalizedLoginId);

  if (!account || account.password !== password) {
    throw new AuthError('INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  return { ...account.user };
}
