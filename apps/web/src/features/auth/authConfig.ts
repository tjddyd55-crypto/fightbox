export type AuthProvider = 'api' | 'demo';

export function getAuthProvider(): AuthProvider {
  const raw = import.meta.env.VITE_AUTH_PROVIDER?.trim();
  return raw === 'api' ? 'api' : 'demo';
}

export function isApiAuthEnabled(): boolean {
  return getAuthProvider() === 'api';
}
